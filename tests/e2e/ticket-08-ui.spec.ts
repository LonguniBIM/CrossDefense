import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {ContentPackManifest} from '../../src/domain/content/contentPack';
import {combatBuild,combatPack} from '../combatFixture';
import {openSavedBuild,continueSavedBuild} from '../buildBrowserFixture';
import {installPreRunTestClock} from '../preRunBrowserPlayer';
const pack=JSON.parse(readFileSync('public/content/packs/development-rendered-combat-ship-v1/manifest.json','utf8')) as ContentPackManifest;
async function frame(page:Page,ms=1000/60,count=1){await page.evaluate(async({ms,count})=>{for(let i=0;i<count;i++)await (window as unknown as {__buildTestFrame:(ms:number)=>Promise<void>}).__buildTestFrame(ms);},{ms,count});}
async function launch(page:Page){
  await installPreRunTestClock(page);await openSavedBuild(page,combatBuild(pack));
  await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();
  await expect(page.getByRole('heading',{name:'Map combat',exact:true})).toBeVisible();
}
async function rendered(page:Page){await launch(page);await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready',{timeout:20000});await frame(page,0);}

test('Q14 real assets render the saved equipment and words without changing seven-tick combat',async({page},info)=>{
  test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await rendered(page);
  await frame(page,1000/60,7);
  await expect(page.getByTestId('combat-tick')).toHaveText('7');await expect(page.getByTestId('board-tick')).toHaveText('7');
  await expect(page.getByTestId('enemy-hull')).toHaveText('230.18');await expect(page.getByTestId('player-hull')).toHaveText('1193.7');
  await expect(page.getByTestId('player-equipped-words').locator('p')).toHaveCount(1);await expect(page.getByTestId('player-equipped-words')).toContainText('SHIP');
  await expect(page.getByTestId('enemy-equipped-words')).toHaveText('No equipped supported words.');
  const equipment=JSON.parse((await page.getByTestId('combat-scene').getAttribute('data-rendered-equipment'))!);
  expect(equipment.filter((t:{ship:string})=>t.ship==='player').map((t:{x:number;y:number;letter:string})=>[t.x,t.y,t.letter])).toEqual([[0,2,'S'],[1,2,'H'],[2,2,'I'],[3,2,'P']]);
  expect(Number(await page.getByTestId('combat-scene').getAttribute('data-draw-calls'))).toBeGreaterThan(10);
  await page.screenshot({path:info.outputPath('rendered-real-ship.png'),fullPage:true});expect(errors).toEqual([]);
});

test('Q14 minimum/reference layout aligns camera with well and keeps cells and harvest visible',async({page},info)=>{
  test.setTimeout(60000);await rendered(page);await page.keyboard.press('c');await frame(page);
  for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(80);await frame(page,0);
    const metrics=await page.evaluate(()=>{const rect=(s:string)=>document.querySelector(s)!.getBoundingClientRect();return {width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,camera:rect('[data-testid="combat-scene"]').bottom,well:rect('[data-testid="combat-board"]').bottom,harvest:rect('[data-testid="combat-harvest"]').bottom,cells:[...document.querySelectorAll('.pr-cell')].map(c=>c.getBoundingClientRect().width),footer:rect('.cb-render-footer').bottom};});
    expect(metrics.width).toBeLessThanOrEqual(viewport.width);expect(metrics.height).toBeLessThanOrEqual(viewport.height);expect(metrics.harvest).toBeLessThanOrEqual(viewport.height);expect(metrics.footer).toBeLessThanOrEqual(viewport.height);
    expect(Math.abs(metrics.camera-metrics.well)).toBeLessThan(1);expect(Math.max(...metrics.cells)-Math.min(...metrics.cells)).toBeLessThan(.1);
    await page.screenshot({path:info.outputPath('rendered-'+viewport.width+'.png'),fullPage:true});
  }
});

