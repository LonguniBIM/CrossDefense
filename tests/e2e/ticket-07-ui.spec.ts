import {expect,test,type Page} from '@playwright/test';
import {combatPack,combatBuild} from '../combatFixture';
import {openSavedBuild,continueSavedBuild} from '../buildBrowserFixture';
import {installPreRunTestClock} from '../preRunBrowserPlayer';
async function frame(page:Page,ms=1000/60){await page.evaluate(async ms=>{await (window as unknown as {__buildTestFrame:(ms:number)=>Promise<void>}).__buildTestFrame(ms);},ms);}
async function openCombat(page:Page){
  await installPreRunTestClock(page);await openSavedBuild(page,combatBuild(),combatPack());
  await page.getByTestId('choose-map').click();await expect(page.getByTestId('start-attempt')).toHaveText('Start Map');
  await page.getByTestId('start-attempt').click();await expect(page.getByRole('heading',{name:'Map combat',exact:true})).toBeVisible();
  await frame(page,0);
}
test('a saved SHIP in the approved combat pack starts a factual live HUD',async({page},testInfo)=>{
  await openCombat(page);
  await expect(page.getByTestId('combat-enemy-name')).toHaveText('Scout');await expect(page.getByTestId('player-hull')).toHaveText('1200');
  await expect(page.getByTestId('enemy-hull')).toHaveText('240');await expect(page.getByTestId('combat-threat')).toHaveText('0');
  for(let tick=0;tick<7;tick++)await frame(page);
  expect(Number(await page.getByTestId('enemy-hull').innerText())).toBeLessThan(240);
  expect(Number(await page.getByTestId('player-hull').innerText())).toBeLessThan(1200);
  await expect(page.getByTestId('combat-tick')).toHaveText('7');await expect(page.getByTestId('board-tick')).toHaveText('7');
  await page.screenshot({path:testInfo.outputPath('live-combat.png'),fullPage:true});
});

