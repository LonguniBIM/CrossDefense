import {expect,it} from 'vitest';
import {CombatApplication} from '../../src/application/combat/CombatApplication';
import {InMemoryAttemptRepository} from '../../src/infrastructure/persistence/InMemoryAttemptRepository';
import {combatPack,combatBuild,startCommand} from '../combatFixture';
import {equippedWords,type EquippedTile} from '../../src/domain/build/shipBuild';
import {RenderResources} from '../../src/presentation/renderer/RenderResources';
async function open(){
  const pack=combatPack(),run=combatBuild(pack),repo=new InMemoryAttemptRepository();
  await repo.createPilot({operationId:'pilot',pilot:{pilotId:run.pilotId,nickname:'Observer test',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt}});
  await repo.createRun({operationId:'run',run});await repo.startAttempt(startCommand(run),pack);const app=new CombatApplication(repo,()=> 'observation-operation');await app.open(run.pilotId,'combat-attempt');return app;
}
it('multi-tick frames preserve each actual fire and resource-loss observation even when the final tick has no events',async()=>{
  const app=await open();for(let i=0;i<4;i++)await app.frame(1000/30);
  const view=app.projection();expect(view.simulation.battle.tick).toBe(8);expect(view.simulation.battle.events).toEqual([]);
  expect(view.recentEvents.map(e=>e.tick)).toEqual([1,1,7,7]);expect(new Set(view.recentEvents.map(e=>e.id)).size).toBe(4);
  expect(view.recentEvents.filter(e=>e.event.kind==='fire').every(e=>e.event.moduleId&&e.event.weapon==='Ballistic'&&e.event.due===7)).toBe(true);
  expect(view.recentEvents.filter(e=>e.event.kind==='hit').map(e=>e.event.hullLoss)).toEqual(expect.arrayContaining([98182,62992]));
});
it('copied renderer observations cannot change gameplay, RNG or the next deterministic result',async()=>{
  const a=await open(),b=await open();for(let i=0;i<8;i++)await a.frame(1000/60);for(let i=0;i<4;i++)await b.frame(1000/30);
  const copy=a.projection();copy.recentEvents.length=0;copy.simulation.battle.player.hull=0;copy.simulation.board.next.length=0;
  expect(a.projection()).toEqual(b.projection());await a.frame(1000/60);await b.frame(1000/60);expect(a.projection()).toEqual(b.projection());
});
it('pause retains effect age and Resume does not replay fire events or consume extra gameplay randomness',async()=>{
  const app=await open();await app.frame(1000/60);const before=app.projection();app.pause('Context lost');await app.frame(10000);
  expect(app.projection().recentEvents).toEqual(before.recentEvents);expect(app.projection().simulation.battle.tick).toBe(before.simulation.battle.tick);
  app.requestResume();await app.frame(3000);expect(app.projection().recentEvents).toEqual(before.recentEvents);await app.frame(1000/60);expect(app.projection().recentEvents).toEqual(before.recentEvents);
});
it('word projection preserves duplicate occurrences and both axes without mutating supplied equipment',()=>{
  const tiles:EquippedTile[]=[];
  for(const y of [0,2])for(const [x,letter] of [...'SHIP'].entries())tiles.push({id:y+':'+x,x,y,letter,subtype:'Armor',multiplier:100});
  const original=structuredClone(tiles),words=equippedWords(tiles,combatPack().build.supportedSpellings);
  expect(words.filter(w=>w.supported&&w.spelling==='SHIP')).toHaveLength(2);expect(words[0]!.tileIds).not.toEqual(words[1]!.tileIds);expect(tiles).toEqual(original);
  const crossing:EquippedTile[]=[...tiles.filter(t=>t.y===2),{id:'vertical-s',x:2,y:1,letter:'S',subtype:'Ballistic',multiplier:100},{id:'vertical-p',x:2,y:3,letter:'P',subtype:'Armor',multiplier:100}];
  expect(equippedWords(crossing,combatPack().build.supportedSpellings).filter(w=>w.supported).map(w=>[w.spelling,w.axis])).toEqual([['SHIP','horizontal'],['SIP','vertical']]);
});
it('resource ownership deduplicates shared objects, disposes idempotently and immediately releases late async arrivals',()=>{
  const owner=new RenderResources();let released=0;const object={dispose:()=>{released++;}};
  owner.own(object);owner.own(object);expect(owner.alive).toBe(1);owner.dispose();owner.dispose();expect(released).toBe(1);expect(owner.alive).toBe(0);
  owner.own({dispose:()=>{released++;}});expect(released).toBe(2);expect(owner.created).toBe(owner.released);expect(owner.alive).toBe(0);
});
