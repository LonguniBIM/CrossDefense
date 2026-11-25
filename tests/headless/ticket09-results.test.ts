import {describe,it,expect} from 'vitest';
import {combatBuild,combatPack,startedCombat} from '../combatFixture';
import {applyCombatCommit,type CombatOutcome} from '../../src/domain/combat/collection';
import {emptyEconomy,applyOutcomeSettlement,type SettleOutcomeCommand} from '../../src/domain/results/settlement';
import {applyCargoResolution,previewCargoResolution,type CargoResolutionCommand} from '../../src/domain/results/salvageResolution';
import {retainedTiles} from '../../src/domain/run/cargo';
import {projectBuild,applyPlacement} from '../../src/domain/build/shipBuild';
import {assertAttemptState,applyStartAttempt} from '../../src/domain/attempt/attempt';
import {startCommand} from '../combatFixture';
import {historyScope,copyLayout,applyBuildOperation} from '../../src/domain/build/buildEditing';

function ended(kind:'victory'|'failed'='victory',payloads=2){
 const current=startedCombat();
 const commit={kind:'combat-tick' as const,operationId:'end',pilotId:current.pilotId,runId:current.runId,attemptId:current.attempt!.attemptId,expectedRevision:0,tick:3673,payloadIds:Array.from({length:payloads},(_,i)=>current.attempt!.attemptId+':payload:'+i),terminal:{kind,causes:kind==='failed'?['Timeout' as const]:[]},recordedAt:'2026-10-11T00:00:00Z'};
 const result=applyCombatCommit(current,commit);return {run:result.run,outcome:result.outcome!};
}
function settle(outcome:CombatOutcome):SettleOutcomeCommand{return {kind:'settle-outcome',operationId:'settle',pilotId:outcome.pilotId,runId:outcome.runId,attemptId:outcome.attemptId,recordedAt:'2026-10-11T01:00:00Z'};}
function cargo(run:ReturnType<typeof ended>['run']):CargoResolutionCommand{return {kind:'resolve-salvage',operationId:'apply',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedBuildRevision:run.shipBuild!.revision,expectedCargoRevision:run.cargo?.revision??0,bufferIds:(run.salvageBuffer??[]).map(t=>t.id),keepIds:(run.salvageBuffer??[]).map(t=>t.id),discardIds:[],removeRetainedIds:[],confirmed:true,recordedAt:'2026-10-11T01:00:00Z'};}

describe('Q13 settlement',()=>{
 it.each([['Easy',23],['Normal',24],['Hard',26],['Insane',29]] as const)('first clear on %s pays once-per-Pilot/Map bonus plus %i total Credits',(difficulty,total)=>{
  const {run,outcome}=ended();outcome.difficulty=difficulty;const before=structuredClone({run,outcome});
  const result=applyOutcomeSettlement(run,outcome,emptyEconomy(run.pilotId),settle(outcome));
  expect(result.economy.credits).toBe(total);expect(result.economy.celestium).toBe(1);expect(result.settlement.firstClear).toBe(true);expect(result.run.clearedMapIds).toEqual([outcome.mapId]);
  expect({run,outcome}).toEqual(before);expect(result.run.shipBuild).toEqual(run.shipBuild);expect(result.run.quota).toEqual(run.quota);expect(result.run.salvageBuffer).toEqual(run.salvageBuffer);
 });
 it('replay at another difficulty/content version preserves first-clear entitlement and pays only repeatable Credits',()=>{
  const {run,outcome}=ended(),first=applyOutcomeSettlement(run,outcome,emptyEconomy(run.pilotId),settle(outcome));
  const replay={...outcome,attemptId:'replay',contentVersion:'development-rendered-combat-ship-v1',difficulty:'Insane' as const,collectedIds:[]};
  const result=applyOutcomeSettlement(first.run,replay,first.economy,{...settle(replay),operationId:'second'});
  expect(result.economy.credits).toBe(33);expect(result.economy.celestium).toBe(1);expect(result.settlement.firstClear).toBe(false);
 });
 it('failure, abandonment and interruption receive no reward and never claim first-clear',()=>{
  for(const kind of ['failed','abandoned','interrupted'] as const){const {run,outcome}=ended('failed');outcome.terminal={kind,causes:kind==='failed'?['Timeout']:[]};if(kind!=='failed')outcome.tick=null;
   const result=applyOutcomeSettlement(run,outcome,emptyEconomy(run.pilotId),settle(outcome));expect(result.economy.credits).toBe(0);expect(result.economy.celestium).toBe(0);expect(result.economy.firstClearMapIds).toEqual([]);expect(result.run.clearedMapIds??[]).toEqual([]);
  }
 });
 it('rejects wrong owners, running phase, invalid reward values and overflow without mutation',()=>{
  const {run,outcome}=ended(),economy=emptyEconomy(run.pilotId),command=settle(outcome);
  expect(()=>applyOutcomeSettlement(run,outcome,{...economy,pilotId:'someone-else'},command)).toThrow();
  expect(()=>applyOutcomeSettlement({...run,phase:'attempt'},outcome,economy,command)).toThrow();
  expect(()=>applyOutcomeSettlement(run,{...outcome,rewards:{...outcome.rewards,repeatable:{credits:-1,celestium:0}}},economy,command)).toThrow();
  expect(()=>applyOutcomeSettlement(run,outcome,{...economy,credits:Number.MAX_SAFE_INTEGER},command)).toThrow();
  expect(economy.credits).toBe(0);
 });
});

