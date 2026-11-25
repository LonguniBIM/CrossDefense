import { retainedTiles } from '../run/cargo';
import type { ActiveRun } from '../run/run';
import { COMBAT_RULESET_VERSION } from '../combat/rules';
import { assertCombatDefinition, type CombatDefinition } from '../combat/content';
import { combatPayloadEntries } from '../combat/payload';
import type { ContentPackManifest, BuildContent, LaunchMap } from '../content/contentPack';
import { MODULE_SUBTYPES } from '../content/contentPack';
import { assertBuildState, projectBuild, type TilePlacement } from '../build/shipBuild';
import { createSalvageState, sameSalvagePool, type StarterTile } from '../preRun/salvage';
import { ATTEMPT_RULESET_VERSION, isDifficulty, type Difficulty } from './rules';

export interface AttemptStartup {
  capability: 'launch-recovery-only' | 'combat'; contentDigest: string; technologyLevel: 1;
  combat?: CombatDefinition | undefined; supportedSpellings?: BuildContent['supportedSpellings'] | undefined;
  hull: BuildContent['hull']; placements: TilePlacement[]; buildRevision: number;
  retainedTiles: StarterTile[]; map: LaunchMap;
}
export interface AttemptEnvelope {
  attemptId: string; pilotId: string; runId: string; mapId: string; difficulty: Difficulty;
  seed: string; appVersion: string; rulesetVersion: string; contentVersion: string;
  startedAt: string; status: 'running' | 'interrupted' | 'abandoned' | 'victory' | 'failed'; endedAt?: string | undefined;
  combatProgress?: { revision:number; lastCommittedTick:number; collectedIds:string[] } | undefined;
  startup: AttemptStartup;
}
export interface StartAttemptRequest {
  operationId: string; pilotId: string; runId: string; mapId: string; difficulty: Difficulty;
  expectedBuildRevision: number; confirmNoOffense: boolean;
}
export interface StartAttemptCommand extends StartAttemptRequest {
  kind: 'start-attempt'; attemptId: string; seed: string; appVersion: string;
  startedAt: string; contentVersion: string; rulesetVersion: string;
}
export interface EndAttemptCommand {
  kind: 'interrupt-attempt' | 'abandon-attempt'; operationId: string; attemptId: string;
  pilotId: string; runId: string; endedAt: string;
}
export interface DifficultyCommand { kind: 'set-difficulty'; operationId: string; pilotId: string; difficulty: Difficulty; }
export class AttemptRejection extends Error { constructor(readonly code: string, message: string) { super(message); } }
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const time = (value: unknown) => nonempty(value) && Number.isFinite(Date.parse(value));
const positionsKey = (positions: readonly TilePlacement[]) => JSON.stringify([...positions].sort((a,b)=>a.y-b.y||a.x-b.x).map(p=>[p.tileId,p.x,p.y]));
const tileKey = (tiles: readonly StarterTile[]) => JSON.stringify([...tiles].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(t=>[t.id,t.letter,t.subtype]));

export function startRequestFingerprint(request: StartAttemptRequest): string {
  if (![request.operationId,request.pilotId,request.runId,request.mapId].every(nonempty) || !isDifficulty(request.difficulty) ||
      !Number.isSafeInteger(request.expectedBuildRevision) || request.expectedBuildRevision < 0 || typeof request.confirmNoOffense !== 'boolean') {
    throw new AttemptRejection('INVALID_START', 'Start requires a valid Pilot, Run, Map, difficulty and saved Build revision.');
  }
  return JSON.stringify([request.pilotId,request.runId,request.mapId,request.difficulty,request.expectedBuildRevision,request.confirmNoOffense]);
}
export function attemptFingerprint(command: StartAttemptCommand | EndAttemptCommand | DifficultyCommand): string {
  if (!nonempty(command.operationId) || !nonempty(command.pilotId)) throw new AttemptRejection('INVALID_OPERATION','A durable operation needs an ID and Pilot.');
  if (command.kind === 'start-attempt') {
    if (![command.attemptId,command.seed,command.contentVersion,command.rulesetVersion].every(nonempty) || !time(command.startedAt) || !/^\d+\.\d+\.\d+$/.test(command.appVersion)) throw new AttemptRejection('INVALID_START','Attempt metadata is invalid.');
    return JSON.stringify([command.kind,startRequestFingerprint(command),command.attemptId,command.seed,command.appVersion,command.startedAt,command.contentVersion,command.rulesetVersion]);
  }
  if (command.kind === 'set-difficulty') {
    if (!isDifficulty(command.difficulty)) throw new AttemptRejection('INVALID_DIFFICULTY','Choose a supported difficulty.');
    return JSON.stringify([command.kind,command.pilotId,command.difficulty]);
  }
  if (!['interrupt-attempt','abandon-attempt'].includes(command.kind) || !nonempty(command.attemptId) || !nonempty(command.runId) || !time(command.endedAt)) throw new AttemptRejection('INVALID_END','Attempt recovery metadata is invalid.');
  return JSON.stringify([command.kind,command.pilotId,command.runId,command.attemptId,command.endedAt]);
}

