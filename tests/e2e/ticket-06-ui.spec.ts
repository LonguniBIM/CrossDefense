import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { buildPack, finishedBuildRun } from '../buildFixture';
import { openSavedBuild, continueSavedBuild } from '../buildBrowserFixture';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';
const pack=JSON.parse(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json','utf8')) as ContentPackManifest;
const run=finishedBuildRun('attempt-ui-run','attempt-ui-pilot',pack);
const tile=(index:number)=>`[data-testid="cargo-tile"][data-tile-id="${run.runId}:starter:${index}"]`;
async function ship(page:Page) { for(let index=0;index<4;index++) { await page.locator(tile(index)).click(); await page.getByTestId('cell-'+String.fromCharCode(65+index)+'3').click(); await expect(page.getByTestId('build-status')).toHaveText('Placement saved.'); } }

test('old Build Run stays editable and never borrows a Map from the new default',async({page},testInfo)=>{
  const old=finishedBuildRun();
  await openSavedBuild(page,old,buildPack());
  await page.getByTestId('choose-map').click();
  await expect(page.getByTestId('map-content-unavailable')).toContainText('pinned content has no');
  await expect(page.getByTestId('start-attempt')).toBeDisabled();
  await expect(page.getByTestId('selection-content')).toHaveText('development-build-ship-v1');
  await page.screenshot({path:testInfo.outputPath('legacy-map-unavailable.png'),fullPage:true});
  await page.getByTestId('back-to-build').click();
  await expect(page.getByTestId('ship-grid')).toBeVisible();
  await expect(page.getByTestId('build-content-version')).toHaveText('development-build-ship-v1');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
});

test('saved difficulty and immutable diagnostic Attempt survive reload as interrupted Build with empty history',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);await ship(page);
  await page.getByTestId('choose-map').click();
  await expect(page.getByTestId('difficulty-selection')).toHaveValue('Normal');
  await page.getByTestId('difficulty-selection').selectOption('Hard');
  await expect(page.getByTestId('launch-status')).toHaveText('Difficulty saved.');
  await page.screenshot({path:testInfo.outputPath('map-selection.png'),fullPage:true});
  await page.getByTestId('start-attempt').click();
  await expect(page.getByRole('heading',{name:'Map Attempt diagnostic',exact:true})).toBeVisible();
  await expect(page.getByTestId('attempt-difficulty')).toHaveText('Hard');
  await expect(page.getByTestId('diagnostic-capability')).toContainText('not implemented or simulated');
  const attemptId=await page.getByTestId('attempt-id').innerText();
  await expect(page.getByTestId('attempt-layout')).toContainText('C3: I / Power');
  await page.screenshot({path:testInfo.outputPath('attempt-diagnostic.png'),fullPage:true});
  await page.reload();await continueSavedBuild(page);
  await expect(page.getByTestId('attempt-recovery')).toContainText(attemptId+' was interrupted');
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await expect(page.getByTestId('undo-build')).toBeDisabled();await expect(page.getByTestId('redo-build')).toBeDisabled();
  await page.screenshot({path:testInfo.outputPath('interrupted-build.png'),fullPage:true});
  await page.getByTestId('choose-map').click();await expect(page.getByTestId('difficulty-selection')).toHaveValue('Hard');
});

test('insufficient Power is a hard blocker but unsupported spelling is not',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);
  await page.locator(tile(0)).click();await page.getByTestId('cell-A3').click();
  await page.getByTestId('choose-map').click();
  await expect(page.getByTestId('launch-blockers')).toContainText('Available Power');await expect(page.getByTestId('start-attempt')).toBeDisabled();
  await page.screenshot({path:testInfo.outputPath('power-blocked.png'),fullPage:true});
  await page.getByTestId('back-to-build').click();
  await page.locator(tile(1)).click();await page.getByTestId('cell-B3').click();
  await page.locator(tile(2)).click();await page.getByTestId('cell-C3').click();
  await expect(page.getByTestId('equipped-word')).toHaveCount(0);
  await page.getByTestId('choose-map').click();await expect(page.getByTestId('start-attempt')).toBeEnabled();
  await page.getByTestId('start-attempt').click();await expect(page.getByTestId('attempt-id')).toBeVisible();
  await expect(page.getByTestId('attempt-layout')).toContainText('C3: I / Power');
});