import {observedBoard,collectStarterThroughKeyboard} from '../preRunBrowserPlayer';
import {choosePlacement} from '../preRunPlayer';
const controls={cw:'x',ccw:'z',left:'ArrowLeft',right:'ArrowRight',drop:'Space',down:'ArrowDown',hold:'c'} as const;
async function collectCombat(page:Page){
  for(let piece=0;piece<60;piece++){
    if(await page.getByTestId('retry-combat').isVisible()||Number(await page.getByTestId('combat-collected').innerText())>0)return;
    for(const action of choosePlacement(await observedBoard(page)))await page.keyboard.press(controls[action]);
    await frame(page);await frame(page);
  }
  throw Error('The keyboard test player did not reach a combat collection.');
}
test('actual keyboard clear survives a failed IndexedDB receipt, Retry without countdown and reload with unresolved Salvage',async({page},testInfo)=>{
  await page.addInitScript(()=>{
    const add=IDBObjectStore.prototype.add;let fail=true;const writes:unknown[]=[];
    (window as unknown as {combatWrites:unknown[]}).combatWrites=writes;
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='combatOperations'){writes.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected live combat save failure','UnknownError');}}return add.apply(this,args);};
  });
  await openCombat(page);await collectCombat(page);
  await expect(page.getByTestId('retry-combat')).toBeVisible();await expect(page.getByTestId('combat-collected')).toHaveText('0');
  await expect(page.getByTestId('combat-error')).toContainText('Injected live combat');
  const tick=await page.getByTestId('combat-tick').innerText();await frame(page,100);await frame(page,100);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);
  await expect(page.getByTestId('abandon-combat')).toBeDisabled();await page.screenshot({path:testInfo.outputPath('collection-save-failed.png'),fullPage:true});
  await page.getByTestId('retry-combat').click();await expect(page.getByTestId('retry-combat')).toBeHidden();await expect(page.getByTestId('resume-combat')).toBeHidden();await expect(page.getByTestId('combat-receipt')).toContainText('Saved to Salvage:');
  const count=Number(await page.getByTestId('combat-collected').innerText());expect(count).toBeGreaterThan(0);
  const writes=await page.evaluate(()=>(window as unknown as {combatWrites:unknown[]}).combatWrites);expect(writes).toHaveLength(2);expect(writes[1]).toEqual(writes[0]);
  await frame(page,0);await frame(page);await expect(page.getByTestId('combat-tick')).toHaveText(String(Number(tick)+1));
  await page.screenshot({path:testInfo.outputPath('collection-saved.png'),fullPage:true});
  await page.reload();await continueSavedBuild(page);
  await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await page.getByTestId('choose-map').click();await expect(page.getByTestId('launch-blockers')).toContainText('Resolve all Salvage');await expect(page.getByTestId('start-attempt')).toBeDisabled();
  await page.screenshot({path:testInfo.outputPath('recovered-salvage-blocker.png'),fullPage:true});
});
test('pause, countdown and minimum viewport stop both clocks without a catch-up burst',async({page},testInfo)=>{
  await openCombat(page);await frame(page);const tick=await page.getByTestId('combat-tick').innerText();
  await page.getByTestId('pause-combat').click();await frame(page,10000);await expect(page.getByTestId('combat-tick')).toHaveText(tick);
  await page.getByTestId('resume-combat').click();for(let i=0;i<4;i++)await frame(page,1000);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('resume-combat')).toBeHidden();
  await frame(page);await frame(page);expect(Number(await page.getByTestId('combat-tick').innerText())).toBeGreaterThan(Number(tick));
  await page.setViewportSize({width:1100,height:650});const stopped=await page.getByTestId('combat-tick').innerText();await frame(page,5000);await expect(page.getByTestId('combat-tick')).toHaveText(stopped);
  await expect(page.getByTestId('resume-combat')).toBeDisabled();await page.setViewportSize({width:1280,height:720});await expect(page.getByTestId('resume-combat')).toBeEnabled();
  await expect(page.getByTestId('combat-tick')).toHaveText(stopped);await page.screenshot({path:testInfo.outputPath('paused-minimum.png'),fullPage:true});
});
test('combat layout fits minimum and reference viewports with equal active Hold and Next cell sizes',async({page},testInfo)=>{
  await openCombat(page);await page.keyboard.press('c');await frame(page);
  for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);
    const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,game:(document.querySelector('.cb-game') as HTMLElement).getBoundingClientRect().bottom,cells:[...document.querySelectorAll<HTMLElement>('.pr-cell')].map(c=>c.getBoundingClientRect().width),harvest:document.querySelector('[data-testid="combat-harvest"]')!.getBoundingClientRect().bottom}));
    expect(layout.width).toBeLessThanOrEqual(viewport.width);expect(layout.height).toBeLessThanOrEqual(viewport.height);expect(layout.harvest).toBeLessThanOrEqual(viewport.height);
    expect(Math.max(...layout.cells)-Math.min(...layout.cells)).toBeLessThan(0.1);
    await page.screenshot({path:testInfo.outputPath('combat-'+viewport.width+'.png'),fullPage:true});
  }
});
test('real default HTTP pack and earned Pre-Run starter launch combat and keep actual collection through interruption',async({page},testInfo)=>{
  test.setTimeout(90000);await installPreRunTestClock(page);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByLabel('Nickname').fill('Combat real player');await page.getByTestId('create-pilot').click();await page.getByTestId('pilot-card').getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByTestId('start-content-version')).toHaveText('development-review-ship-v1');await page.getByTestId('start-run').click();await page.getByTestId('begin-salvage').click();
  await expect(page.getByTestId('collected-total')).toHaveText('0');await collectStarterThroughKeyboard(page);await page.getByTestId('finish-salvage').click();
  for(const [letter,subtype,cell] of [['S','Ballistic','A3'],['H','Armor','B3'],['I','Power','C3'],['P','Armor','D3']]){
    await page.getByRole('button',{name:`${letter}, ${subtype}, unplaced Letter Tile`,exact:true}).first().click();await page.getByTestId('cell-'+cell).click();await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  }
  await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByRole('heading',{name:'Map combat',exact:true})).toBeVisible();await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready',{timeout:20000});await frame(page,0);await collectCombat(page);
  expect(Number(await page.getByTestId('combat-collected').innerText())).toBeGreaterThan(0);await page.screenshot({path:testInfo.outputPath('earned-starter-combat.png'),fullPage:true});
  await page.reload();await continueSavedBuild(page);await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');await expect(page.getByTestId('build-collected-count')).toHaveText('8');await expect(page.getByTestId('power-surplus')).toHaveText('3.05');expect(errors).toEqual([]);
});

