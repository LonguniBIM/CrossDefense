import {expect,type Page} from '@playwright/test';
import {resultFixture} from './resultsFixture';

/** Native v7 historical outcome, not a production save or proof of winning a real Map. */
export async function seedOutcomeSave(page:Page,count=2,kind:'victory'|'failed'='victory',badOwner=false):Promise<void>{
  const f=resultFixture(count,kind);
  await page.route('**/results-save-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated historical result fixture</body></html>'}));
  await page.goto('/results-save-fixture');
  await page.evaluate(async({run,outcome,pack,badOwner})=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{
      const request=indexedDB.open('crossdefense-player-data',70);
      request.onupgradeneeded=()=>{
        for(const [name,key,indexes]of [
          ['workspace','key',[]],['pilots','pilotId',['lastUsedAt']],['operations','operationId',['pilotId']],
          ['runs','runId',['pilotId','contentVersion','rulesetVersion']],['runOperations','operationId',['pilotId','runId']],
          ['salvageOperations','operationId',['pilotId','runId']],['buildOperations','operationId',['pilotId','runId']],
          ['attemptOperations','operationId',['pilotId','runId','attemptId']],['combatOperations','operationId',['pilotId','runId','attemptId']],
          ['combatOutcomes','attemptId',['pilotId','runId']],
        ] as Array<[string,string,string[]]>){const table=request.result.createObjectStore(name,{keyPath:key});for(const index of indexes)table.createIndex(index,index,{unique:name==='runs'&&index==='pilotId'});}
      };request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    try{await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(Array.from(db.objectStoreNames),'readwrite');
      tx.objectStore('workspace').add({key:'workspace',schemaVersion:7});
      tx.objectStore('pilots').add({pilotId:run.pilotId,nickname:'Results tester',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt});
      tx.objectStore('runs').add(run);tx.objectStore('combatOutcomes').add({...outcome,pilotId:badOwner?'wrong-owner':outcome.pilotId});
      tx.objectStore('operations').add({operationId:'fixture-pilot',pilotId:run.pilotId,kind:'create-pilot'});
      tx.objectStore('runOperations').add({operationId:'fixture-run',pilotId:run.pilotId,runId:run.runId,kind:'start-run'});
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);
    });}finally{db.close();}
    localStorage.setItem('crossdefense-content-pack:'+pack.contentVersion,JSON.stringify(pack));
    localStorage.setItem('crossdefense-content-pack-state',JSON.stringify({activeVersion:pack.contentVersion,lastKnownGoodVersion:pack.contentVersion,digests:{[pack.contentVersion]:pack.integrity.manifestSha256}}));
  },{run:f.run,outcome:f.outcome,pack:f.pack,badOwner});
}
export async function inspectResultsSave(page:Page){return page.evaluate(async()=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('crossdefense-player-data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{const names=Array.from(db.objectStoreNames),tx=db.transaction(names,'readonly');const entries=await Promise.all(names.map(name=>new Promise<[string,unknown[]]>((resolve,reject)=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>resolve([name,r.result]);r.onerror=()=>reject(r.error);})));return {version:db.version,tables:Object.fromEntries(entries)};}finally{db.close();}
});}
export async function openOutcomeBuild(page:Page,count=2,kind:'victory'|'failed'='victory'):Promise<void>{
  await seedOutcomeSave(page,count,kind);await page.goto('/');await expect(page.getByRole('heading',{name:'Pilot chooser',exact:true})).toBeVisible();
  await page.getByTestId('pilot-card').getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('heading',{name:'Build Phase',exact:true})).toBeVisible();
}