test('zero offense requires explicit Start anyway; abandoning the diagnostic returns the same saved Build',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);await page.getByTestId('choose-map').click();
  await expect(page.getByTestId('start-attempt')).toBeEnabled();
  await page.getByTestId('start-attempt').click();await expect(page.getByTestId('attempt-confirmation')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('no-offense-advisory.png'),fullPage:true});
  await page.getByTestId('cancel-attempt').click();await expect(page.getByTestId('attempt-id')).toHaveCount(0);
  await page.getByTestId('start-attempt').click();await page.getByTestId('confirm-attempt').click();
  await expect(page.getByTestId('attempt-layout')).toHaveText('No equipped tiles.');
  await page.getByTestId('end-diagnostic').click();await page.getByTestId('confirm-attempt').click();
  await expect(page.getByTestId('ship-grid')).toBeVisible();await expect(page.getByTestId('attempt-recovery')).toContainText('abandoned');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');await expect(page.getByTestId('cargo-tile')).toHaveCount(8);
  await expect(page.getByTestId('power-available')).toHaveText('0');await expect(page.getByTestId('undo-build')).toBeDisabled();
});

for(const kind of ['start-attempt','set-difficulty'] as const) test(kind+' write failure keeps controls blocked and Retry reuses the same receipt',async({page},testInfo)=>{
  await page.addInitScript(({kind})=>{
    const add=IDBObjectStore.prototype.add,attempts:unknown[]=[];let fail=true;
    (window as unknown as {attemptWrites:unknown[]}).attemptWrites=attempts;
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){
      if(this.name==='attemptOperations'&&(args[0] as {kind?:string}).kind===kind){attempts.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected '+kind+' save failure','UnknownError');}}
      return add.apply(this,args);
    };
  },{kind});
  await openSavedBuild(page,run,pack);await ship(page);await page.getByTestId('choose-map').click();
  if(kind==='start-attempt')await page.getByTestId('start-attempt').click();else await page.getByTestId('difficulty-selection').selectOption('Hard');
  await expect(page.getByTestId('retry-attempt')).toBeVisible();await expect(page.getByTestId('launch-status')).toContainText('Injected');
  await expect(page.getByTestId('start-attempt')).toBeDisabled();await expect(page.getByTestId('back-to-build')).toBeDisabled();await expect(page.getByTestId('difficulty-selection')).toBeDisabled();
  await expect(page.getByTestId('attempt-id')).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath(kind+'-save-failed.png'),fullPage:true});
  await page.getByTestId('retry-attempt').click();
  if(kind==='start-attempt')await expect(page.getByTestId('attempt-id')).toBeVisible();else {await expect(page.getByTestId('launch-status')).toHaveText('Difficulty saved.');await expect(page.getByTestId('difficulty-selection')).toHaveValue('Hard');}
  const writes=await page.evaluate(()=>(window as unknown as {attemptWrites:unknown[]}).attemptWrites);
  expect(writes).toHaveLength(2);expect(writes[1]).toEqual(writes[0]);
});

test('recovery write failure cannot display ready Build until Retry commits the interrupted outcome',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);await ship(page);await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();
  await expect(page.getByTestId('attempt-id')).toBeVisible();
  await page.addInitScript(()=>{
    const add=IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){
      if(this.name==='attemptOperations'&&(args[0] as {kind?:string}).kind==='interrupt-attempt'&&sessionStorage.getItem('recovery-failed')!=='yes'){
        sessionStorage.setItem('recovery-failed','yes');throw new DOMException('Injected recovery receipt failure','UnknownError');
      }return add.apply(this,args);
    };
  });
  await page.reload();await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();
  await expect(page.getByTestId('ship-grid')).toHaveCount(0);await expect(page.getByTestId('recovery-message')).toContainText('Injected');
  await page.screenshot({path:testInfo.outputPath('recovery-save-failed.png'),fullPage:true});
  await page.getByTestId('retry-storage').click();await continueSavedBuild(page);
  await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
});

test('unresolved Salvage blocks launch independently of sufficient Power',async({page},testInfo)=>{
  const unresolved=structuredClone(run);unresolved.salvageBuffer=[{id:'pending-tile',letter:'Q',subtype:'Armor'}];
  await openSavedBuild(page,unresolved,pack);await ship(page);await page.getByTestId('choose-map').click();
  await expect(page.getByTestId('launch-blockers')).toContainText('Resolve all Salvage');await expect(page.getByTestId('start-attempt')).toBeDisabled();
  await page.screenshot({path:testInfo.outputPath('salvage-blocked.png'),fullPage:true});
});

