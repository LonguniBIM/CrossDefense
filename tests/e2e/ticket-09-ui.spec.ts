import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {ContentPackManifest} from '../../src/domain/content/contentPack';
import {openOutcomeBuild,inspectResultsSave} from '../resultsBrowserFixture';
import {continueSavedBuild,openSavedBuild} from '../buildBrowserFixture';
import {combatBuild} from '../combatFixture';
import {installPreRunTestClock,observedBoard} from '../preRunBrowserPlayer';
import {choosePlacement} from '../preRunPlayer';

async function chooseAll(page:Page,value:'keep'|'discard'){await expect(page.getByRole('heading',{name:'Resolve Salvage',exact:true})).toBeVisible();const count=Number(await page.getByTestId('salvage-buffer-count').innerText());expect(count).toBeGreaterThan(0);await expect(page.getByTestId('salvage-choice')).toHaveCount(count);for(const select of await page.getByTestId('salvage-choice').all())await select.selectOption(value);await expect(page.getByTestId('salvage-unresolved')).toHaveText('Unresolved choices: 0');}
async function confirmApply(page:Page){await page.getByTestId('review-salvage').click();await expect(page.getByTestId('salvage-confirmation')).toBeVisible();await expect(page.locator('dialog[open]')).toHaveCount(1);await page.getByTestId('confirm-salvage').click();}

test('historical pending victory pays once, survives reload and keeps its original outcome and content pins',async({page},info)=>{
  await openOutcomeBuild(page);const before=await inspectResultsSave(page);await page.getByTestId('build-results').click();
  await expect(page.getByRole('heading',{name:'Results',exact:true})).toBeVisible();await expect(page.getByTestId('results-credits')).toHaveText('0');await expect(page.getByTestId('result-total')).toHaveText('24 Credits / 1 Celestium');await expect(page.getByTestId('result-loot-count')).toHaveText('2');
  await page.screenshot({path:info.outputPath('pending-results.png'),fullPage:true});await page.getByTestId('settle-result').click();await expect(page.getByTestId('result-saved')).toContainText('Settlement saved');await expect(page.getByTestId('results-credits')).toHaveText('24');await expect(page.getByTestId('results-celestium')).toHaveText('1');await expect(page.getByTestId('settle-result')).toBeDisabled();
  await page.screenshot({path:info.outputPath('settled-results.png'),fullPage:true});await page.reload();await continueSavedBuild(page);await expect(page.getByTestId('build-balances')).toHaveText('Credits 24 | Celestium 1');await expect(page.getByTestId('attempt-recovery')).toContainText('rewards saved');await page.getByTestId('build-results').click();await expect(page.getByTestId('settle-result')).toBeDisabled();
  const after=await inspectResultsSave(page);expect(after.tables.combatOutcomes).toEqual(before.tables.combatOutcomes);expect(after.tables.outcomeSettlements).toHaveLength(1);expect(after.tables.outcomeOperations).toHaveLength(1);
});