test('native WebGL context loss freezes both clocks and restoration requires explicit Resume',async({page},info)=>{
  test.setTimeout(60000);await rendered(page);await frame(page,1000/60,7);const tick=await page.getByTestId('combat-tick').innerText();
  await page.getByTestId('combat-canvas').evaluate(canvas=>{const gl=(canvas as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('Native context loss extension unavailable.');(window as unknown as {lostContext:WEBGL_lose_context}).lostContext=ext;ext.loseContext();});
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','context-lost');await frame(page,5000);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);await expect(page.getByTestId('resume-combat')).toBeDisabled();
  await page.screenshot({path:info.outputPath('context-lost.png'),fullPage:true});
  await page.evaluate(()=>(window as unknown as {lostContext:WEBGL_lose_context}).lostContext.restoreContext());
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready');await expect(page.getByTestId('resume-combat')).toBeEnabled();await frame(page,5000);await expect(page.getByTestId('combat-tick')).toHaveText(tick);
  await page.getByTestId('resume-combat').click();await frame(page,1000,4);await frame(page,0);await frame(page);
  expect(Number(await page.getByTestId('combat-tick').innerText())).toBeGreaterThan(Number(tick));await page.screenshot({path:info.outputPath('context-restored.png'),fullPage:true});
});

test('graphics decoding failure pauses the same Attempt and Retry restores graphics without a new Start',async({page},info)=>{
  test.setTimeout(60000);await page.addInitScript(()=>{const original=window.createImageBitmap.bind(window);(window as unknown as {graphicsHealthy:boolean}).graphicsHealthy=false;window.createImageBitmap=((...args:Parameters<typeof createImageBitmap>)=>(window as unknown as {graphicsHealthy:boolean}).graphicsHealthy?original(...args):Promise.reject(new Error('Injected graphics decode failure'))) as typeof createImageBitmap;});
  await launch(page);await expect(page.getByTestId('retry-graphics')).toBeVisible();await expect(page.getByTestId('graphics-status')).toContainText('Injected graphics');const attempt=await page.getByTestId('combat-attempt-id').innerText();await frame(page,5000);
  await expect(page.getByTestId('combat-tick')).toHaveText('0');await expect(page.getByTestId('resume-combat')).toBeDisabled();await page.screenshot({path:info.outputPath('graphics-failed.png'),fullPage:true});
  await page.evaluate(()=>(window as unknown as {graphicsHealthy:boolean}).graphicsHealthy=true);await page.getByTestId('retry-graphics').click();await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready');await expect(page.getByTestId('resume-combat')).toBeEnabled();await expect(page.getByTestId('combat-attempt-id')).toHaveText(attempt);await expect(page.getByTestId('combat-tick')).toHaveText('0');
});

test('old combat Runs keep their original HUD and pins while Q14 bodies use separate replaceable storage',async({page})=>{
  await installPreRunTestClock(page);await openSavedBuild(page,combatBuild(),combatPack());
  await expect(page.getByTestId('build-content-version')).toHaveText('development-combat-ship-v1');await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByRole('heading',{name:'Map combat',exact:true})).toBeVisible();await expect(page.getByTestId('combat-canvas')).toHaveCount(0);
  const cache=await page.evaluate(()=>({legacy:localStorage.getItem('crossdefense-content-pack:development-combat-ship-v1')!==null,rendered:localStorage.getItem('crossdefense-content-pack:development-rendered-combat-ship-v1'),active:JSON.parse(localStorage.getItem('crossdefense-content-pack-state')!).activeVersion}));
  expect(cache.legacy).toBe(true);expect(cache.rendered).toBeNull();expect(cache.active).toBe('development-review-ship-v1');
});

test('leaving rendered combat disposes owned GPU resources and removes the canvas without altering saved Build',async({page},info)=>{
  test.setTimeout(60000);await rendered(page);await frame(page,1000/60,7);const host=await page.getByTestId('combat-scene').elementHandle();
  await page.getByTestId('abandon-combat').click();await page.getByTestId('confirm-combat-abandon').click();await expect(page.getByTestId('return-combat-build')).toBeVisible();await page.getByTestId('return-combat-build').click();
  await expect(page.getByRole('heading',{name:'Build Phase',exact:true})).toBeVisible();await expect(page.getByTestId('combat-canvas')).toHaveCount(0);await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  const ownership=await host!.evaluate(node=>({state:(node as HTMLElement).dataset.rendererState,alive:(node as HTMLElement).dataset.ownedResources,released:Number((node as HTMLElement).dataset.disposedResources)}));
  expect(ownership.state).toBe('disposed');expect(ownership.alive).toBe('0');expect(ownership.released).toBeGreaterThan(20);
  await info.attach('renderer-disposal.json',{body:JSON.stringify(ownership,null,2),contentType:'application/json'});
});


