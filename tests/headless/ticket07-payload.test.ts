import {expect,it} from 'vitest';
import {combatPack,startedCombat} from '../combatFixture';
import {choosePlacement} from '../preRunPlayer';
import {createBoard,stepBoard} from '../../src/domain/preRun/board';
import {combatPayloadEntries,combatPayloadPool} from '../../src/domain/combat/payload';
import {createCombatSimulation,stepCombatSimulation} from '../../src/domain/combat/simulation';

it('Q12 has 24 distinct identities and all nine subtype paths without changing the Piece random stream',()=>{
  const definition=combatPack().combat,pool=combatPayloadPool('attempt','seed',definition);
  expect(new Set(pool.map(t=>t.id)).size).toBe(24);expect(new Set(pool.map(t=>t.subtype)).size).toBe(9);
  expect(pool.filter(t=>t.subtype==='Power')).toHaveLength(6);expect(pool.filter(t=>t.subtype==='Armor')).toHaveLength(4);
  expect(combatPayloadPool('attempt','seed',definition)).toEqual(pool);
  const a=createBoard('same-piece-seed',pool),b=createBoard('same-piece-seed',pool.toReversed());
  expect([a.active.shape,...a.next.map(p=>p.shape)]).toEqual([b.active.shape,...b.next.map(p=>p.shape)]);
  expect(a.shapeRng).toBe(b.shapeRng);expect(a.active.payload!.id).not.toBe(b.active.payload!.id);
});
it('Hold and rotations reserve the same payload; only a lock changes Threat',()=>{
  let state=createCombatSimulation(startedCombat());const original=state.board.active.payload;
  const held=stepCombatSimulation(state,[{action:'hold',down:true,code:'c',pieceId:state.board.active.id}]);
  expect(held.state.board.hold?.payload).toEqual(original);expect(held.state.board.locks).toBe(0);expect(held.events.cleared).toEqual([]);
  state=held.state;const id=state.board.active.id,payload=state.board.active.payload;
  for(let i=0;i<4;i++){state=stepCombatSimulation(state,[{action:'cw',down:true,code:'x',pieceId:id}]).state;state=stepCombatSimulation(state,[{action:'cw',down:false,code:'x',pieceId:id}]).state;}
  expect(state.board.active.payload).toEqual(payload);expect(state.board.locks).toBe(0);
  const dropped=stepCombatSimulation(state,[{action:'drop',down:true,code:'space',pieceId:id}]);expect(dropped.state.board.locks).toBe(1);
});
it('a finite Map pool exhausts into reward-free pieces; cleared identities never duplicate',()=>{
  const pool=combatPayloadPool('attempt','seed',combatPack().combat);let board=createBoard('seed',pool);const collected=new Set<string>();let rewardFree=false;
  for(let piece=0;piece<80&&!rewardFree;piece++){
    for(const action of choosePlacement(board)){
      const input={action,down:true,code:action,pieceId:board.active.id},result=stepBoard(board,[input]);
      for(const tile of result.events.cleared){expect(collected.has(tile.id)).toBe(false);collected.add(tile.id);}
      board=stepBoard(result.board,[{...input,down:false}]).board;
    }
    expect(board.topOut).toBe(false);rewardFree=board.issued===24&&board.next.every(p=>p.payload===null);
  }
  expect(rewardFree).toBe(true);expect(board.issued).toBe(24);
  expect([...collected].every(id=>combatPayloadEntries('attempt',combatPack().combat).some(t=>t.id===id))).toBe(true);
});
