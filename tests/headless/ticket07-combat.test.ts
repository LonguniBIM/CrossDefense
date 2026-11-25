import { expect, it } from 'vitest';
import { startedCombat } from '../combatFixture';
import { createCombatSimulation, stepCombatSimulation } from '../../src/domain/combat/simulation';

it('the real saved SHIP and Scout fire together, impact after six ticks and advance both clocks without mutating the input',()=>{
  const initial=createCombatSimulation(startedCombat());let state=initial;
  for(let i=0;i<6;i++)state=stepCombatSimulation(state).state;
  expect(state.battle.enemy?.hull).toBe(2400000);expect(state.battle.player.hull).toBe(12000000);
  state=stepCombatSimulation(state).state;
  expect(state.battle.enemy?.hull).toBe(2400000-98182);
  expect(state.battle.player.hull).toBe(12000000-62992);
  expect(state.board.tick).toBe(7);expect(state.battle.tick).toBe(7);
  expect(initial.board.tick).toBe(0);expect(initial.battle.enemy?.hull).toBe(2400000);
});

import {createBattle,createCombatShip,applyCombatHit,stepBattle,type BattleState} from '../../src/domain/combat/battle';
import {combatPack} from '../combatFixture';
import {threatFactor,RESOURCE_SCALE,scaleAmount} from '../../src/domain/combat/rules';
import type {EquippedTile} from '../../src/domain/build/shipBuild';
const moduleTile=(subtype:EquippedTile['subtype'],id:string=subtype):EquippedTile=>({id,letter:'S',subtype,x:0,y:2,multiplier:100});
function quietBattle(equipment:EquippedTile[]):BattleState{
  const definition=combatPack().combat;
  definition.encounters=definition.encounters.map(e=>({...e,equipment:e.equipment.filter(t=>t.subtype==='Power')}));
  return createBattle(definition,equipment,'Normal');
}
const ticks=(state:BattleState,count:number,locks=0):BattleState=>{for(let i=0;i<count&&!state.terminal;i++)state=stepBattle(state,locks);return state;};

it('exact damage ordering applies Engine, Missile System, Shield overflow, then penetrated Armor',()=>{
  const ship=createCombatShip('target',100,[]);ship.engine=1000000;ship.system=1000000;ship.armor=1000000;
  expect(applyCombatHit(ship,1000000,'Missile',5)).toEqual({shield:0,hull:142857});
  const shield=createCombatShip('shield',100,[]);shield.shield=shield.maxShield=100000;
  expect(applyCombatHit(shield,100000,'Laser',5)).toEqual({shield:100000,hull:33333});
  const tiny=createCombatShip('tiny',100,[]);tiny.engine=2000000;tiny.maxShield=100;
  expect(applyCombatHit(tiny,1,'Ballistic',5)).toEqual({shield:0,hull:0});expect(tiny.rechargeAt).toBeNull();
});
it('two independent Ballistic tiles fire together and repeat at 48 ticks without halving a shared timer',()=>{
  let state=quietBattle([moduleTile('Ballistic','a'),moduleTile('Ballistic','b')]);
  state=stepBattle(state,0);expect(state.events.filter(e=>e.kind==='fire')).toHaveLength(2);
  state=ticks(state,47);expect(state.events.filter(e=>e.kind==='fire')).toHaveLength(0);
  state=stepBattle(state,0);expect(state.events.filter(e=>e.kind==='fire')).toHaveLength(2);
});
it('Laser allocates exactly 21.6 over 36 active ticks and does not damage during recovery',()=>{
  let state=quietBattle([moduleTile('Laser')]);const start=state.enemy!.hull;
  state=ticks(state,36);expect(start-state.enemy!.hull).toBe(216000);
  state=ticks(state,108);expect(start-state.enemy!.hull).toBe(216000);
  state=stepBattle(state,0);expect(start-state.enemy!.hull).toBe(222000);
});
it('Shield waits exactly 180 damage-free ticks; a hit on that tick cancels its pulse',()=>{
  let state=quietBattle([moduleTile('Shield')]);
  state.projectiles.push({id:'injury',source:'fixture',target:'player',type:'Ballistic',amount:50000,due:1});
  state=ticks(state,180);expect(state.player.shield).toBe(200000);
  state=stepBattle(state,0);expect(state.player.shield).toBe(220000);
  state.projectiles.push({id:'interrupt',source:'fixture',target:'player',type:'Ballistic',amount:10000,due:241});
  state=ticks(state,60);expect(state.player.shield).toBe(210000);expect(state.player.rechargeAt).toBe(421);
});
it('Support starts at actual Hull injury, repairs after 180 ticks and never banks at full Hull',()=>{
  let state=quietBattle([moduleTile('Support')]);const full=state.player.hull;
  state.projectiles.push({id:'injury',source:'fixture',target:'player',type:'Ballistic',amount:20000,due:1});
  state=ticks(state,180);expect(state.player.hull).toBe(full-20000);
  state=stepBattle(state,0);expect(state.player.hull).toBe(full);expect(state.player.modules[0]!.repairAt).toBeNull();
  state.projectiles.push({id:'later',source:'fixture',target:'player',type:'Ballistic',amount:10000,due:200});
  state=ticks(state,198);expect(state.player.hull).toBe(full-10000);
  state=stepBattle(state,0);expect(state.player.hull).toBe(full);
});
it('both sides due damage resolves before Hull/top-out/timeout precedence and no repair revives zero Hull',()=>{
  let state=quietBattle([moduleTile('Support')]);state.player.hull=10000;state.enemy!.hull=10000;
  state.player.modules[0]!.repairAt=1;state.definition.encounters[0]!.limitTicks=1;
  state.projectiles=[{id:'a',source:'player',target:state.enemy!.id,type:'Ballistic',amount:10000,due:1},{id:'b',source:state.enemy!.id,target:'player',type:'Ballistic',amount:10000,due:1}];
  state=stepBattle(state,0,true);
  expect(state.player.hull).toBe(0);expect(state.enemy!.hull).toBe(0);
  expect(state.terminal).toEqual({kind:'failed',causes:['Hull destroyed','Top-out','Timeout']});
  expect(state.events.some(e=>e.kind==='repair')).toBe(false);
});
it('Scout death leaves a 60-tick gap, preserves Player resources and does not retarget outstanding shots',()=>{
  let state=quietBattle([moduleTile('Ballistic')]);state.enemy!.hull=1;state.player.hull-=100000;
  state.projectiles.push({id:'old-shot',source:'player',target:state.enemy!.id,type:'Missile',amount:360000,due:100});
  state=ticks(state,7);expect(state.enemy).toBeNull();expect(state.nextEncounterAt).toBe(67);
  const hull=state.player.hull;state=ticks(state,59);expect(state.enemy).toBeNull();
  state=stepBattle(state,0);expect(state.enemy!.id).toBe('development-boss-01');expect(state.player.hull).toBe(hull);
  state=ticks(state,33);expect(state.projectiles.some(p=>p.id==='old-shot')).toBe(false);
  expect(state.enemy!.hull).toBe(4800000-80000);
});
it('Threat is lock-derived, capped for damage, frozen on activation and independent from Piece timing',()=>{
  expect([0,19,20,99,100,1000].map(threatFactor)).toEqual([100,100,110,140,150,150]);
  let state=createBattle(combatPack().combat,[],'Normal');state=stepBattle(state,19);
  const shot=state.projectiles.find(p=>p.source!=='player')!;expect(shot.amount).toBe(80000);
  state=stepBattle(state,20);expect(state.projectiles.find(p=>p.id===shot.id)!.amount).toBe(80000);
  state=ticks(state,47,20);expect(state.projectiles.some(p=>p.amount===88000)).toBe(true);
  expect(scaleAmount(480*RESOURCE_SCALE,140)).toBe(6720000);
});
it('difficulty changes enemy Hull and outgoing damage, not player Hull, Shield or cooldowns',()=>{
  const pack=combatPack();let state=createBattle(pack.combat,[moduleTile('Shield')],'Hard');
  expect(state.enemy!.hull).toBe(3360000);expect(state.player.hull).toBe(12000000);expect(state.player.shield).toBe(250000);
  state=stepBattle(state,0);expect(state.projectiles[0]!.amount).toBe(100000);expect(state.enemy!.modules.find(m=>m.subtype==='Ballistic')!.nextActivation).toBe(49);
});