describe('Q259/Q260 staged Salvage',()=>{
 it('preview is transient and Keep preserves exact payload identity as unplaced Cargo',()=>{
  const {run}=ended(),before=structuredClone(run),command=cargo(run),preview=previewCargoResolution(run,combatPack().build,command);
  expect(preview.valid).toBe(true);expect(preview.after!.retainedCount).toBe(10);expect(run).toEqual(before);
  const result=applyCargoResolution(run,combatPack().build,command);expect(retainedTiles(result)).toHaveLength(10);expect(result.salvageBuffer).toEqual([]);expect(result.salvage).toEqual(run.salvage);expect(result.quota).toEqual(run.quota);expect(result.attempt).toEqual(run.attempt);
  expect(projectBuild(result,combatPack().build).equipped).toHaveLength(4);expect(projectBuild(result,combatPack().build).power.surplus).toBe(305);
 });
 it('all choices are explicit, exact and capacity-valid; a replacement removes only selected identities',()=>{
  const {run}=ended('victory',24),command=cargo(run);expect(previewCargoResolution(run,combatPack().build,command).valid).toBe(false);
  expect(()=>applyCargoResolution(run,combatPack().build,{...command,keepIds:[],discardIds:[]})).toThrow();
  const keep=command.keepIds.slice(0,20),discard=command.keepIds.slice(20),remove=retainedTiles(run).slice(0,4).map(t=>t.id);
  const result=applyCargoResolution(run,combatPack().build,{...command,keepIds:keep,discardIds:discard,removeRetainedIds:remove});expect(retainedTiles(result)).toHaveLength(24);expect(retainedTiles(result).map(t=>t.id)).toEqual(expect.arrayContaining(keep));expect(result.shipBuild!.placements.every(p=>!remove.includes(p.tileId))).toBe(true);
 });
 it('discarding starter equipment changes current Cargo, never history or completion; no Undo restores it',()=>{
  const {run}=ended(),command=cargo(run),oldScope=historyScope(run,combatPack().build);
  const remove=retainedTiles(run).map(t=>t.id),result=applyCargoResolution(run,combatPack().build,{...command,removeRetainedIds:remove,keepIds:[],discardIds:command.keepIds});
  expect(retainedTiles(result)).toEqual([]);expect(result.salvage).toEqual(run.salvage);expect(result.shipBuild!.placements).toEqual([]);expect(()=>assertAttemptState(result)).not.toThrow();
  expect(()=>applyBuildOperation(result,combatPack().build,{kind:'undo',operationId:'bad-undo',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedRevision:result.shipBuild!.revision,scope:oldScope,from:[],to:copyLayout(run)})).toThrow();
 });
 it('rejects changed buffer, stale Build/Cargo, duplicate or unknown identities and missing confirmation',()=>{
  const {run}=ended(),command=cargo(run),definition=combatPack().build;
  for(const patch of [{bufferIds:[]},{expectedBuildRevision:999},{expectedCargoRevision:999},{keepIds:[command.keepIds[0]!,command.keepIds[0]!]},{removeRetainedIds:['missing']},{confirmed:false}] as const)expect(()=>applyCargoResolution(run,definition,{...command,...patch} as CargoResolutionCommand)).toThrow();
 });
 it('new retained payloads can be equipped and frozen into a replay while old inputs remain immutable',()=>{
  const {run}=ended(),prior=structuredClone(run.attempt),kept=applyCargoResolution(run,combatPack().build,cargo(run)),tile=run.salvageBuffer![0]!;
  const placed=applyPlacement(kept,combatPack().build,{kind:'place',operationId:'place-earned',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedRevision:kept.shipBuild!.revision,tileId:tile.id,x:2,y:0});
  const replay=applyStartAttempt(placed,combatPack(),{...startCommand(placed),operationId:'new-start',attemptId:'new-attempt'});
  expect(replay.attempt!.startup.retainedTiles.some(t=>t.id===tile.id)).toBe(true);expect(run.attempt).toEqual(prior);
 });
 it('settlement invalidates stale layout history without changing any coordinates',()=>{
  const {run,outcome}=ended(),key=historyScope(run,combatPack().build),result=applyOutcomeSettlement(run,outcome,emptyEconomy(run.pilotId),settle(outcome));
  expect(historyScope(result.run,combatPack().build)).not.toBe(key);expect(copyLayout(result.run)).toEqual(copyLayout(run));
 });
});