test('native focus loss pauses combat and returning focus never auto-resumes elapsed time',async({page,context})=>{
  await openCombat(page);await frame(page);const tick=await page.getByTestId('combat-tick').innerText();
  // Playwright enables focus emulation by default (installed coreBundle.js). Disable only for this native visibility test.
  const session=await context.newCDPSession(page);await session.send('Emulation.setFocusEmulationEnabled',{enabled:false});
  const foreground=await context.newPage();await foreground.goto('about:blank');await foreground.bringToFront();
  // This Windows automation environment keeps visibilityState visible even for a background/minimized page.
  // Assert the actual native focus transition; the separate controlled visibility test exercises that input.
  await expect.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(false);
  await expect(page.getByTestId('combat-pause')).toContainText('lost focus');
  await frame(page,10000);await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);
  await page.bringToFront();await foreground.close();await expect(page.getByTestId('resume-combat')).toBeVisible();await expect(page.getByTestId('combat-tick')).toHaveText(tick);
});

async function frames(page:Page,count:number,ms:number){await page.evaluate(async({count,ms})=>{for(let i=0;i<count;i++)await (window as unknown as {__buildTestFrame:(ms:number)=>Promise<void>}).__buildTestFrame(ms);},{count,ms});}
test('the browser plays Scout then Boss with legal keyboard placement and saves victory without currency settlement',async({page},testInfo)=>{
  test.setTimeout(90000);
  // A reproducible victory workload, not a claim that every random sequence or playing policy wins.
  // Override only the injected ID/seed source in this disposable browser, never game state or content.
  await page.addInitScript(() => {
    let serial = 0;
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () =>
      '00000007-0000-4000-8000-' + (++serial).toString(16).padStart(12, '0') });
  });
  await openCombat(page);let bossSeen=false;
  const startup = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try { return await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction('runs', 'readonly').objectStore('runs').get('combat-run');
      request.onsuccess = () => resolve(request.result.attempt); request.onerror = () => reject(request.error);
    }); } finally { db.close(); }
  });
  await testInfo.attach('victory-startup.json', { body: JSON.stringify(startup, null, 2), contentType: 'application/json' });
  const transcript: Array<{ tick: number; pieceId: string; actions: string[] }> = [];
  try {
  for(let piece=0;piece<220;piece++){
    if(await page.getByTestId('return-combat-build').isVisible())break;
    const board = await observedBoard(page), actions = choosePlacement(board);
    transcript.push({ tick: Number(await page.getByTestId('combat-tick').innerText()), pieceId: board.active.id, actions });
    for(const action of actions)await page.keyboard.press(controls[action]);
    // Deliberate placement every three seconds; do not force high-speed hard-drop pressure on a greedy test player.
    // Each 50ms frame remains below the unchanged production lag threshold; both games advance normally.
    await frames(page,60,50);
    if(!bossSeen&&await page.getByTestId('combat-enemy-name').innerText()==='Boss'){bossSeen=true;await page.screenshot({path:testInfo.outputPath('boss-combat.png'),fullPage:true});}
  }
  } finally {
    await testInfo.attach('victory-inputs.json', { body: JSON.stringify(transcript, null, 2), contentType: 'application/json' });
  }
  expect(bossSeen).toBe(true);await expect(page.getByTestId('combat-status')).toHaveText('Outcome saved: victory');await expect(page.getByTestId('combat-settlement')).toContainText('currency has not been granted');
  const tick=await page.getByTestId('combat-tick').innerText(),count=await page.getByTestId('combat-collected').innerText();expect(Number(count)).toBeGreaterThan(0);await frames(page,5,50);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('combat-collected')).toHaveText(count);
  await page.screenshot({path:testInfo.outputPath('victory-unsettled.png'),fullPage:true});
  await page.getByTestId('return-combat-build').click();await expect(page.getByTestId('ship-grid')).toBeVisible();await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await page.getByTestId('choose-map').click();await expect(page.getByTestId('launch-blockers')).toContainText('Resolve all Salvage');
});
test('a confirmed no-offense ship times out and the terminal HUD never resumes the clocks',async({page},testInfo)=>{
  await installPreRunTestClock(page);const run=combatBuild();delete run.shipBuild;await openSavedBuild(page,run,combatPack());
  await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await page.getByTestId('confirm-attempt').click();await expect(page.getByRole('heading',{name:'Map combat',exact:true})).toBeVisible();await frame(page,0);
  await frames(page,910,50);await expect(page.getByTestId('combat-status')).toHaveText('Outcome saved: failed - Timeout');
  await expect(page.getByTestId('combat-collected')).toHaveText('0');await expect(page.getByTestId('combat-tick')).toHaveText('2700');await expect(page.getByTestId('board-tick')).toHaveText('2700');
  await page.screenshot({path:testInfo.outputPath('timeout-unsettled.png'),fullPage:true});
});

