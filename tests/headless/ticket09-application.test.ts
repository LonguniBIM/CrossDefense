import {it,expect} from 'vitest';
import {InMemoryResultsRepository} from '../../src/infrastructure/persistence/InMemoryResultsRepository';
import {ResultsApplication} from '../../src/application/results/ResultsApplication';
import {SalvageApplication} from '../../src/application/results/SalvageApplication';
import {ContentPackApplication} from '../../src/application/content/ContentPackApplication';
import {InMemoryContentPackRepository} from '../../src/infrastructure/content/InMemoryContentPackRepository';
import type {SettleOutcomeCommand} from '../../src/domain/results/settlement';
import type {CargoResolutionCommand} from '../../src/domain/results/salvageResolution';
import type {BuildContent} from '../../src/domain/content/contentPack';
import {resultFixture,settlementCommand,keepAllCommand} from '../resultsFixture';
import {retainedTiles} from '../../src/domain/run/cargo';

async function setup(repo=new InMemoryResultsRepository(),count=2){const f=resultFixture(count);await repo.createPilot({operationId:'pilot',pilot:{pilotId:f.run.pilotId,nickname:'Results',avatarId:'pilot-blue',createdAt:f.run.startedAt,lastUsedAt:f.run.startedAt}});await repo.createRun({operationId:'run',run:f.build});await repo.startAttempt(f.start,f.pack);await repo.commitCombat(f.command);return {repo,f};}
async function content(){const app=new ContentPackApplication(new InMemoryContentPackRepository(),{appVersion:'0.1.0',rulesetVersion:'development-combat-ruleset-v1'});await app.bootstrap();await app.activateCandidate(resultFixture().pack);return app;}
it('same command, different operation for the same outcome, and concurrent settlement never pay twice',async()=>{
 const {repo,f}=await setup(),command=settlementCommand(f.run);
 const values=await Promise.all([repo.settleOutcome(command),repo.settleOutcome(command),repo.settleOutcome({...command,operationId:'other'})]);
 expect(values.every(state=>state.economy.credits===24&&state.economy.celestium===1)).toBe(true);expect((await repo.getResults(f.run.pilotId)).outcomes.filter(row=>row.settlement)).toHaveLength(1);
 await expect(repo.settleOutcome({...command,attemptId:'wrong'})).rejects.toThrow();
});
it.each([false,true])('result Retry retains exact identity after a %s lost acknowledgment',async lost=>{
 class Faults extends InMemoryResultsRepository {calls:SettleOutcomeCommand[]=[];fail=true;override async settleOutcome(c:SettleOutcomeCommand){this.calls.push(structuredClone(c));if(this.fail){this.fail=false;if(lost)await super.settleOutcome(c);throw Error('Injected settlement failure');}return super.settleOutcome(c);}}
 const {repo,f}=await setup(new Faults()),faults=repo as Faults,app=new ResultsApplication(repo,()=> 'single-op',()=> '2026-10-11T02:00:00Z');await app.open(f.run.pilotId);const before=app.snapshot();
 await expect(app.settle(f.outcome.attemptId)).rejects.toThrow('Injected');expect(app.snapshot()).toEqual(before);expect(app.hasPendingSave()).toBe(true);
 await expect(app.settle('other')).rejects.toThrow();await app.retry();expect(faults.calls).toHaveLength(2);expect(faults.calls[0]).toEqual(faults.calls[1]);expect(app.snapshot().economy.credits).toBe(24);expect(app.hasPendingSave()).toBe(false);
});
it('completed settlement replay returns current balances rather than restoring its old snapshot',async()=>{
 const {repo,f}=await setup( undefined,0),first=settlementCommand(f.run);await repo.settleOutcome(first);
 const build=(await repo.getResults(f.run.pilotId)).run;
 const start={...f.start,operationId:'replay-start',attemptId:'replay',expectedBuildRevision:build.shipBuild!.revision};await repo.startAttempt(start,f.pack);
 await repo.commitCombat({...f.command,operationId:'replay-end',attemptId:'replay',payloadIds:[]});await repo.settleOutcome({...first,attemptId:'replay',operationId:'pay-replay'});
 expect((await repo.settleOutcome(first)).economy.credits).toBe(28);
});
it('historical pending outcome survives replacement of the latest Attempt and is payable exactly once',async()=>{
 const {repo,f}=await setup(undefined,0);await repo.startAttempt({...f.start,operationId:'new-start',attemptId:'new'},f.pack);
 await repo.endAttempt({kind:'interrupt-attempt',operationId:'interrupt',pilotId:f.run.pilotId,runId:f.run.runId,attemptId:'new',endedAt:'2026-10-11T02:00:00Z'});
 const state=await repo.settleOutcome(settlementCommand(f.run));expect(state.run.attempt!.attemptId).toBe('new');expect(state.run.attempt!.status).toBe('interrupted');expect(state.economy.credits).toBe(24);expect(state.outcomes).toHaveLength(2);
});
it.each([false,true])('Salvage Apply has exact Retry and unchanged published snapshot after %s lost acknowledgment',async lost=>{
 class Faults extends InMemoryResultsRepository {calls:CargoResolutionCommand[]=[];fail=true;override async resolveCargo(c:CargoResolutionCommand,b:BuildContent){this.calls.push(structuredClone(c));if(this.fail){this.fail=false;if(lost)await super.resolveCargo(c,b);throw Error('Injected Apply failure');}return super.resolveCargo(c,b);}}
 const {repo,f}=await setup(new Faults()),faults=repo as Faults,app=new SalvageApplication(repo,await content(),()=> 'cargo-once',()=> '2026-10-11T02:00:00Z');await app.open(f.run.pilotId);const before=app.snapshot(),command=keepAllCommand(f.run),choices={keepIds:command.keepIds,discardIds:[],removeRetainedIds:[]};
 await expect(app.apply(choices,false)).rejects.toThrow('summary');expect(app.hasPendingSave()).toBe(false);
 await expect(app.apply(choices,true)).rejects.toThrow('Injected');choices.keepIds.length=0;expect(app.snapshot()).toEqual(before);await expect(app.apply(choices,true)).rejects.toThrow('Retry');await app.retry();expect(faults.calls[0]).toEqual(faults.calls[1]);expect(retainedTiles(app.snapshot().run)).toHaveLength(10);expect(app.snapshot().run.salvageBuffer).toEqual([]);
});
it('confirmed old Cargo operation replay observes later layout without reverting it',async()=>{
 const {repo,f}=await setup(),command=keepAllCommand(f.run),kept=await repo.resolveCargo(command,f.pack.build!);
 await repo.applyPlacement({kind:'place',operationId:'place-earned',pilotId:f.run.pilotId,runId:f.run.runId,contentVersion:f.run.contentVersion,rulesetVersion:f.run.rulesetVersion,expectedRevision:kept.shipBuild!.revision,tileId:f.run.salvageBuffer![0]!.id,x:2,y:0},f.pack.build!);
 const replay=await repo.resolveCargo(command,f.pack.build!);expect(replay.shipBuild!.placements).toHaveLength(5);expect(retainedTiles(replay)).toHaveLength(10);
});
