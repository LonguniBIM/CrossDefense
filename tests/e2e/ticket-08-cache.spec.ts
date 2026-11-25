import {expect,test} from '@playwright/test';

for(const failure of ['body','pointer'] as const)test('Q14 '+failure+' failure preserves prior LKG and identical retry publishes the staged body',async({page})=>{
  test.setTimeout(60000);
  await page.route('**/render-cache-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated replaceable cache test</body></html>'}));await page.goto('/render-cache-fixture');
  const result=await page.evaluate(async failure=>{
    const load=(path:string)=>import(path);
    const {LocalStorageContentPackRepository}=await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const repo=new LocalStorageContentPackRepository();await repo.initialize();
    const old=await (await fetch('/content/packs/development-combat-ship-v1/manifest.json')).json(),next=await (await fetch('/content/packs/development-rendered-combat-ship-v1/manifest.json')).json();
    await repo.activate(old);const before=await repo.getState(),beforeDigest=await repo.getExpectedDigest(old.contentVersion);
    const put=IDBObjectStore.prototype.put,set=Storage.prototype.setItem;let fail=true,error='';
    IDBObjectStore.prototype.put=function(...args:Parameters<typeof put>){if(failure==='body'&&this.transaction.db.name==='crossdefense-render-content-bodies'&&fail){fail=false;throw new DOMException('Injected body write failure','UnknownError');}return put.apply(this,args);};
    Storage.prototype.setItem=function(key:string,value:string){if(failure==='pointer'&&key==='crossdefense-content-pack-state'&&value.includes(next.contentVersion)&&fail){fail=false;throw new DOMException('Injected pointer write failure','QuotaExceededError');}return set.call(this,key,value);};
    let failedState,stagedBody,unpublishedDigest;
    try{try{await repo.activate(next);}catch(caught){error=String(caught);}failedState=await repo.getState();stagedBody=await repo.getPack(next.contentVersion);unpublishedDigest=await repo.getExpectedDigest(next.contentVersion);}finally{IDBObjectStore.prototype.put=put;Storage.prototype.setItem=set;}
    await repo.activate(next);await repo.activate(next);
    const after=await repo.getState(),readback=await repo.getPack(next.contentVersion),legacy=await repo.getPack(old.contentVersion);
    return {before,beforeDigest,error,failedState,staged:!!stagedBody,unpublishedDigest,after,roundTrip:JSON.stringify(readback)===JSON.stringify(next),legacyDigest:legacy.integrity.manifestSha256,expectedDigest:await repo.getExpectedDigest(next.contentVersion),nextDigest:next.integrity.manifestSha256,localBody:localStorage.getItem('crossdefense-content-pack:'+next.contentVersion)};
  },failure);
  expect(result.error).toContain('ContentStorageError');expect(result.failedState).toEqual(result.before);expect(result.unpublishedDigest).toBeUndefined();expect(result.staged).toBe(failure==='pointer');
  expect(result.after).toEqual({activeVersion:'development-rendered-combat-ship-v1',lastKnownGoodVersion:'development-rendered-combat-ship-v1'});expect(result.roundTrip).toBe(true);expect(result.legacyDigest).toBe(result.beforeDigest);expect(result.expectedDigest).toBe(result.nextDigest);expect(result.localBody).toBeNull();
});

test('retaining Q14 content does not change the active default and a registered immutable identity cannot be overwritten',async({page})=>{
  await page.route('**/render-cache-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated identity test</body></html>'}));await page.goto('/render-cache-fixture');
  const result=await page.evaluate(async()=>{
    const load=(path:string)=>import(path);const {LocalStorageContentPackRepository}=await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');const repo=new LocalStorageContentPackRepository();await repo.initialize();
    const old=await(await fetch('/content/packs/development-combat-ship-v1/manifest.json')).json(),pack=await(await fetch('/content/packs/development-rendered-combat-ship-v1/manifest.json')).json();
    await repo.activate(old);const before=await repo.getState();await repo.retain(pack);const retained=await repo.getState();
    const changed=structuredClone(pack);changed.integrity.manifestSha256='0'.repeat(64);let error='';try{await repo.activate(changed);}catch(caught){error=String(caught);}
    return {before,retained,error,after:await repo.getState(),digest:(await repo.getPack(pack.contentVersion)).integrity.manifestSha256,expected:pack.integrity.manifestSha256};
  });
  expect(result.retained).toEqual(result.before);expect(result.after).toEqual(result.before);expect(result.error).toContain('different bytes');expect(result.digest).toBe(result.expected);
});
