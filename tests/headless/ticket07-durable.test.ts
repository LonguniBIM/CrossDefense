import { expect,it } from 'vitest';
import { startedCombat } from '../combatFixture';
import { applyCombatCommit } from '../../src/domain/combat/collection';

it('one terminal tick retains both payloads and a reward-unsettled outcome without changing retained Cargo or currency',()=>{
  const run=startedCombat(),id=run.attempt!.attemptId;
  const result=applyCombatCommit(run,{kind:'combat-tick',operationId:'last-tick',pilotId:run.pilotId,runId:run.runId,attemptId:id,expectedRevision:0,tick:60,payloadIds:[id+':payload:0',id+':payload:1'],terminal:{kind:'failed',causes:['Hull destroyed','Top-out']},recordedAt:'2026-10-09T00:01:00Z'});
  expect(result.run.salvageBuffer?.map(t=>t.letter)).toEqual(['S','H']);
  expect(result.run.phase).toBe('build');expect(result.run.attempt?.status).toBe('failed');
  expect(result.run.shipBuild).toEqual(run.shipBuild);expect(result.run.salvage).toEqual(run.salvage);
  expect(result.outcome?.settlement).toBe('not-eligible');expect(result.outcome?.terminal.causes).toEqual(['Hull destroyed','Top-out']);
  expect(result.outcome?.rewards.firstClear.credits).toBe(20);expect(result.run).not.toHaveProperty('credits');
  expect(run.salvageBuffer).toBeUndefined();expect(run.phase).toBe('attempt');
});

import {combatCommitFingerprint,type CombatCommit} from '../../src/domain/combat/collection';
import {InMemoryAttemptRepository} from '../../src/infrastructure/persistence/InMemoryAttemptRepository';
import {combatBuild,combatPack,startCommand} from '../combatFixture';
const commandFor=(run:ReturnType<typeof startedCombat>):CombatCommit=>({kind:'combat-tick',operationId:'collection',pilotId:run.pilotId,runId:run.runId,attemptId:run.attempt!.attemptId,expectedRevision:0,tick:60,payloadIds:[run.attempt!.attemptId+':payload:0'],terminal:null,recordedAt:'2026-10-09T00:01:00Z'});
for(const mutation of ['other-pilot','other-attempt','stale-revision','foreign-payload','duplicate-payload','late-tick','unordered-failure'] as const)it('rejects '+mutation+' without changing any Run data',()=>{
  const run=startedCombat(),before=structuredClone(run),command=commandFor(run);
  if(mutation==='other-pilot')command.pilotId='another';if(mutation==='other-attempt')command.attemptId='another';
  if(mutation==='stale-revision')command.expectedRevision=1;if(mutation==='foreign-payload')command.payloadIds=['elsewhere:payload:0'];
  if(mutation==='duplicate-payload')command.payloadIds.push(command.payloadIds[0]!);if(mutation==='late-tick')command.tick=99999;
  if(mutation==='unordered-failure')command.terminal={kind:'failed',causes:['Top-out','Hull destroyed']};
  expect(()=>applyCombatCommit(run,command)).toThrow();expect(run).toEqual(before);
});
it('duplicate receipt returns current truth and independent terminal history survives a later Attempt',async()=>{
  const repo=new InMemoryAttemptRepository(),pack=combatPack(),build=combatBuild(pack),start=startCommand(build);
  await repo.createPilot({operationId:'p',pilot:{pilotId:build.pilotId,nickname:'History',avatarId:'pilot-blue',createdAt:build.startedAt,lastUsedAt:build.startedAt}});await repo.createRun({operationId:'r',run:build});
  const started=await repo.startAttempt(start,pack),terminal={...commandFor(started),payloadIds:[],terminal:{kind:'victory' as const,causes:[]},tick:6000};
  const first=await repo.commitCombat(terminal);const history=first.outcome;
  const second=await repo.startAttempt({...start,operationId:'second-start',attemptId:'second-attempt',seed:'second-seed'},pack);
  expect((await repo.commitCombat(terminal)).run).toEqual(second);
  expect(await repo.getCombatOutcome(build.pilotId,start.attemptId)).toEqual(history);
  await expect(repo.getCombatOutcome('other-pilot',start.attemptId)).rejects.toThrow();
  await expect(repo.commitCombat({...terminal,tick:6001})).rejects.toThrow();
});
it('interrupted combat stores a nonpaying outcome and preserves already committed buffer entries',async()=>{
  const repo=new InMemoryAttemptRepository(),pack=combatPack(),build=combatBuild(pack),start=startCommand(build);
  await repo.createPilot({operationId:'p',pilot:{pilotId:build.pilotId,nickname:'Recovery',avatarId:'pilot-blue',createdAt:build.startedAt,lastUsedAt:build.startedAt}});await repo.createRun({operationId:'r',run:build});
  const started=await repo.startAttempt(start,pack),collected=await repo.commitCombat(commandFor(started));
  const ended=await repo.endAttempt({kind:'interrupt-attempt',operationId:'interruption',pilotId:build.pilotId,runId:build.runId,attemptId:start.attemptId,endedAt:'2026-10-09T00:02:00Z'});
  expect(ended.salvageBuffer).toEqual(collected.run.salvageBuffer);
  expect((await repo.getCombatOutcome(build.pilotId,start.attemptId))?.settlement).toBe('not-eligible');
  expect((await repo.getCombatOutcome(build.pilotId,start.attemptId))?.terminal.kind).toBe('interrupted');
});
