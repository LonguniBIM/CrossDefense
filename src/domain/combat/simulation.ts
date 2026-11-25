import type { ActiveRun } from '../run/run';
import { assertAttemptState } from '../attempt/attempt';
import { projectBuild } from '../build/shipBuild';
import { createBoard, stepBoard, type BoardState, type BoardInput, type BoardEvents } from '../preRun/board';
import { combatPayloadPool } from './payload';
import { createBattle, stepBattle, type BattleState } from './battle';

export interface CombatSimulation { board:BoardState; battle:BattleState; }
export function createCombatSimulation(run:ActiveRun):CombatSimulation {
  assertAttemptState(run);
  const envelope=run.attempt, startup=envelope?.startup;
  if(run.phase!=='attempt'||!envelope||startup?.capability!=='combat'||!startup.combat||!startup.supportedSpellings||envelope.combatProgress?.revision!==0)throw Error('Only a newly acknowledged combat Attempt can start simulation; reload must recover instead.');
  const build=projectBuild(run,{hull:startup.hull,supportedSpellings:startup.supportedSpellings});
  return {board:createBoard(envelope.seed,combatPayloadPool(envelope.attemptId,envelope.seed,startup.combat)),battle:createBattle(startup.combat,build.equipped,envelope.difficulty)};
}
export function stepCombatSimulation(snapshot:CombatSimulation,inputs:readonly BoardInput[]=[]):{state:CombatSimulation;events:BoardEvents} {
  if(snapshot.battle.terminal)return {state:structuredClone(snapshot),events:{cleared:[],rows:[],locked:[],dropped:false,held:false}};
  if(snapshot.board.tick!==snapshot.battle.tick)throw Error('Board and Combat clocks diverged.');
  const next=stepBoard(snapshot.board,inputs);
  const battle=stepBattle(snapshot.battle,next.board.locks,next.board.topOut);
  if(next.board.tick!==battle.tick)throw Error('Shared simulation did not advance together.');
  return {state:{board:next.board,battle},events:next.events};
}