/** Check saved identity/status without content cache. Wall-clock corrections never determine lifecycle order. */
export function assertAttemptState(run: ActiveRun): void {
  const envelope=run.attempt;
  if (!envelope) { if (run.phase === 'attempt') throw Error('Active Attempt envelope is missing.'); return; }
  if (run.phase === 'pre-run-salvage' || envelope.pilotId!==run.pilotId || envelope.runId!==run.runId ||
      envelope.contentVersion!==run.contentVersion || envelope.rulesetVersion!==run.rulesetVersion || ![ATTEMPT_RULESET_VERSION,COMBAT_RULESET_VERSION].includes(envelope.rulesetVersion) ||
      !isDifficulty(envelope.difficulty) || ![envelope.attemptId,envelope.seed,envelope.appVersion,envelope.mapId].every(nonempty) || !time(envelope.startedAt) ||
      !['running','interrupted','abandoned','victory','failed'].includes(envelope.status) || (run.phase==='attempt')!==(envelope.status==='running') ||
      (envelope.status==='running' ? envelope.endedAt!==undefined : !time(envelope.endedAt))) throw Error('Saved Attempt identity, status or versions are inconsistent.');
  const s=envelope.startup;
  if (!s || !['launch-recovery-only','combat'].includes(s.capability) || !/^[a-f0-9]{64}$/.test(s.contentDigest) || s.technologyLevel!==1 ||
      s.map.mapId!==envelope.mapId || !s.map.initiallyAvailable || !nonempty(s.map.name) || !Number.isSafeInteger(s.buildRevision) || s.buildRevision<0 ||
      !nonempty(s.hull.id) || s.hull.width!==5 || s.hull.height!==5 || s.hull.cells.length!==13 ||
      new Set(s.hull.cells.map(c=>c.x+':'+c.y)).size!==13 || s.hull.cells.some(c=>!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.x<0||c.x>4||c.y<0||c.y>4) ||
      s.retainedTiles.length>24 || new Set(s.retainedTiles.map(t=>t.id)).size!==s.retainedTiles.length ||
      s.retainedTiles.some(t=>!nonempty(t.id)||!/^[A-Z]$/.test(t.letter)||!(MODULE_SUBTYPES as readonly string[]).includes(t.subtype)) ||
      s.placements.length>13 || new Set(s.placements.map(p=>p.tileId)).size!==s.placements.length || new Set(s.placements.map(p=>p.x+':'+p.y)).size!==s.placements.length ||
      s.placements.some(p=>!s.retainedTiles.some(t=>t.id===p.tileId)||!s.hull.cells.some(c=>c.x===p.x&&c.y===p.y))) throw Error('Saved Attempt startup inputs are invalid.');
  if(s.capability==='combat') {
    if(envelope.rulesetVersion!==COMBAT_RULESET_VERSION||!s.combat||!s.supportedSpellings?.length||s.combat.mapId!==envelope.mapId) throw Error('Combat startup definitions are missing or incompatible.');
    if(s.supportedSpellings.some(w=>!/^[A-Z]{3,}$/.test(w.spelling)||w.cefr!=='Unknown')||new Set(s.supportedSpellings.map(w=>w.spelling)).size!==s.supportedSpellings.length)throw Error('Invalid frozen supported spellings.');
    assertCombatDefinition(s.combat,{hull:s.hull,supportedSpellings:s.supportedSpellings});
    const progress=envelope.combatProgress, entries=combatPayloadEntries(envelope.attemptId,s.combat);
    if(!progress||!Number.isSafeInteger(progress.revision)||progress.revision<0||progress.revision>25||!Number.isSafeInteger(progress.lastCommittedTick)||progress.lastCommittedTick<0||
       new Set(progress.collectedIds).size!==progress.collectedIds.length||progress.collectedIds.some(id=>!entries.some(e=>e.id===id)))throw Error('Invalid committed combat progress.');
    if(envelope.status==='running'&&tileKey(entries.filter(e=>progress.collectedIds.includes(e.id)))!==tileKey(run.salvageBuffer??[]))throw Error('Running combat loot differs from its committed buffer.');
  } else if(envelope.rulesetVersion!==ATTEMPT_RULESET_VERSION||s.combat!==undefined||s.supportedSpellings!==undefined||envelope.combatProgress!==undefined||['victory','failed'].includes(envelope.status)) {
    throw Error('A diagnostic Attempt cannot borrow combat capability.');
  }
  if (envelope.status==='running' && (positionsKey(s.placements)!==positionsKey(run.shipBuild?.placements??[]) || s.buildRevision!==(run.shipBuild?.revision??0) ||
      s.hull.id!==(run.shipBuild?.hullId??s.hull.id) || tileKey(s.retainedTiles)!==tileKey(retainedTiles(run)))) throw Error('A running Attempt cannot diverge from its frozen Build inputs.');
}

