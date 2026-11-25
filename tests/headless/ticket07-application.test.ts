import {expect,it} from 'vitest';
import {combatPack,combatBuild,startCommand} from '../combatFixture';
import {choosePlacement} from '../preRunPlayer';
import {InMemoryAttemptRepository} from '../../src/infrastructure/persistence/InMemoryAttemptRepository';
import {CombatApplication} from '../../src/application/combat/CombatApplication';
import type {CombatCommit} from '../../src/domain/combat/collection';

class FailingCollection extends InMemoryAttemptRepository {
  fail=true;commands:CombatCommit[]=[];
  override async commitCombat(command:CombatCommit){this.commands.push(structuredClone(command));if(this.fail){this.fail=false;throw Error('Injected collection write failure');}return super.commitCombat(command);}
}
async function setup(repo=new InMemoryAttemptRepository()){
  const pack=combatPack(),run=combatBuild(pack);
  await repo.createPilot({operationId:'pilot',pilot:{pilotId:run.pilotId,nickname:'Combat test',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt}});
  await repo.createRun({operationId:'run',run});await repo.startAttempt(startCommand(run),pack);
  let id=0;const app=new CombatApplication(repo,()=> 'combat-op-'+(++id),()=> '2026-10-09T00:01:00Z');await app.open(run.pilotId,'combat-attempt');
  return {app,repo,run};
}
async function playUntilCollection(app:CombatApplication){
  for(let piece=0;piece<60;piece++){
    const actions=choosePlacement(app.projection().simulation.board);
    for(const action of actions){
      const command={action,code:action,down:true,pieceId:app.projection().simulation.board.active.id};
      await app.advance([command]);
      if(app.projection().status==='save-failed'||app.projection().collected.length>0)return;
      await app.advance([{...command,down:false}]);
    }
  }
  throw Error('The legal test player did not reach a collection.');
}
it('legal board inputs reach a real barrier; a failed write freezes both clocks, Retry grants once and preserves a manual pause',async()=>{
  const repo=new FailingCollection(),{app,run}=await setup(repo);await playUntilCollection(app);
  expect(app.projection().status).toBe('save-failed');expect(app.projection().collected).toEqual([]);
  const failed=app.projection();await app.advance([]);expect(app.projection().simulation).toEqual(failed.simulation);
  app.pause('Manual pause during save');await app.retry();
  expect(repo.commands).toHaveLength(2);expect(repo.commands[1]).toEqual(repo.commands[0]);
  expect(app.projection().status).toBe('paused');expect(app.projection().collected.length).toBeGreaterThan(0);
  const saved=await repo.getActiveRun(run.pilotId);expect(saved?.shipBuild).toEqual(run.shipBuild);expect(saved?.quota).toEqual(run.quota);
  expect(saved?.salvageBuffer?.length).toBe(app.projection().collected.length);
  app.requestResume();await app.frame(3000,[]);expect(app.projection().simulation).toEqual(failed.simulation);
  expect(app.projection().status).toBe('playing');
});

