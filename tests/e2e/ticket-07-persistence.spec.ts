import {expect,test} from '@playwright/test';
import {combatPack,combatBuild,startCommand} from '../combatFixture';

for(const terminal of [false,true])test('real IndexedDB collection'+(terminal?' and terminal outcome':'')+' rolls back with receipt failure and Retry commits once',async({page})=>{
  await page.route('**/combat-storage-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated combat storage</body></html>'}));
  await page.goto('/combat-storage-fixture');
  const result=await page.evaluate(async({pack,run,start,terminal})=>{
    const load=(path:string)=>import(path);
    const {DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const repo=new DexieWorkspaceRepository();await repo.initialize();
    await repo.createPilot({operationId:'pilot',pilot:{pilotId:run.pilotId,nickname:'Combat storage',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt}});
    await repo.createRun({operationId:'run',run});await repo.startAttempt(start,pack);
    const before=await repo.getActiveRun(run.pilotId);
    const command={kind:'combat-tick',operationId:'clear-and-end',pilotId:run.pilotId,runId:run.runId,attemptId:start.attemptId,expectedRevision:0,tick:60,
      payloadIds:[start.attemptId+':payload:0',start.attemptId+':payload:1'],terminal:terminal?{kind:'victory',causes:[]}:null,recordedAt:'2026-10-09T00:01:00Z'};
    const add=IDBObjectStore.prototype.add,writes:unknown[]=[];let fail=true,error='';
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='combatOperations'){writes.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected combat receipt failure','UnknownError');}}return add.apply(this,args);};
    let failed,failedOutcome,after,afterOutcome;
    try{
      try{await repo.commitCombat(command);}catch(caught){error=String(caught);}
      failed=await repo.getActiveRun(run.pilotId);failedOutcome=await repo.getCombatOutcome(run.pilotId,start.attemptId);
      after=await repo.commitCombat(command);await repo.commitCombat(command);
      afterOutcome=await repo.getCombatOutcome(run.pilotId,start.attemptId);
    }finally{IDBObjectStore.prototype.add=add;}
    const fresh=new DexieWorkspaceRepository();await fresh.initialize();
    return {before,error,failed,failedOutcome,after,afterOutcome,writes,reloaded:await fresh.getActiveRun(run.pilotId)};
  },{pack:combatPack(),run:combatBuild(),start:startCommand(combatBuild()),terminal});
  expect(result.error).toContain('Injected combat receipt failure');expect(result.failed).toEqual(result.before);expect(result.failedOutcome).toBeUndefined();
  expect(result.writes).toHaveLength(2);expect(result.writes[1]).toEqual(result.writes[0]);
  expect(result.after.run.salvageBuffer).toHaveLength(2);expect(result.after.run.attempt.combatProgress.revision).toBe(1);
  expect(result.after.run.shipBuild).toEqual(result.before.shipBuild);expect(result.after.run.salvage).toEqual(result.before.salvage);
  expect(result.reloaded).toEqual(result.after.run);expect(result.after.run).not.toHaveProperty('credits');
  if(terminal){expect(result.afterOutcome.settlement).toBe('pending-ticket09');expect(result.afterOutcome.rewards.firstClear.credits).toBe(20);expect(result.after.run.phase).toBe('build');}
  else {expect(result.afterOutcome).toBeUndefined();expect(result.after.run.phase).toBe('attempt');}
});

for(const kind of ['interrupt-attempt','abandon-attempt'] as const)test(kind+' keeps loot and publishes its independent combat outcome only with the same atomic receipt',async({page})=>{
  await page.route('**/combat-end-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated combat ending</body></html>'}));await page.goto('/combat-end-fixture');
  const result=await page.evaluate(async({pack,run,start,kind})=>{
    const load=(path:string)=>import(path);const {DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');const repo=new DexieWorkspaceRepository();await repo.initialize();
    await repo.createPilot({operationId:'pilot',pilot:{pilotId:run.pilotId,nickname:'Combat ending',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt}});await repo.createRun({operationId:'run',run});await repo.startAttempt(start,pack);
    await repo.commitCombat({kind:'combat-tick',operationId:'first-clear',pilotId:run.pilotId,runId:run.runId,attemptId:start.attemptId,expectedRevision:0,tick:10,payloadIds:[start.attemptId+':payload:0'],terminal:null,recordedAt:'2026-10-09T00:01:00Z'});
    const before=await repo.getActiveRun(run.pilotId),command={kind,operationId:'end',pilotId:run.pilotId,runId:run.runId,attemptId:start.attemptId,endedAt:'2026-10-09T00:02:00Z'};
    const add=IDBObjectStore.prototype.add;let fail=true,error='',failed,outcomeBefore;
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='attemptOperations'&&(args[0] as {kind:string}).kind===kind&&fail){fail=false;throw new DOMException('Injected combat end receipt','UnknownError');}return add.apply(this,args);};
    try{try{await repo.endAttempt(command);}catch(caught){error=String(caught);}failed=await repo.getActiveRun(run.pilotId);outcomeBefore=await repo.getCombatOutcome(run.pilotId,start.attemptId);await repo.endAttempt(command);await repo.endAttempt(command);}finally{IDBObjectStore.prototype.add=add;}
    return {before,failed,error,outcomeBefore,after:await repo.getActiveRun(run.pilotId),outcome:await repo.getCombatOutcome(run.pilotId,start.attemptId)};
  },{pack:combatPack(),run:combatBuild(),start:startCommand(combatBuild()),kind});
  expect(result.error).toContain('Injected combat end');expect(result.failed).toEqual(result.before);expect(result.outcomeBefore).toBeUndefined();
  expect(result.after.salvageBuffer).toEqual(result.before.salvageBuffer);expect(result.after.shipBuild).toEqual(result.before.shipBuild);
  expect(result.outcome.settlement).toBe('not-eligible');expect(result.outcome.terminal.kind).toBe(kind==='interrupt-attempt'?'interrupted':'abandoned');
});
