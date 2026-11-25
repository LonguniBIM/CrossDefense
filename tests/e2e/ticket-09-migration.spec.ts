import {test,expect} from '@playwright/test';
import {seedOutcomeSave,inspectResultsSave} from '../resultsBrowserFixture';

test('v7 to v8 preserves every old row and pending reward while adding empty settlement/Cargo stores',async({page})=>{
  await seedOutcomeSave(page);const before=await inspectResultsSave(page);await page.goto('/');await expect(page.getByRole('heading',{name:'Pilot chooser',exact:true})).toBeVisible();
  const after=await inspectResultsSave(page);expect(after.version).toBe(90);expect(after.tables.workspace).toEqual([{key:'workspace',schemaVersion:9}]);
  for(const name of Object.keys(before.tables).filter(name=>name!=='workspace'))expect(after.tables[name]).toEqual(before.tables[name]);
  for(const name of ['pilotEconomies','outcomeSettlements','outcomeOperations','cargoOperations'])expect(after.tables[name]).toEqual([]);
});
test('v7 outcome-owner corruption aborts migration instead of resetting data or paying an invalid result',async({page})=>{
  await seedOutcomeSave(page,2,'victory',true);const before=await inspectResultsSave(page);await page.goto('/');await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();expect(await inspectResultsSave(page)).toEqual(before);
});
test('v8 versionchange failure rolls back all new tables and preserves original v7 outcomes',async({page})=>{
  await seedOutcomeSave(page);const before=await inspectResultsSave(page);await page.addInitScript(()=>{
    const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args:Parameters<typeof put>){if(this.name==='workspace'&&this.transaction.mode==='versionchange'&&(args[0] as {schemaVersion?:number}).schemaVersion===8)throw new DOMException('Injected v8 migration failure','UnknownError');return put.apply(this,args);};
  });await page.goto('/');await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();expect(await inspectResultsSave(page)).toEqual(before);
});