it('ordinary successful collection resumes without countdown and duplicate acknowledgment cannot add loot twice',async()=>{
  const {app,repo}=await setup();await playUntilCollection(app);
  expect(app.projection().status).toBe('playing');expect(app.projection().resumeRemaining).toBeNull();
  const count=app.projection().collected.length,tick=app.projection().simulation.battle.tick;
  await app.retry();expect(app.projection().collected).toHaveLength(count);
  await app.advance();expect(app.projection().simulation.battle.tick).toBe(tick+1);
});
it('frame schedules reproduce the same shared state while hidden/lag pause discards elapsed gameplay',async()=>{
  const a=(await setup()).app,b=(await setup()).app,c=(await setup()).app;
  for(let i=0;i<120;i++)await a.frame(1000/60);
  for(let i=0;i<60;i++)await b.frame(1000/30);
  for(let i=0;i<60;i++){await c.frame(1000/120);await c.frame(1000/40);}
  expect(a.projection().simulation.battle.tick).toBe(120);expect(b.projection().simulation).toEqual(a.projection().simulation);expect(c.projection().simulation).toEqual(a.projection().simulation);
  const tick=c.projection().simulation.battle.tick;await c.frame(1000);expect(c.projection().status).toBe('paused');expect(c.projection().simulation.battle.tick).toBe(tick);
  await c.frame(60000);expect(c.projection().simulation.battle.tick).toBe(tick);
});
class LostAcknowledgment extends InMemoryAttemptRepository {
  fail=true;commands:CombatCommit[]=[];
  override async commitCombat(command:CombatCommit){this.commands.push(structuredClone(command));const result=await super.commitCombat(command);if(this.fail){this.fail=false;throw Error('Injected lost acknowledgment');}return result;}
}
it('lost acknowledgment retries the identical operation rather than replaying its tick or duplicating payloads',async()=>{
  const repo=new LostAcknowledgment(),{app,run}=await setup(repo);await playUntilCollection(app);
  expect(app.projection().status).toBe('save-failed');const saved=await repo.getActiveRun(run.pilotId);expect(saved?.salvageBuffer?.length).toBeGreaterThan(0);
  const tick=app.projection().simulation.battle.tick;await app.retry();
  expect(repo.commands).toHaveLength(2);expect(repo.commands[1]).toEqual(repo.commands[0]);expect(app.projection().simulation.battle.tick).toBe(tick);
  expect(app.projection().collected).toEqual(saved!.salvageBuffer);expect(app.projection().status).toBe('playing');
});
it('full approved Map reaches boss victory with legal board inputs; outcome remains unpaid and independent of latest Attempt',async()=>{
  const {app,repo,run}=await setup();
  for(let batch=0;batch<800&&app.projection().status!=='ended';batch++){
    const view=app.projection();
    if(batch%3===0){
      for(const action of choosePlacement(view.simulation.board)){
        const command={action,code:action,down:true,pieceId:app.projection().simulation.board.active.id};await app.advance([command]);await app.advance([{...command,down:false}]);
        if(app.projection().status==='ended')break;
      }
    }
    for(let tick=0;tick<10&&app.projection().status!=='ended';tick++)await app.advance();
  }
  const result=app.projection();expect(result.status).toBe('ended');expect(result.outcome?.terminal.kind).toBe('victory');
  expect(result.outcome?.settlement).toBe('pending-ticket09');expect(result.collected.length).toBeGreaterThan(0);
  expect(result.run.shipBuild).toEqual(run.shipBuild);expect(result.run.salvage).toEqual(run.salvage);expect(result.run).not.toHaveProperty('credits');
  expect(await repo.getCombatOutcome(run.pilotId,'combat-attempt')).toEqual(result.outcome);
},20000);

it('the same ordered piece-targeted inputs produce equal digests across 30/60 Hz and jittered render schedules',async()=>{
  const schedules=[Array(120).fill(1000/60),Array(60).fill(1000/30),Array.from({length:60},()=>[1000/120,1000/40]).flat()];
  const states=[];
  for(const schedule of schedules){
    const {app}=await setup();let event=0;
    for(const elapsed of schedule){
      const board=app.projection().simulation.board,inputs=[];
      if(event===0&&board.tick===0){inputs.push({action:'right' as const,code:'ArrowRight',down:true,pieceId:board.active.id});event++;}
      else if(event===1&&board.tick===4){inputs.push({action:'right' as const,code:'ArrowRight',down:false,pieceId:board.active.id},{action:'drop' as const,code:'Space',down:true,pieceId:board.active.id},{action:'drop' as const,code:'Space',down:false,pieceId:board.active.id});event++;}
      else if(event===2&&board.tick===20){inputs.push({action:'cw' as const,code:'KeyX',down:true,pieceId:board.active.id},{action:'cw' as const,code:'KeyX',down:false,pieceId:board.active.id});event++;}
      await app.frame(elapsed,inputs);
    }
    expect(event).toBe(3);states.push(app.projection().simulation);
  }
  expect(states[0]!.board.locks).toBe(1);expect(states[0]!.battle.tick).toBe(120);expect(states[1]).toEqual(states[0]);expect(states[2]).toEqual(states[0]);
});
