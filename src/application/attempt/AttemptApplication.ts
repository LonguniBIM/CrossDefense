import type { ResultsRepository } from '../results/ResultsRepository';
import type { CombatRewards } from '../../domain/combat/content';
import type { AttemptRepository } from './AttemptRepository';
import type { ContentPackApplication } from '../content/ContentPackApplication';
import type { BuildApplication } from '../build/BuildApplication';
import { APP_VERSION } from '../version';
import type { ActiveRun } from '../../domain/run/run';
import type { PilotProfile } from '../../domain/workspace/pilot';
import type { ContentPackManifest, LaunchMap } from '../../domain/content/contentPack';
import { DEFAULT_DIFFICULTY, type Difficulty } from '../../domain/attempt/rules';
import { AttemptRejection, assertAttemptState, launchEligibility, startRequestFingerprint, attemptFingerprint, type StartAttemptRequest, type StartAttemptCommand, type EndAttemptCommand, type DifficultyCommand } from '../../domain/attempt/attempt';
import { RunOperationConflictError } from '../run/RunRepository';

export interface MapSelection {
  run: ActiveRun; difficulty: Difficulty; maps: LaunchMap[]; mapId: string;
  blockers: string[]; noOffense: boolean; contentMessage: string | null;
  capability: 'combat' | 'launch-recovery-only' | null;
  rewards?: CombatRewards | undefined; firstClearEligible?: boolean | undefined;
}
interface PendingStart { request: StartAttemptRequest; command?: StartAttemptCommand; pack?: ContentPackManifest; completed?: ActiveRun; }

/** One Application gate owns startup identity, durable retries and the Build handoff. */
export class AttemptApplication {
  private tail: Promise<void> = Promise.resolve();
  private admitted: PendingStart | null = null;
  private pendingDifficulty: DifficultyCommand | null = null;
  private pendingEnd: EndAttemptCommand | null = null;
  constructor(private readonly repository: AttemptRepository, private readonly content: ContentPackApplication,
    private readonly generateId: () => string, private readonly now: () => string = () => new Date().toISOString(),
    private readonly build?: BuildApplication, private readonly results?: Pick<ResultsRepository,'getResults'>) {}

  async selection(pilotId: string): Promise<MapSelection> {
    const run=await this.repository.getActiveRun(pilotId), pilot=await this.repository.getPilot(pilotId);
    if (!run||!pilot) throw new AttemptRejection('PILOT_REQUIRED','Choose a saved Pilot and Run.');
    const pack=await this.content.getPack(run.contentVersion,run.rulesetVersion);
    const maps=pack?.launch?.maps??[], mapId=maps.some(m=>m.mapId===run.attempt?.mapId)?run.attempt!.mapId:maps[0]?.mapId??'';
    const contentMessage=maps.length?null:'This Run is preserved and editable. Its pinned content has no launch/recovery Map. Use a new Pilot/Run for the new development pack.';
    const readiness=pack?launchEligibility(run,pack,mapId):{blockers:['Pinned content is unavailable. Restore it before starting.'],noOffense:false};
    const rewardState=this.results&&pack?.combat?await this.results.getResults(pilotId):null;
    return structuredClone({run,difficulty:pilot.lastDifficulty??DEFAULT_DIFFICULTY,maps,mapId,...readiness,contentMessage,capability:pack?.launch?.capability??null,rewards:pack?.combat?.rewards,firstClearEligible:rewardState?!rewardState.economy.firstClearMapIds.includes(mapId):undefined});
  }

  start(request: StartAttemptRequest): Promise<ActiveRun> {
    try {
      const input=structuredClone(request), key=startRequestFingerprint(input);
      if (this.pendingDifficulty||this.pendingEnd) throw new AttemptRejection('SAVE_PENDING','Retry the pending operation first.');
      if (this.admitted && startRequestFingerprint(this.admitted.request)!==key) throw new AttemptRejection('SAVE_PENDING','The current Start must finish before another selection.');
      if (this.admitted && this.admitted.request.operationId!==input.operationId) throw new AttemptRejection('SAVE_PENDING','Retry the same Start operation.');
      if (!this.admitted) {
        if (this.build) {
          const snapshot=this.build.snapshot();
          if (snapshot.run.pilotId!==input.pilotId||snapshot.run.runId!==input.runId|| (snapshot.run.shipBuild?.revision??0)!==input.expectedBuildRevision) throw new AttemptRejection('STALE_BUILD','Reopen Map selection from the current Build.');
          this.build.holdForAttemptStart();
        }
        this.admitted={request:input};
      }
      return this.serialize(()=>this.executeStart());
    } catch(error) { return Promise.reject(error); }
  }

