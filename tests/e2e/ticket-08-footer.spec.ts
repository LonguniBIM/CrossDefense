import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { combatBuild } from '../combatFixture';
import { openSavedBuild } from '../buildBrowserFixture';
import { installPreRunTestClock, observedBoard } from '../preRunBrowserPlayer';
import { choosePlacement } from '../preRunPlayer';
const pack = JSON.parse(readFileSync('public/content/packs/development-rendered-combat-ship-v1/manifest.json', 'utf8'));
const controls = {cw:'x',ccw:'z',left:'ArrowLeft',right:'ArrowRight',drop:'Space',down:'ArrowDown',hold:'c'} as const;
async function frame(page:Page, ms=0):Promise<void> {
  await page.evaluate(async ms => (window as unknown as {__buildTestFrame:(ms:number)=>Promise<void>}).__buildTestFrame(ms), ms);
}
async function inspectFooter(page:Page, info:TestInfo, label:string):Promise<void> {
  for (const viewport of [{width:1280,height:720},{width:1366,height:768}]) {
    await page.setViewportSize(viewport); await frame(page); await page.waitForTimeout(100);
    const measure = () => page.evaluate(() => {
      const hud=document.querySelector<HTMLElement>('.cb-hud')!, footer=document.querySelector<HTMLElement>('.cb-render-footer')!;
      const rect=(selector:string)=>document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      const nodes=[...footer.querySelectorAll<HTMLElement>('p,button')].filter(node=>!node.hidden&&node.getClientRects().length>0);
      return {width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,hudBottom:hud.getBoundingClientRect().bottom,
        footerBottom:footer.getBoundingClientRect().bottom,cameraBottom:rect('[data-testid="combat-scene"]').bottom,wellBottom:rect('[data-testid="combat-board"]').bottom,harvestBottom:rect('[data-testid="combat-harvest"]').bottom,
        receiptHeight:document.querySelector<HTMLElement>('[data-testid="combat-receipt"]')!.clientHeight,
        nodes:nodes.map(node=>({id:node.dataset.testid??node.className,bottom:node.getBoundingClientRect().bottom,height:node.getBoundingClientRect().height}))};
    });
    const metrics=await measure();
    await info.attach(label+'-'+viewport.width+'.json',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});
    await page.screenshot({path:info.outputPath(label+'-'+viewport.width+'.png'),fullPage:true});
    expect(metrics.receiptHeight,'The acknowledgment must never collapse out of view').toBeGreaterThanOrEqual(14);
    expect(metrics.nodes.every(node=>node.height>0&&node.bottom<=metrics.footerBottom+1),'Visible footer text/actions must fit without clipping').toBe(true);
    expect(metrics.footerBottom).toBeLessThanOrEqual(metrics.hudBottom);
    expect(metrics.docWidth).toBeLessThanOrEqual(metrics.width+1); expect(metrics.docHeight).toBeLessThanOrEqual(metrics.height+1);
    expect(Math.abs(metrics.cameraBottom-metrics.wellBottom)).toBeLessThan(1);
    expect(metrics.harvestBottom).toBeLessThanOrEqual(metrics.height);
  }
}
for (const fault of ['decode','context','storage','combined'] as const) test('CS08-02 '+fault+' recovery retains visible footer, acknowledgment and aligned no-scroll layout', async ({page},info) => {
  test.setTimeout(120000);
  await page.setViewportSize({width:1280,height:720});
  if(fault==='decode') await page.addInitScript(()=>{window.createImageBitmap=(()=>Promise.reject(new Error('Injected graphics decode failure'))) as typeof createImageBitmap;});
  if(fault==='storage'||fault==='combined') await page.addInitScript(()=>{
    const add=IDBObjectStore.prototype.add;let fail=true;
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){if(this.name==='combatOperations'&&fail){fail=false;throw new DOMException('Injected renderer collection failure','UnknownError');}return add.apply(this,args);};
  });
  await installPreRunTestClock(page); await openSavedBuild(page,combatBuild(pack));
  await page.getByTestId('choose-map').click(); await page.getByTestId('start-attempt').click();
  if(fault==='decode') await expect(page.getByTestId('retry-graphics')).toBeVisible();
  else {
    await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','ready',{timeout:20000});await frame(page);
    if(fault==='storage'||fault==='combined') {
      for(let piece=0;piece<60&&!await page.getByTestId('retry-combat').isVisible();piece++){
        for(const action of choosePlacement(await observedBoard(page))) await page.keyboard.press(controls[action]);
        await frame(page,1000/60); await frame(page,1000/60);
      }
      await expect(page.getByTestId('retry-combat')).toBeVisible();
      await expect(page.getByTestId('combat-collected')).toHaveText('0');
    }
    if(fault==='context'||fault==='combined') {
      await page.getByTestId('combat-canvas').evaluate(canvas=>{
        const gl=(canvas as HTMLCanvasElement).getContext('webgl2')!, extension=gl.getExtension('WEBGL_lose_context');
        if(!extension) throw Error('Native context loss is unavailable.'); extension.loseContext();
      });
      await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state','context-lost');
    }
  }
  const tick=await page.getByTestId('combat-tick').innerText(),attempt=await page.getByTestId('combat-attempt-id').innerText();
  await inspectFooter(page,info,fault);
  await frame(page,5000);await expect(page.getByTestId('combat-tick')).toHaveText(tick);await expect(page.getByTestId('board-tick')).toHaveText(tick);
  await expect(page.getByTestId('combat-attempt-id')).toHaveText(attempt);
});
