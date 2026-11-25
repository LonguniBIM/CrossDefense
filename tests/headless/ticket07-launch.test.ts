import { expect, it } from 'vitest';
import { combatPack,combatBuild,startCommand } from '../combatFixture';
import { applyStartAttempt,applyEndAttempt } from '../../src/domain/attempt/attempt';

it('starts the approved combat capability from the saved SHIP with frozen definitions and empty durable collection',()=>{
  const pack=combatPack(),build=combatBuild(pack),command=startCommand(build);
  const run=applyStartAttempt(build,pack,command);
  expect(run.phase).toBe('attempt');expect(run.attempt?.startup.capability).toBe('combat');
  expect(run.attempt?.startup).toHaveProperty('combat',pack.combat);
  expect(run.attempt).toHaveProperty('combatProgress',{revision:0,lastCommittedTick:0,collectedIds:[]});
  pack.combat.playerHull=1;
  expect(run.attempt?.startup).toHaveProperty('combat.playerHull',1200);
  expect(build.phase).toBe('build');
  const ended=applyEndAttempt(run,{kind:'interrupt-attempt',operationId:'interrupt',attemptId:command.attemptId,pilotId:build.pilotId,runId:build.runId,endedAt:'2026-10-09T00:01:00Z'});
  expect(ended.phase).toBe('build');expect(ended.shipBuild).toEqual(build.shipBuild);expect(ended.salvage).toEqual(build.salvage);
});