test('viewport below the accepted minimum prevents Start and restores it only after resizing',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);await ship(page);await page.getByTestId('choose-map').click();
  await page.setViewportSize({width:1100,height:650});await expect(page.getByTestId('start-attempt')).toBeDisabled();await expect(page.getByTestId('launch-size-warning')).toBeVisible();
  await page.setViewportSize({width:1280,height:720});await expect(page.getByTestId('start-attempt')).toBeEnabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('map-minimum.png'),fullPage:true});
});

import { installPreRunTestClock, collectStarterThroughKeyboard } from '../preRunBrowserPlayer';
test('real Q9 HTTP pack and earned starter complete New Run to diagnostic to interrupted Build',async({page},testInfo)=>{
  test.setTimeout(90000);await installPreRunTestClock(page);
  // Select the previous immutable artifact by HTTP redirect; its bytes are still served by Vite.
  await page.route('**/content/packs/development-review-ship-v1/manifest.json',route=>route.fulfill({status:302,headers:{location:'/content/packs/development-attempt-ship-v1/manifest.json'}}));
  const response=await page.request.get('/content/packs/development-attempt-ship-v1/manifest.json');
  expect(response.status()).toBe(200);expect((await response.body()).equals(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json'))).toBe(true);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByLabel('Nickname').fill('Q9 full player');await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByTestId('start-content-version')).toHaveText('development-attempt-ship-v1');await page.getByTestId('start-run').click();await page.getByTestId('begin-salvage').click();
  await expect(page.getByTestId('collected-total')).toHaveText('0');await collectStarterThroughKeyboard(page);await page.getByTestId('finish-salvage').click();
  await expect(page.getByTestId('ship-grid')).toBeVisible();const actualRun=await page.getByTestId('run-id').innerText();
  for(const [letter,subtype,cell] of [['S','Ballistic','A3'],['H','Armor','B3'],['I','Power','C3'],['P','Armor','D3']]){
    await page.getByRole('button',{name:`${letter}, ${subtype}, unplaced Letter Tile`,exact:true}).first().click();await page.getByTestId('cell-'+cell).click();await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  }
  await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByTestId('attempt-id')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('real-q9-diagnostic.png'),fullPage:true});
  await page.reload();await continueSavedBuild(page);await expect(page.getByTestId('run-id')).toHaveText(actualRun);await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');await expect(page.getByTestId('power-surplus')).toHaveText('3.05');expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('real-q9-recovered.png'),fullPage:true});
});

test('CS06-01 evicted old pinned content is restored through Retry without changing the new default',async({page},testInfo)=>{
  const old=finishedBuildRun();await openSavedBuild(page,old,buildPack());
  await page.locator(`[data-testid="cargo-tile"][data-tile-id="${old.runId}:starter:0"]`).click();await page.getByTestId('cell-A3').click();
  await page.evaluate(()=>localStorage.removeItem('crossdefense-content-pack:development-build-ship-v1'));
  let restoredFromHttp=false;page.on('response',response=>{if(response.url().endsWith('/content/packs/development-build-ship-v1/manifest.json')&&response.status()===200)restoredFromHttp=true;});
  await page.reload();await page.getByTestId('pilot-card').getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Content Required',exact:true})).toBeVisible();
  await page.getByTestId('retry-content').click();
  await expect(page.getByTestId('ship-grid')).toBeVisible();await expect(page.getByTestId('cell-A3')).toContainText('S');
  await expect(page.getByTestId('build-content-version')).toHaveText('development-build-ship-v1');expect(restoredFromHttp).toBe(true);
  await page.screenshot({path:testInfo.outputPath('old-pack-restored.png'),fullPage:true});
  await page.getByTestId('back-to-pilots').click();await page.getByLabel('Nickname').fill('After old restore');await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').filter({hasText:'After old restore'}).getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByTestId('start-content-version')).toHaveText('development-review-ship-v1');
});

