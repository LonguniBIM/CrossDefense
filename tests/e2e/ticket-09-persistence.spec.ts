import {test,expect} from '@playwright/test';
import {seedOutcomeSave,inspectResultsSave} from '../resultsBrowserFixture';
import {resultFixture,settlementCommand,keepAllCommand} from '../resultsFixture';

for(const table of ['pilotEconomies','runs','outcomeSettlements','outcomeOperations'])test('settlement failure at '+table+' rolls back balance, entitlement, Run and receipts together',async({page})=>{
  await seedOutcomeSave(page);const command=settlementCommand(resultFixture().run);
  const result=await page.evaluate(async({command,table})=>{
    const load=(path:string)=>import(path);const {DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const repo=new DexieWorkspaceRepository();await repo.initialize();const before=await repo.getResults(command.pilotId);
    const add=IDBObjectStore.prototype.add,put=IDBObjectStore.prototype.put;let error='';
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name===table)throw new DOMException('Injected settlement transaction failure','UnknownError');return add.apply(this,args);};
    IDBObjectStore.prototype.put=function(...args:Parameters<typeof put>){if(this.name===table)throw new DOMException('Injected settlement transaction failure','UnknownError');return put.apply(this,args);};
    try{await repo.settleOutcome(command);}catch(e){error=String(e);}finally{IDBObjectStore.prototype.add=add;IDBObjectStore.prototype.put=put;}
    const failed=await repo.getResults(command.pilotId);
    const retry=await repo.settleOutcome(command);const duplicate=await repo.settleOutcome(command);
    const another=await repo.settleOutcome({...command,operationId:'different-op-same-outcome'});
    let conflict='';try{await repo.settleOutcome({...command,attemptId:'wrong-attempt'});}catch(e){conflict=String(e);}
    return {before,failed,error,retry,duplicate,another,conflict};
  },{command,table});
  expect(result.error).toContain('Injected');expect(result.failed).toEqual(result.before);
  for(const state of [result.retry,result.duplicate,result.another]){expect(state.economy.credits).toBe(24);expect(state.economy.celestium).toBe(1);expect(state.economy.firstClearMapIds).toEqual(['development-map-01']);expect(state.outcomes.filter((row:{settlement:unknown})=>row.settlement)).toHaveLength(1);}
  expect(result.conflict).toBeTruthy();
});

test('native IndexedDB concurrent settlements of one outcome publish one payment and current-state replay',async({page})=>{
  await seedOutcomeSave(page);const command=settlementCommand(resultFixture().run);
  const states=await page.evaluate(async command=>{
    const load=(path:string)=>import(path),{DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');const repo=new DexieWorkspaceRepository();await repo.initialize();
    return Promise.all([repo.settleOutcome(command),repo.settleOutcome({...command,operationId:'second'}),repo.settleOutcome(command)]);
  },command);expect(states.every(state=>state.economy.credits===24&&state.economy.celestium===1)).toBe(true);
  const save=await inspectResultsSave(page);expect(save.tables.outcomeSettlements).toHaveLength(1);expect(save.tables.outcomeOperations).toHaveLength(2);
});
for(const table of ['runs','cargoOperations'])test('Salvage failure at '+table+' preserves original Cargo, quota, positions and exact buffer',async({page})=>{
  await seedOutcomeSave(page);const f=resultFixture(),command=keepAllCommand(f.run);
  const result=await page.evaluate(async({command,content,table})=>{
    const load=(path:string)=>import(path),{DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');const repo=new DexieWorkspaceRepository();await repo.initialize();
    const before=await repo.getActiveRun(command.pilotId),add=IDBObjectStore.prototype.add,put=IDBObjectStore.prototype.put;let error='';
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name===table)throw new DOMException('Injected Cargo receipt failure','UnknownError');return add.apply(this,args);};
    IDBObjectStore.prototype.put=function(...args:Parameters<typeof put>){if(this.name===table)throw new DOMException('Injected Cargo write failure','UnknownError');return put.apply(this,args);};
    try{await repo.resolveCargo(command,content);}catch(e){error=String(e);}finally{IDBObjectStore.prototype.add=add;IDBObjectStore.prototype.put=put;}
    const failed=await repo.getActiveRun(command.pilotId),retry=await repo.resolveCargo(command,content),duplicate=await repo.resolveCargo(command,content);
    let stale='';try{await repo.resolveCargo({...command,operationId:'stale-new'},content);}catch(e){stale=String(e);}
    return {before,failed,error,retry,duplicate,stale};
  },{command,content:f.pack.build!,table});
  expect(result.error).toContain('Injected');expect(result.failed).toEqual(result.before);expect(result.retry).toEqual(result.duplicate);expect(result.retry.cargo.tiles).toHaveLength(10);expect(result.retry.salvageBuffer).toEqual([]);expect(result.retry.salvage).toEqual(result.before.salvage);expect(result.retry.quota).toEqual(result.before.quota);expect(result.stale).toBeTruthy();
});

test('missing saved economy after a paid receipt causes recovery without resetting balance or paying again',async({page})=>{
  await seedOutcomeSave(page);const command=settlementCommand(resultFixture().run);
  await page.evaluate(async command=>{const load=(path:string)=>import(path),{DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');const repo=new DexieWorkspaceRepository();await repo.initialize();await repo.settleOutcome(command);
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('crossdefense-player-data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('pilotEconomies','readwrite');tx.objectStore('pilotEconomies').delete(command.pilotId);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
  },command);
  const before=await inspectResultsSave(page);await page.goto('/');await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();expect(await inspectResultsSave(page)).toEqual(before);
});


test('two different victories settled concurrently claim the Pilot/Map First-Clear once across difficulties',async({page})=>{
  await seedOutcomeSave(page,0);const command=settlementCommand(resultFixture(0).run);
  const state=await page.evaluate(async command=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('crossdefense-player-data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('combatOutcomes','readwrite'),table=tx.objectStore('combatOutcomes'),r=table.get(command.attemptId);r.onsuccess=()=>table.add({...r.result,attemptId:'historical-insane-victory',difficulty:'Insane'});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
    const load=(path:string)=>import(path),{DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');const repo=new DexieWorkspaceRepository();await repo.initialize();
    await Promise.all([repo.settleOutcome(command),repo.settleOutcome({...command,operationId:'other-victory',attemptId:'historical-insane-victory'})]);return repo.getResults(command.pilotId);
  },command);
  expect(state.economy.credits).toBe(33);expect(state.economy.celestium).toBe(1);expect(state.outcomes.filter((row:{settlement:{firstClear:boolean}})=>row.settlement.firstClear)).toHaveLength(1);
});
test('SEC09-01 native migration preserves and rejects an ended buffer whose valid-shaped letter contradicts committed payload',async({page})=>{
  await seedOutcomeSave(page);await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('crossdefense-player-data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('runs','readwrite'),table=tx.objectStore('runs'),r=table.get('combat-run');r.onsuccess=()=>{const run=r.result;run.salvageBuffer[0].letter='X';table.put(run);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
  });const before=await inspectResultsSave(page);await page.goto('/');await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();expect(await inspectResultsSave(page)).toEqual(before);
});