export function launchEligibility(run: ActiveRun, pack: ContentPackManifest, mapId: string): { blockers: string[]; noOffense: boolean } {
  assertBuildState(run,pack.build); assertAttemptState(run);
  const blockers:string[]=[];
  if (run.phase!=='build' || !run.salvage?.completed) blockers.push('Finish Pre-Run and return to Build before starting a Map.');
  if (run.salvageBuffer?.length) blockers.push('Resolve all Salvage before starting another Attempt.');
  if (pack.contentVersion!==run.contentVersion || pack.compatibleRuleset!==run.rulesetVersion || !((run.rulesetVersion===ATTEMPT_RULESET_VERSION&&pack.launch?.capability==='launch-recovery-only')||(run.rulesetVersion===COMBAT_RULESET_VERSION&&pack.launch?.capability==='combat'&&pack.combat)) || !pack.launch?.maps.some(m=>m.mapId===mapId&&m.initiallyAvailable) || !pack.build) blockers.push('This Run has no compatible Map in its pinned content.');
  if (!pack.build) return {blockers,noOffense:false};
  const summary=projectBuild(run,pack.build);
  if (summary.power.available<summary.power.required) blockers.push('Available Power is below Required Power.');
  return {blockers,noOffense:!summary.equipped.some(t=>['Ballistic','Missile','Laser'].includes(t.subtype))};
}

/** Validated canonical transition: no live combat, victory, reward or economy mutation. */
export function applyStartAttempt(run: ActiveRun, pack: ContentPackManifest, command: StartAttemptCommand): ActiveRun {
  attemptFingerprint(command);
  if (command.pilotId!==run.pilotId || command.runId!==run.runId || command.contentVersion!==run.contentVersion || command.rulesetVersion!==run.rulesetVersion) throw new AttemptRejection('TARGET_MISMATCH','Attempt must target the saved Pilot, Run and content pins.');
  if (command.expectedBuildRevision!==(run.shipBuild?.revision??0)) throw new AttemptRejection('STALE_BUILD','The saved Build changed. Reopen Map selection.');
  const eligibility=launchEligibility(run,pack,command.mapId);
  if (eligibility.blockers.length) throw new AttemptRejection('LAUNCH_BLOCKED',eligibility.blockers.join(' '));
  if (eligibility.noOffense&&!command.confirmNoOffense) throw new AttemptRejection('NO_OFFENSE_CONFIRMATION','No offensive output. Confirm Start anyway to continue.');
  if (!run.salvage || !sameSalvagePool(run.salvage,createSalvageState(run,pack.preRun))) throw new AttemptRejection('STARTER_MISMATCH','The saved starter does not match pinned content.');
  const next=structuredClone(run);
  next.phase='attempt';
  next.attempt={attemptId:command.attemptId,pilotId:run.pilotId,runId:run.runId,mapId:command.mapId,difficulty:command.difficulty,seed:command.seed,appVersion:command.appVersion,
    rulesetVersion:run.rulesetVersion,contentVersion:run.contentVersion,startedAt:command.startedAt,status:'running',
    startup:{capability:pack.launch!.capability,contentDigest:pack.integrity.manifestSha256,technologyLevel:1,hull:structuredClone(pack.build!.hull),
      placements:structuredClone(run.shipBuild?.placements??[]),buildRevision:command.expectedBuildRevision,retainedTiles:retainedTiles(run),map:structuredClone(pack.launch!.maps.find(m=>m.mapId===command.mapId)!)} };
  if(pack.launch!.capability==='combat') {
    if(!pack.combat)throw new AttemptRejection('CONTENT_REQUIRED','Combat definitions are required.');
    next.attempt.startup.combat=structuredClone(pack.combat);
    next.attempt.startup.supportedSpellings=structuredClone(pack.build!.supportedSpellings);
    next.attempt.combatProgress={revision:0,lastCommittedTick:0,collectedIds:[]};
  }
  assertBuildState(next,pack.build); assertAttemptState(next); return next;
}
export function applyEndAttempt(run: ActiveRun, command: EndAttemptCommand): ActiveRun {
  attemptFingerprint(command); assertBuildState(run); assertAttemptState(run);
  if (command.pilotId!==run.pilotId || command.runId!==run.runId || command.attemptId!==run.attempt?.attemptId) throw new AttemptRejection('TARGET_MISMATCH','Recovery must target the same saved Attempt.');
  if (run.phase!=='attempt' || run.attempt.status!=='running') throw new AttemptRejection('ATTEMPT_ENDED','This Attempt has already ended.');
  const next=structuredClone(run); next.phase='build'; next.attempt!.status=command.kind==='interrupt-attempt'?'interrupted':'abandoned'; next.attempt!.endedAt=command.endedAt;
  assertBuildState(next); assertAttemptState(next); return next;
}