test('rendered collection counts only acknowledgments, preserves Retry identity and survives reload',async({page},info)=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>{const add=IDBObjectStore.prototype.add;let fail=true;const writes:unknown[]=[];(window as unknown as {renderWrites:unknown[]}).renderWrites=writes;IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='combatOperations'){writes.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected renderer collection failure','UnknownError');}}return add.apply(this,args);};});
  await rendered(page);
  for(let piece=0;piece<60&&!await page.getByTestId('retry-combat').isVisible();piece++){
    for(const action of choosePlacement(await observedBoard(page)))await page.keyboard.press(controls[action]);await frame(page);await frame(page);
  }
  await expect(page.getByTestId('retry-combat')).toBeVisible();await expect(page.getByTestId('combat-collected')).toHaveText('0');
  const tick=await page.getByTestId('combat-tick').innerText();await frame(page,50,5);await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-render-tick',tick);
  await page.screenshot({path:info.outputPath('rendered-collection-failed.png'),fullPage:true});
  await page.getByTestId('retry-combat').click();await expect(page.getByTestId('retry-combat')).toBeHidden();await expect(page.getByTestId('resume-combat')).toBeHidden();
  // Retry is hidden while the write is pending; wait for the actual saved receipt.
  await expect(page.getByTestId('combat-receipt')).toContainText('Saved to Salvage:');
  const count=Number(await page.getByTestId('combat-collected').innerText());expect(count).toBeGreaterThan(0);expect(await page.getByTestId('combat-harvest').locator('[data-subtype]').count()).toBe(9);
  const writes=await page.evaluate(()=>(window as unknown as {renderWrites:unknown[]}).renderWrites);expect(writes).toHaveLength(2);expect(writes[1]).toEqual(writes[0]);
  await page.screenshot({path:info.outputPath('rendered-collection-saved.png'),fullPage:true});await page.reload();await continueSavedBuild(page);await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');await expect(page.getByTestId('build-collected-count')).toHaveText('8');await page.getByTestId('choose-map').click();await expect(page.getByTestId('launch-blockers')).toContainText('Resolve all Salvage');
});

test('late graphics decoding after leaving combat closes every produced bitmap and never remounts a canvas',async({page})=>{
  test.setTimeout(60000);
  await page.addInitScript(()=>{
    const original=window.createImageBitmap.bind(window),close=ImageBitmap.prototype.close,closed=new WeakSet<ImageBitmap>();
    const stats={created:0,closed:0,released:false,waiting:[] as Array<()=>void>};(window as unknown as {bitmapLifetime:typeof stats}).bitmapLifetime=stats;
    ImageBitmap.prototype.close=function(){if(!closed.has(this)){closed.add(this);stats.closed++;}return close.call(this);};
    window.createImageBitmap=(async(...args:Parameters<typeof createImageBitmap>)=>{const bitmap=await original(...args);stats.created++;if(!stats.released)await new Promise<void>(resolve=>stats.waiting.push(resolve));return bitmap;}) as typeof createImageBitmap;
  });
  await launch(page);await expect.poll(()=>page.evaluate(()=>(window as unknown as {bitmapLifetime:{created:number}}).bitmapLifetime.created)).toBeGreaterThan(0);
  await page.getByTestId('abandon-combat').click();await page.getByTestId('confirm-combat-abandon').click();await expect(page.getByTestId('return-combat-build')).toBeVisible();await page.getByTestId('return-combat-build').click();await expect(page.getByTestId('ship-grid')).toBeVisible();
  await page.evaluate(()=>{const state=(window as unknown as {bitmapLifetime:{released:boolean;waiting:Array<()=>void>}}).bitmapLifetime;state.released=true;for(const resolve of state.waiting)resolve();});
  await expect.poll(()=>page.evaluate(()=>{const state=(window as unknown as {bitmapLifetime:{closed:number;created:number}}).bitmapLifetime;return state.closed===state.created;})).toBe(true);
  await expect(page.getByTestId('combat-canvas')).toHaveCount(0);await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
});