test('reward save failure keeps old balances visible and Retry reuses the identical operation',async({page},info)=>{
  await page.addInitScript(()=>{const add=IDBObjectStore.prototype.add;let fail=true;const writes:unknown[]=[];(window as unknown as {rewardWrites:unknown[]}).rewardWrites=writes;IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='outcomeOperations'){writes.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected reward save failure','UnknownError');}}return add.apply(this,args);};});
  await openOutcomeBuild(page);await page.getByTestId('build-results').click();await page.getByTestId('settle-result').click();await expect(page.getByTestId('result-error')).toContainText('Injected reward');await expect(page.getByTestId('results-credits')).toHaveText('0');await expect(page.getByTestId('results-back')).toBeDisabled();await expect(page.getByTestId('results-salvage')).toBeDisabled();
  const failed=await inspectResultsSave(page);expect(failed.tables.outcomeSettlements).toEqual([]);expect(failed.tables.pilotEconomies).toEqual([]);await page.screenshot({path:info.outputPath('reward-save-failed.png'),fullPage:true});
  await page.getByTestId('retry-result').click();await expect(page.getByTestId('results-credits')).toHaveText('24');const writes=await page.evaluate(()=>(window as unknown as {rewardWrites:unknown[]}).rewardWrites);expect(writes).toHaveLength(2);expect(writes[0]).toEqual(writes[1]);
});

test('full Cargo choices show capacity and equipment impact; cancel is nonmutating and one confirmation applies replacements',async({page},info)=>{
  test.setTimeout(90000);await openOutcomeBuild(page,24);const before=await inspectResultsSave(page);await page.getByTestId('build-salvage').click();await expect(page.getByRole('heading',{name:'Resolve Salvage',exact:true})).toBeVisible();await expect(page.getByTestId('review-salvage')).toBeDisabled();
  await chooseAll(page,'keep');await expect(page.getByTestId('salvage-capacity')).toHaveText('32');await expect(page.getByTestId('review-salvage')).toBeDisabled();
  for(const select of (await page.getByTestId('salvage-choice').all()).slice(16))await select.selectOption('discard');
  await page.locator('[data-testid="discard-retained"][data-tile-id="combat-run:starter:2"]').check();
  await expect(page.getByTestId('salvage-capacity')).toHaveText('23');await expect(page.getByTestId('salvage-preview-power')).toContainText('Available 4.05 -> 0');await expect(page.getByTestId('salvage-preview-words')).toContainText('None');
  await page.screenshot({path:info.outputPath('replacement-preview.png'),fullPage:true});await page.getByTestId('review-salvage').click();await expect(page.getByTestId('salvage-confirmation')).toContainText('I / Power at C3');await expect(page.getByTestId('salvage-confirmation')).toContainText('Permanently discard 9');await page.getByTestId('cancel-salvage-confirmation').click();expect(await inspectResultsSave(page)).toEqual(before);
  await page.getByTestId('cancel-salvage').click();await expect(page.getByTestId('build-collected-count')).toHaveText('8');expect(await inspectResultsSave(page)).toEqual(before);
  await page.getByTestId('build-salvage').click();await expect(page.getByTestId('salvage-unresolved')).toHaveText('Unresolved choices: 24');await chooseAll(page,'keep');for(const select of (await page.getByTestId('salvage-choice').all()).slice(16))await select.selectOption('discard');
  await page.locator('[data-testid="discard-retained"][data-tile-id="combat-run:starter:2"]').check();await confirmApply(page);
  await expect(page.getByRole('heading',{name:'Build Phase',exact:true})).toBeVisible();await expect(page.getByTestId('build-collected-count')).toHaveText('23');await expect(page.getByTestId('power-available')).toHaveText('0');await expect(page.getByTestId('undo-build')).toBeDisabled();await expect(page.getByTestId('build-salvage')).toBeDisabled();
  await page.locator('[data-testid="cargo-tile"][data-tile-id="combat-attempt:payload:2"]').click();await page.getByTestId('cell-C3').click();await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  const after=await inspectResultsSave(page);const run=after.tables.runs![0] as {salvage:unknown;quota:unknown;cargo:{tiles:unknown[]}};expect(run.salvage).toEqual((before.tables.runs![0] as {salvage:unknown}).salvage);expect(run.quota).toEqual((before.tables.runs![0] as {quota:unknown}).quota);expect(run.cargo.tiles).toHaveLength(23);
  await page.screenshot({path:info.outputPath('kept-equipment-build.png'),fullPage:true});
});

test('Apply failure keeps original ownership until Retry and never creates duplicate retained tiles',async({page},info)=>{
  await page.addInitScript(()=>{const add=IDBObjectStore.prototype.add;let fail=true;const writes:unknown[]=[];(window as unknown as {cargoWrites:unknown[]}).cargoWrites=writes;IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='cargoOperations'){writes.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected Salvage Apply failure','UnknownError');}}return add.apply(this,args);};});
  await openOutcomeBuild(page);const before=await inspectResultsSave(page);await page.getByTestId('build-salvage').click();await chooseAll(page,'keep');await confirmApply(page);await expect(page.getByTestId('salvage-error')).toContainText('Injected Salvage');await expect(page.getByTestId('cancel-salvage')).toBeDisabled();await expect(page.getByTestId('salvage-choice').first()).toBeDisabled();expect((await inspectResultsSave(page)).tables.runs).toEqual(before.tables.runs);
  await page.screenshot({path:info.outputPath('salvage-save-failed.png'),fullPage:true});await page.getByTestId('retry-salvage').click();await expect(page.getByTestId('build-collected-count')).toHaveText('10');const writes=await page.evaluate(()=>(window as unknown as {cargoWrites:unknown[]}).cargoWrites);expect(writes).toHaveLength(2);expect(writes[0]).toEqual(writes[1]);
  await page.reload();await continueSavedBuild(page);await expect(page.getByTestId('build-collected-count')).toHaveText('10');await expect(page.getByTestId('build-salvage')).toBeDisabled();expect((await inspectResultsSave(page)).tables.cargoOperations).toHaveLength(1);
});

test('failed outcomes save zero reward and discarding all new loot preserves starter and permits replay',async({page})=>{
  await openOutcomeBuild(page,2,'failed');await page.getByTestId('build-results').click();await expect(page.getByTestId('result-title')).toHaveText('Failed: Timeout');await expect(page.getByTestId('result-total')).toHaveText('0 Credits / 0 Celestium');await page.getByTestId('settle-result').click();await expect(page.getByTestId('result-saved')).toContainText('Settlement saved');await expect(page.getByTestId('results-credits')).toHaveText('0');await page.getByTestId('results-salvage').click();await chooseAll(page,'discard');await confirmApply(page);await expect(page.getByTestId('build-collected-count')).toHaveText('8');await expect(page.getByTestId('power-surplus')).toHaveText('3.05');await page.getByTestId('choose-map').click();await expect(page.getByTestId('map-rewards')).toContainText('First-Clear eligible');await expect(page.getByTestId('start-attempt')).toBeEnabled();
});

test('Results and staged Salvage preserve readable controls at minimum/reference viewports',async({page},info)=>{
  await openOutcomeBuild(page,24);await page.getByTestId('build-results').click();
  for(const viewport of [{width:1280,height:720},{width:1366,height:768}]){await page.setViewportSize(viewport);await expect(page.getByTestId('settle-result')).toBeInViewport();await expect(page.getByTestId('results-back')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('results-'+viewport.width+'.png'),fullPage:true});}
  await page.getByTestId('results-salvage').click();for(const viewport of [{width:1280,height:720},{width:1366,height:768}]){await page.setViewportSize(viewport);await expect(page.getByTestId('cancel-salvage')).toBeInViewport();await expect(page.getByTestId('review-salvage')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('salvage-'+viewport.width+'.png'),fullPage:true});}
});

const controls={cw:'x',ccw:'z',left:'ArrowLeft',right:'ArrowRight',drop:'Space',down:'ArrowDown',hold:'c'} as const;
async function frame(page:Page,ms=1000/60,count=1){await page.evaluate(async({ms,count})=>{for(let i=0;i<count;i++)await(window as unknown as {__buildTestFrame:(ms:number)=>Promise<void>}).__buildTestFrame(ms);},{ms,count});}
test('actual rendered Scout/Boss victory settles Q13, applies real Salvage and starts a new preserved Run Attempt',async({page},info)=>{
  test.setTimeout(180000);await page.addInitScript(()=>{let serial=0;Object.defineProperty(crypto,'randomUUID',{configurable:true,value:()=> '00000007-0000-4000-8000-'+(++serial).toString(16).padStart(12,'0')});});
  const pack=JSON.parse(readFileSync('public/content/packs/development-rendered-combat-ship-v1/manifest.json','utf8')) as ContentPackManifest;
  await installPreRunTestClock(page);await openSavedBuild(page,combatBuild(pack));await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready',{timeout:20000});await frame(page,0);
  const firstAttempt=await page.getByTestId('combat-attempt-id').innerText();let boss=false;const transcript:unknown[]=[];
  for(let piece=0;piece<220&&!await page.getByTestId('return-combat-build').isVisible();piece++){const board=await observedBoard(page),actions=choosePlacement(board);transcript.push({tick:await page.getByTestId('combat-tick').innerText(),piece:board.active.id,actions});for(const action of actions)await page.keyboard.press(controls[action]);await frame(page,50,60);boss||=await page.getByTestId('combat-enemy-name').innerText()==='Boss';}
  await info.attach('settlement-gameplay-inputs.json',{body:JSON.stringify(transcript),contentType:'application/json'});expect(boss).toBe(true);await expect(page.getByTestId('combat-status')).toHaveText('Outcome saved: victory');const count=Number(await page.getByTestId('combat-collected').innerText());expect(count).toBeGreaterThan(0);await page.getByTestId('combat-results').click();await expect(page.getByTestId('result-loot-count')).toHaveText(String(count));await page.getByTestId('settle-result').click();await expect(page.getByTestId('results-credits')).toHaveText('24');await page.screenshot({path:info.outputPath('played-victory-paid.png'),fullPage:true});
  await page.getByTestId('results-salvage').click();await expect(page.getByRole('heading',{name:'Resolve Salvage',exact:true})).toBeVisible();await expect(page.getByTestId('salvage-choice')).toHaveCount(count);for(const [index,select]of (await page.getByTestId('salvage-choice').all()).entries())await select.selectOption(index<16?'keep':'discard');await confirmApply(page);await expect(page.getByTestId('build-collected-count')).toHaveText(String(8+Math.min(16,count)));await expect(page.getByTestId('power-surplus')).toHaveText('3.05');await page.getByTestId('choose-map').click();await expect(page.getByTestId('map-rewards')).toContainText('First-Clear already received');await expect(page.getByTestId('map-rewards')).toContainText('Replay');await page.getByTestId('start-attempt').click();await expect(page.getByTestId('combat-attempt-id')).not.toHaveText(firstAttempt);await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready',{timeout:20000});
  await page.getByTestId('abandon-combat').click();await page.getByTestId('confirm-combat-abandon').click();await expect(page.getByTestId('combat-results')).toBeVisible();await page.getByTestId('combat-results').click();await expect(page.getByTestId('result-title')).toHaveText('Abandoned');await expect(page.getByTestId('result-total')).toHaveText('0 Credits / 0 Celestium');await page.getByTestId('settle-result').click();await expect(page.getByTestId('results-credits')).toHaveText('24');await expect(page.getByTestId('results-celestium')).toHaveText('1');await page.screenshot({path:info.outputPath('replayed-abandoned.png'),fullPage:true});
});


test('CS09-04 one content Retry reuses the restored default response and preserves Run identity',async({page},info)=>{
 const version='development-review-ship-v1',pattern='**/content/packs/'+version+'/manifest.json';
 await page.goto('/');await expect(page.getByRole('heading',{name:'Pilot chooser',exact:true})).toBeVisible();
 await page.getByLabel('Nickname').fill('Content recovery');await page.getByTestId('create-pilot').click();
 const pilot=page.getByTestId('pilot-card').filter({hasText:'Content recovery'});await expect(pilot).toHaveCount(1);await pilot.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByTestId('start-run').click();await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');const runId=await page.getByTestId('run-id').innerText();
 await page.evaluate(async version=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('crossdefense-render-content-bodies');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('bodies','readwrite');tx.objectStore('bodies').delete(version);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
 },version);
 await page.route(pattern,route=>route.fulfill({status:404,contentType:'application/json',body:'{}'}));await page.reload();await expect(page.getByRole('heading',{name:'Pilot chooser',exact:true})).toBeVisible();
 await page.getByTestId('pilot-card').getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('heading',{name:'Content Required',exact:true})).toBeVisible();
 await page.unroute(pattern);const requests:string[]=[];page.on('request',request=>{if(request.url().includes('/content/packs/'+version+'/manifest.json'))requests.push(request.url());});
 await page.getByTestId('retry-content').click();await expect(page.getByRole('heading',{name:'Pre-Run Salvage',exact:true})).toBeVisible();
 await expect(page.getByTestId('run-id')).toHaveText(runId);await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
 expect(requests).toHaveLength(1);await info.attach('recovery-requests.json',{body:JSON.stringify(requests),contentType:'application/json'});
 await page.screenshot({path:info.outputPath('same-default-recovered.png'),fullPage:true});
});