it('target loss stops Laser until its original deadline; a destroyed source does not cancel its in-flight missile',()=>{
  let state=quietBattle([moduleTile('Laser')]);state.enemy!.hull=1;
  state.projectiles.push({id:'dead-source',source:state.enemy!.id,target:'player',type:'Missile',amount:360000,due:5});
  state=stepBattle(state,0);expect(state.enemy).toBeNull();
  state=ticks(state,4);expect(state.player.hull).toBe(12000000-360000);
  state=ticks(state,139);expect(state.tick).toBe(144);expect(state.enemy!.hull).toBe(4800000);
  state=stepBattle(state,0);expect(state.enemy!.hull).toBe(4800000-6000);
});

import {createBoard,canonicalPiece} from '../../src/domain/preRun/board';
import {combatPayloadEntries} from '../../src/domain/combat/payload';
import {applyCombatCommit} from '../../src/domain/combat/collection';
it('a synthetic public-state terminal boundary clears actual payload cells and commits them with failure before victory',()=>{
  const run=startedCombat(),state=createCombatSimulation(run),entries=combatPayloadEntries(run.attempt!.attemptId,run.attempt!.startup.combat!);
  // Deliberately constructed boundary fixture; normal UI tests earn rows through keyboard play.
  state.board=createBoard('terminal-boundary',[]);
  state.board.active=canonicalPiece({id:'terminal-piece',shape:'I',payloadCell:0,payload:entries[0]!});
  state.board.grid=[0,1,2,7,8,9].map(x=>({id:'bottom-'+x,x,y:19,payload:x===0?entries[1]!:null}));
  state.battle.encounterIndex=1;state.battle.enemy=createCombatShip('development-boss-01',1,[]);state.battle.player.hull=10000;
  state.battle.definition.encounters[1]!.limitTicks=1;
  state.battle.projectiles=[{id:'enemy-hit',source:'development-boss-01',target:'player',type:'Ballistic',amount:100000,due:1},{id:'player-hit',source:'player',target:'development-boss-01',type:'Ballistic',amount:100000,due:1}];
  const stepped=stepCombatSimulation(state,[{action:'drop',down:true,code:'Space',pieceId:'terminal-piece'}]);
  expect(stepped.events.cleared).toHaveLength(2);expect(stepped.state.battle.terminal).toEqual({kind:'failed',causes:['Hull destroyed','Timeout']});
  const committed=applyCombatCommit(run,{kind:'combat-tick',operationId:'terminal',pilotId:run.pilotId,runId:run.runId,attemptId:run.attempt!.attemptId,expectedRevision:0,tick:1,payloadIds:stepped.events.cleared.map(t=>t.id),terminal:stepped.state.battle.terminal,recordedAt:'2026-10-09T00:01:00Z'});
  expect(committed.run.salvageBuffer).toHaveLength(2);expect(committed.outcome?.terminal.kind).toBe('failed');
});