  private async executeStart(): Promise<ActiveRun> {
    const entry=this.admitted;
    if (!entry) throw new AttemptRejection('NO_PENDING_START','There is no Start awaiting Retry.');
    if (entry.completed) {
      // A completed receipt proves identity, not that its old running projection is still current.
      const current = await this.repository.getStartedRun(entry.request);
      if (!current) throw new Error('The committed Start receipt is unavailable; cached state is not authoritative.');
      assertAttemptState(current);
      return structuredClone(current);
    }
    try {
      const recorded=await this.repository.getStartedRun(entry.request);
      if (recorded) { assertAttemptState(recorded); this.build?.completeAttemptStart(); entry.completed=recorded; return structuredClone(recorded); }
      if (!entry.command) {
        const run=await this.repository.getActiveRun(entry.request.pilotId);
        if (!run||run.runId!==entry.request.runId) throw new AttemptRejection('TARGET_MISMATCH','The saved Run changed.');
        const pack=await this.content.getPack(run.contentVersion,run.rulesetVersion);
        if (!pack) throw new AttemptRejection('CONTENT_REQUIRED','The pinned content is unavailable.');
        entry.pack=pack;
        entry.command={...entry.request,kind:'start-attempt',attemptId:this.generateId(),seed:this.generateId(),appVersion:APP_VERSION,startedAt:this.now(),contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion};
      }
      const run=await this.repository.startAttempt(entry.command,entry.pack!);
      assertAttemptState(run);
      this.build?.completeAttemptStart(); entry.completed=run;
      return structuredClone(run);
    } catch(error) {
      if (error instanceof AttemptRejection || error instanceof RunOperationConflictError) { this.build?.releaseAttemptStart(); this.admitted=null; }
      // Infrastructure failure keeps startup seed/time/identity and the frozen Build admission.
      throw error;
    }
  }

  chooseDifficulty(command: Omit<DifficultyCommand,'kind'>): Promise<PilotProfile> {
    const input:DifficultyCommand={...command,kind:'set-difficulty'};
    try {
      const fingerprint=attemptFingerprint(input);
      if (this.admitted||this.pendingEnd || this.pendingDifficulty && (this.pendingDifficulty.operationId!==input.operationId || attemptFingerprint(this.pendingDifficulty)!==fingerprint)) throw new AttemptRejection('SAVE_PENDING','Retry the pending operation before changing difficulty.');
      this.pendingDifficulty=input;
      return this.serialize(async()=>{
        try { const pilot=await this.repository.setDifficulty(input); this.pendingDifficulty=null; return pilot; }
        catch(error) { if(error instanceof AttemptRejection||error instanceof RunOperationConflictError) this.pendingDifficulty=null; throw error; }
      });
    } catch(error) { return Promise.reject(error); }
  }

  end(command: Omit<EndAttemptCommand,'endedAt'>): Promise<ActiveRun> {
    try {
      if (this.pendingDifficulty || this.admitted && !this.admitted.completed) throw new AttemptRejection('SAVE_PENDING','Retry the pending operation before ending the Attempt.');
      if (this.pendingEnd && JSON.stringify({...this.pendingEnd,endedAt:undefined})!==JSON.stringify({...command,endedAt:undefined})) throw new AttemptRejection('SAVE_PENDING','Retry the same end operation.');
      this.pendingEnd??={...command,endedAt:this.now()};
      const input=this.pendingEnd; attemptFingerprint(input);
      return this.serialize(async()=>{
        try { const run=await this.repository.endAttempt(input); assertAttemptState(run); this.pendingEnd=null; return run; }
        catch(error) { if(error instanceof AttemptRejection||error instanceof RunOperationConflictError) this.pendingEnd=null; throw error; }
      });
    } catch(error) { return Promise.reject(error); }
  }

  /** Called only during owned Workspace bootstrap, not when entering an active diagnostic. */
  async recoverAtStartup(): Promise<void> {
    for (const run of await this.repository.getRunningAttempts()) {
      assertAttemptState(run);
      if (!run.attempt) throw Error('Running Attempt metadata is missing.');
      await this.end({kind:'interrupt-attempt',operationId:'recover-attempt:'+run.attempt.attemptId,pilotId:run.pilotId,runId:run.runId,attemptId:run.attempt.attemptId});
    }
  }
  hasPendingSave(): boolean { return !!(this.pendingDifficulty||this.pendingEnd||this.admitted&&!this.admitted.completed); }
  retryStart(): Promise<ActiveRun> { return this.admitted?this.start(this.admitted.request):Promise.reject(new AttemptRejection('NO_PENDING_START','No Start is awaiting Retry.')); }
  retryDifficulty(): Promise<PilotProfile> { return this.pendingDifficulty?this.chooseDifficulty(this.pendingDifficulty):Promise.reject(new AttemptRejection('NO_PENDING_SAVE','No difficulty is awaiting Retry.')); }
  retryEnd(): Promise<ActiveRun> { return this.pendingEnd?this.end(this.pendingEnd):Promise.reject(new AttemptRejection('NO_PENDING_SAVE','No Attempt end is awaiting Retry.')); }
  private serialize<T>(action:()=>Promise<T>): Promise<T> { const result=this.tail.then(action); this.tail=result.then(()=>undefined,()=>undefined); return result; }
}