test('native renderer frames record named GPU and CPU submission cost while pause freezes both games',async({page},info)=>{
  test.setTimeout(60000);await openSavedBuild(page,combatBuild(pack));await page.getByTestId('choose-map').click();await page.getByTestId('start-attempt').click();await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready',{timeout:20000});
  let initialPause:string|null=null;
  if(await page.getByTestId('resume-combat').isVisible()){initialPause=await page.getByTestId('combat-pause').innerText();await page.getByTestId('resume-combat').click();}
  await expect.poll(async()=>Number(await page.getByTestId('combat-tick').innerText()),{timeout:10000}).toBeGreaterThan(12);
  await page.waitForTimeout(1000);await page.getByTestId('pause-combat').click();const tick=await page.getByTestId('combat-tick').innerText();await page.waitForTimeout(250);await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);
  const metrics=await page.getByTestId('combat-scene').evaluate(node=>({userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],devicePixelRatio,renderer:JSON.parse((node as HTMLElement).dataset.diagnostics!)}));
  expect(metrics.renderer.samples).toBeGreaterThan(10);expect(metrics.renderer.drawCalls).toBeGreaterThan(10);expect(metrics.renderer.p95).toBeGreaterThanOrEqual(0);
  await info.attach('native-renderer-cost.json',{body:JSON.stringify({...metrics,initialPause,scope:'Observed CPU submission cost on this browser/device only; not a universal FPS or GPU-duration guarantee.'},null,2),contentType:'application/json'});
  await page.screenshot({path:info.outputPath('native-renderer-paused.png'),fullPage:true});
});

import {observedBoard} from '../preRunBrowserPlayer';
import {choosePlacement} from '../preRunPlayer';
const controls={cw:'x',ccw:'z',left:'ArrowLeft',right:'ArrowRight',drop:'Space',down:'ArrowDown',hold:'c'} as const;
test('the renderer observes the browser playing Scout then Boss with legal keyboard placement and saves victory without currency settlement',async({page},testInfo)=>{
  test.setTimeout(180000);
  // A reproducible victory workload, not a claim that every random sequence or playing policy wins.
  // Override only the injected ID/seed source in this disposable browser, never game state or content.
  await page.addInitScript(() => {
    let serial = 0;
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () =>
      '00000007-0000-4000-8000-' + (++serial).toString(16).padStart(12, '0') });
  });
  await rendered(page);let bossSeen=false;
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
    await frame(page,50,60);
    if(!bossSeen&&await page.getByTestId('combat-enemy-name').innerText()==='Boss'){bossSeen=true;await page.screenshot({path:testInfo.outputPath('boss-combat.png'),fullPage:true});}
  }
  } finally {
    await testInfo.attach('victory-inputs.json', { body: JSON.stringify(transcript, null, 2), contentType: 'application/json' });
  }
  const diagnostic=JSON.parse((await page.getByTestId('combat-scene').getAttribute('data-diagnostics'))!);expect(diagnostic.retiredCreated).toBe(diagnostic.retiredReleased);expect(diagnostic.retiredReleased).toBeGreaterThan(0);await testInfo.attach('fleet-reset-resources.json',{body:JSON.stringify(diagnostic,null,2),contentType:'application/json'});
  expect(bossSeen).toBe(true);await expect(page.getByTestId('combat-status')).toHaveText('Outcome saved: victory');await expect(page.getByTestId('combat-settlement')).toContainText('currency has not been granted');
  const tick=await page.getByTestId('combat-tick').innerText(),count=await page.getByTestId('combat-collected').innerText();expect(Number(count)).toBeGreaterThan(0);await frame(page,50,5);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('combat-collected')).toHaveText(count);
  await page.screenshot({path:testInfo.outputPath('victory-unsettled.png'),fullPage:true});
  await page.getByTestId('return-combat-build').click();await expect(page.getByTestId('ship-grid')).toBeVisible();await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await page.getByTestId('choose-map').click();await expect(page.getByTestId('launch-blockers')).toContainText('Resolve all Salvage');
});