test('CS06-02 Map-selection read failure renders recovery after the Build view has been disposed',async({page})=>{
  // Register before Dexie captures the browser transaction method, then arm only the Map read.
  await page.addInitScript(()=>{
    const transaction=IDBDatabase.prototype.transaction;
    (window as unknown as {failMapRead:boolean}).failMapRead=false;
    IDBDatabase.prototype.transaction=function(...args:Parameters<typeof transaction>){
      const stores=typeof args[0]==='string'?[args[0]]:Array.from(args[0]);
      if((window as unknown as {failMapRead:boolean}).failMapRead&&stores.includes('runs')&&(!args[1]||args[1]==='readonly')){
        (window as unknown as {mapReadFaultObserved:boolean}).mapReadFaultObserved=true;
        throw new DOMException('Injected Map selection read failure','UnknownError');
      }
      return transaction.apply(this,args);
    };
  });
  await openSavedBuild(page,run,pack);await ship(page);
  await page.evaluate(()=>{(window as unknown as {failMapRead:boolean}).failMapRead=true;});
  await page.getByTestId('choose-map').click();
  await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();
  await expect(page.getByTestId('recovery-message')).toContainText('Injected Map selection');
  expect(await page.evaluate(()=>(window as unknown as {mapReadFaultObserved:boolean}).mapReadFaultObserved)).toBe(true);
  await page.evaluate(()=>{(window as unknown as {failMapRead:boolean}).failMapRead=false;});
  await page.getByTestId('retry-storage').click();await continueSavedBuild(page);
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');await expect(page.getByTestId('build-collected-count')).toHaveText('8');
});

test('CS06-03 Map and diagnostic fit the accepted minimum and reference viewport without document scroll',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);await ship(page);await page.getByTestId('choose-map').click();
  for(const viewport of [{width:1280,height:720},{width:1366,height:768}]) {
    await page.setViewportSize(viewport);
    const bounds=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
    expect(bounds.width).toBeLessThanOrEqual(viewport.width);expect(bounds.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.getByTestId('start-attempt').click();await expect(page.getByTestId('attempt-id')).toBeVisible();
  for(const viewport of [{width:1280,height:720},{width:1366,height:768}]) {
    await page.setViewportSize(viewport);
    const bounds=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,bottom:document.querySelector('[data-testid="end-diagnostic"]')!.getBoundingClientRect().bottom}));
    expect(bounds.width).toBeLessThanOrEqual(viewport.width);expect(bounds.height).toBeLessThanOrEqual(viewport.height);expect(bounds.bottom).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({path:testInfo.outputPath('diagnostic-'+viewport.width+'.png'),fullPage:true});
  }
});

test('recovered Build keeps its notice and all panels within the accepted minimum viewport',async({page},testInfo)=>{
  await openSavedBuild(page,run,pack);await ship(page);await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByTestId('attempt-id')).toBeVisible();
  await page.reload();await continueSavedBuild(page);
  for(const viewport of [{width:1280,height:720},{width:1366,height:768}]) {
    await page.setViewportSize(viewport);
    const bounds=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}));
    expect(bounds.height).toBeLessThanOrEqual(viewport.height);expect(bounds.width).toBeLessThanOrEqual(viewport.width);
    await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');
    await page.screenshot({path:testInfo.outputPath('recovered-build-'+viewport.width+'.png'),fullPage:true});
  }
});

test('a corrupted saved startup is rejected without converting or replacing Player Data',async({page})=>{
  await openSavedBuild(page,run,pack);await ship(page);await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByTestId('attempt-id')).toBeVisible();
  const before=await page.evaluate(async runId=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('crossdefense-player-data');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    try{return await new Promise<unknown>((resolve,reject)=>{
      const tx=db.transaction('runs','readwrite'),store=tx.objectStore('runs'),request=store.get(runId);let saved:unknown;
      request.onsuccess=()=>{const value=request.result;value.attempt.startup.placements[0].tileId='unowned-snapshot-tile';saved=structuredClone(value);store.put(value);};
      tx.oncomplete=()=>resolve(saved);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });}finally{db.close();}
  },run.runId);
  await page.reload();await expect(page.getByRole('heading',{name:'Workspace recovery',exact:true})).toBeVisible();await expect(page.getByTestId('ship-grid')).toHaveCount(0);
  const after=await page.evaluate(async runId=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('crossdefense-player-data');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    try{return await new Promise<unknown>((resolve,reject)=>{const request=db.transaction('runs','readonly').objectStore('runs').get(runId);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
  },run.runId);
  expect(after).toEqual(before);
});
