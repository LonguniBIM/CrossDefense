import {test,expect} from '@playwright/test';
import {startedCombat} from '../combatFixture';

test('AR08-01 a failed letter badge construction releases the partial fleet and all owned resources',async({page})=>{
  test.setTimeout(60000);await page.route('**/renderer-owner-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body><p>Isolated renderer lifetime fixture, not a saved Run.</p><div id="scene" style="width:1000px;height:550px"></div></body></html>'}));await page.goto('/renderer-owner-fixture');
  const result=await page.evaluate(async run=>{
    const load=(path:string)=>import(path);
    const {RenderResources}=await load('/src/presentation/renderer/RenderResources.ts');
    const {FixedCameraRenderer}=await load('/src/presentation/renderer/FixedCameraRenderer.ts');
    const {createCombatSimulation}=await load('/src/domain/combat/simulation.ts');
    const pack=await(await fetch('/content/packs/development-rendered-combat-ship-v1/manifest.json')).json();
    const owners=new Set<{alive:number;created:number;released:number}>(),own=RenderResources.prototype.own;
    RenderResources.prototype.own=function(value:{dispose():void}){owners.add(this);return own.call(this,value);};
    const fillText=CanvasRenderingContext2D.prototype.fillText;
    const renderer=new FixedCameraRenderer(document.getElementById('scene'),pack,{lost(){},restored(){},failed(){}});
    let error='';
    try{
      await renderer.ready;
      CanvasRenderingContext2D.prototype.fillText=function(text:string,x:number,y:number,maxWidth?:number){if(text==='S')throw Error('Injected badge construction failure');return maxWidth===undefined?fillText.call(this,text,x,y):fillText.call(this,text,x,y,maxWidth);};
      try{renderer.render({run,simulation:createCombatSimulation(run),recentEvents:[],collected:[],lastCollected:[],outcome:null,status:'playing',pauseReason:null,resumeRemaining:null,error:null});}catch(caught){error=String(caught);}
    }finally{CanvasRenderingContext2D.prototype.fillText=fillText;renderer.dispose();RenderResources.prototype.own=own;}
    return {error,alive:[...owners].reduce((n,scope)=>n+scope.alive,0),created:[...owners].reduce((n,scope)=>n+scope.created,0),released:[...owners].reduce((n,scope)=>n+scope.released,0),canvas:document.querySelectorAll('canvas').length};
  },startedCombat());
  expect(result.error).toContain('Injected badge construction failure');expect(result.alive).toBe(0);expect(result.created).toBe(result.released);expect(result.canvas).toBe(0);
});

test('CS08-01 actual mounted transforms and typed effect pools cover all nine subtype geometries',async({page},info)=>{
  test.setTimeout(60000);await page.route('**/renderer-nine-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body><p>All-nine-subtype presentation fixture only. No production save or rewards.</p><div id="scene" style="width:1100px;height:580px"></div></body></html>'}));await page.goto('/renderer-nine-fixture');
  const result=await page.evaluate(async run=>{
    const load=(path:string)=>import(path);const {FixedCameraRenderer}=await load('/src/presentation/renderer/FixedCameraRenderer.ts');const {createCombatSimulation}=await load('/src/domain/combat/simulation.ts');const {createCombatShip,stepBattle}=await load('/src/domain/combat/battle.ts');
    const pack=await(await fetch('/content/packs/development-rendered-combat-ship-v1/manifest.json')).json(),host=document.getElementById('scene')!;
    const renderer=new FixedCameraRenderer(host,pack,{lost(){},restored(){},failed(){}});await renderer.ready;
    const simulation=createCombatSimulation(run),subtypes=['Ballistic','Missile','Laser','Armor','Shield','System','Engine','Power','Support'];
    const equipment=subtypes.map((subtype,index)=>({id:'fixture-'+subtype,letter:'S',subtype,x:pack.build.hull.cells[index].x,y:pack.build.hull.cells[index].y,multiplier:100}));
    simulation.battle.player=createCombatShip('player',1200,equipment);const recent:Array<{id:string;tick:number;event:unknown}>=[];
    const view={run,simulation,recentEvents:recent,collected:[],lastCollected:[],outcome:null,status:'playing',pauseReason:null,resumeRemaining:null,error:null};
    simulation.battle=stepBattle(simulation.battle,0);recent.push(...simulation.battle.events.map((event:unknown,index:number)=>({id:'1:'+index,tick:1,event})));renderer.render(view);
    const mounted=JSON.parse(host.dataset.renderedEquipment!),first=JSON.parse(host.dataset.renderedEffects??'null');
    for(let i=1;i<37;i++){simulation.battle=stepBattle(simulation.battle,0);recent.push(...simulation.battle.events.map((event:unknown,index:number)=>({id:simulation.battle.tick+':'+index,tick:simulation.battle.tick,event})));}
    renderer.render(view);const recovery=JSON.parse(host.dataset.renderedEffects??'null');
    simulation.battle.projectiles.push({id:'fixture-injury',source:'fixture-boundary',target:'player',type:'Ballistic',amount:3000000,due:38});
    for(let i=0;i<182;i++){simulation.battle=stepBattle(simulation.battle,0);recent.splice(0,recent.length,...recent.filter(e=>simulation.battle.tick-e.tick<60));recent.push(...simulation.battle.events.map((event:unknown,index:number)=>({id:simulation.battle.tick+':'+index,tick:simulation.battle.tick,event})));}
    renderer.render(view);const repair=JSON.parse(host.dataset.renderedEffects??'null');
    const report={equipment,mounted,first,recovery,repair,repairObserved:recent.some(e=>(e.event as {kind:string}).kind==='repair'),diagnostics:renderer.diagnostics()};
    (window as unknown as {disposeFixture:()=>void}).disposeFixture=()=>renderer.dispose();return report;
  },startedCombat());
  const player=result.mounted.filter((m:{ship:string})=>m.ship==='player');expect(player).toHaveLength(9);
  for(const expected of result.equipment){const actual=player.find((m:{id:string})=>m.id===expected.id);expect(actual.position).toEqual([(expected.x-2)*.7,(2-expected.y)*.7,-.02]);expect(actual.meshCount).toBeGreaterThan(3);}
  expect(result.first.activeMissiles).toBeGreaterThan(0);expect(result.first.activeBeams).toBe(2);expect(result.first.particles).toContain('muzzle_01');expect(result.recovery.activeBeams).toBe(0);expect(result.repairObserved).toBe(true);expect(result.repair.particles).toContain('circle_03');
  await info.attach('all-nine-renderer-observation.json',{body:JSON.stringify(result,null,2),contentType:'application/json'});await page.screenshot({path:info.outputPath('all-nine-fixture.png'),fullPage:true});await page.evaluate(()=>(window as unknown as {disposeFixture:()=>void}).disposeFixture());
});