test('a controlled visibilitychange input stops both clocks and visible restoration still requires explicit Resume',async({page})=>{
  await openCombat(page);await frame(page);const tick=await page.getByTestId('combat-tick').innerText();
  // Explicit platform-input fixture, not a claim that native hidden state was generated by this harness.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  expect(await page.evaluate(()=>document.hidden)).toBe(true);await expect(page.getByTestId('combat-pause')).toContainText('hidden');
  await frame(page,60000);await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.getByTestId('resume-combat')).toBeVisible();await expect(page.getByTestId('combat-tick')).toHaveText(tick);
});


test('CS07-01 releasing movement over a focused control does not leave a held gameplay key',async({page})=>{
  await openCombat(page);
  await page.keyboard.down('ArrowRight');await frame(page);
  const position=await page.getByTestId('active-piece').getAttribute('data-pivot-x');
  await page.getByTestId('pause-combat').focus();
  await page.keyboard.up('ArrowRight');await frames(page,20,1000/60);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x',position!);
  await expect(page.getByTestId('combat-threat')).toHaveText('0');
  // Space still activates the native button; it must not hard-drop a piece.
  await page.keyboard.press('Space');await frame(page);
  await expect(page.getByTestId('combat-pause')).toContainText('Paused by player');
  await expect(page.getByTestId('combat-threat')).toHaveText('0');
});


test('native animation frames advance both clocks and Pause freezes the live browser without a test clock',async({page},testInfo)=>{
  // Unlike the deterministic interaction scenarios, this uses the browser's real requestAnimationFrame.
  await openSavedBuild(page,combatBuild(),combatPack());
  await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();
  await expect(page.getByRole('heading',{name:'Map combat',exact:true})).toBeVisible();
  await expect.poll(async()=>Number(await page.getByTestId('combat-tick').innerText())).toBeGreaterThan(12);
  await page.getByTestId('pause-combat').click();
  const tick=await page.getByTestId('combat-tick').innerText();
  await page.waitForTimeout(250);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);
  expect(Number(await page.getByTestId('enemy-hull').innerText())).toBeLessThan(240);
  await expect(page.getByTestId('combat-pause')).toContainText('Paused by player');
  await page.screenshot({path:testInfo.outputPath('native-clock-paused.png'),fullPage:true});
});
