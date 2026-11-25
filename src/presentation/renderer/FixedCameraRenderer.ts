import * as THREE from 'three';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import type { CombatProjection } from '../../application/combat/CombatApplication';
import type { ShipState } from '../../domain/combat/battle';
import { isWeapon, weaponRule } from '../../domain/combat/rules';
import { RenderResources } from './RenderResources';
import { loadRenderAssets, type LoadedRenderAssets } from './RenderAssetLoader';
import { createArt } from './EquipmentArt';

const COLORS: Readonly<Record<string,string>> = {Ballistic:'#ffd16d',Missile:'#ff946d',Laser:'#61f0ea',Armor:'#a7d0f0',Shield:'#66c9ff',System:'#bda0ff',Engine:'#ffbf72',Power:'#8befe0',Support:'#fbaacb'};
type ModuleArt = ReturnType<ReturnType<typeof createArt>['module']>;
interface Fleet { root:THREE.Group; shield:THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>; scope:RenderResources; modules:Map<string,ModuleArt>; }
interface Callbacks { lost():void; restored():void; failed(error:unknown):void; }
const center = (id:string) => id==='player'?-4.1:4.1;
const facing = (id:string) => id==='player'?1:-1;
const point = (id:string,x=2,y=2,z=.32) => new THREE.Vector3(center(id)+(x-2)*.7,(2-y)*.7,z);
const impact = (id:string) => new THREE.Vector3(center(id)+facing(id)*1.9,0,.2);

/** Read-only fixed-camera view. No RAF, timers, application calls, game RNG or authoritative state. */
export class FixedCameraRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-10,10,4,-4,.1,100);
  private readonly gpu:THREE.WebGLRenderer;
  private readonly shared = new RenderResources();
  private readonly assetsScope = new RenderResources();
  private readonly controller = new AbortController();
  private observer:ResizeObserver|null=null;
  private readonly fleets = new Map<string,Fleet>();
  private readonly sprites:THREE.Sprite[]=[];
  private readonly lines:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>[]=[];
  private readonly plane!:THREE.PlaneGeometry;
  private readonly missiles:THREE.Group[]=[];
  private missileCount=0;
  private loaded:LoadedRenderAssets|null=null;
  private projection:CombatProjection|null=null;
  private used=0;
  private lineCount=0;
  private ended=false;
  private lost=false;
  private retiredCreated=0;
  private retiredReleased=0;
  private samples:number[]=[];
  readonly ready:Promise<void>;

  constructor(private readonly host:HTMLElement,pack:ContentPackManifest,callbacks:Callbacks) {
    this.gpu=new THREE.WebGLRenderer({antialias:true,alpha:false});
    try {
    this.gpu.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    this.gpu.outputColorSpace=THREE.SRGBColorSpace;
    this.gpu.toneMapping=THREE.ACESFilmicToneMapping;this.gpu.toneMappingExposure=1.1;
    this.gpu.domElement.setAttribute('aria-label','Fixed-camera ships with the saved letter equipment; effects follow actual combat events');
    this.gpu.domElement.dataset.testid='combat-canvas';
    host.prepend(this.gpu.domElement);host.dataset.rendererState='loading';
    this.camera.up.set(0,0,1);this.camera.position.set(0,-11,25);this.camera.lookAt(0,0,-.1);this.camera.updateMatrixWorld();
    createArt(this.shared).stage(this.scene);
    this.scene.add(new THREE.HemisphereLight(0xd9f3ff,0x203a53,2.7));
    const key=new THREE.DirectionalLight(0xf5fbff,3.1);key.position.set(-4,-6,12);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x58c9ff,2);rim.position.set(0,8,6);this.scene.add(rim);
    this.plane=this.shared.own(new THREE.PlaneGeometry(1,1));
    this.gpu.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();if(this.ended)return;this.lost=true;host.dataset.rendererState='context-lost';callbacks.lost();
    },{signal:this.controller.signal});
    this.gpu.domElement.addEventListener('webglcontextrestored',()=>{
      if(this.ended)return;this.lost=false;host.dataset.rendererState=this.loaded?'ready':'loading';callbacks.restored();
    },{signal:this.controller.signal});
    this.observer=new ResizeObserver(()=>{try{this.resize();}catch(error){callbacks.failed(error);}});this.observer.observe(host);
    this.resize();
    this.ready=loadRenderAssets(pack,this.assetsScope,this.controller.signal).then(assets=>{
      if(this.ended)throw new DOMException('Renderer disposed.','AbortError');
      this.loaded=assets;host.dataset.rendererState=this.lost?'context-lost':'ready';
    }).catch(error=>{if(!this.ended){host.dataset.rendererState='error';this.assetsScope.dispose();}throw error;});
    } catch(error) { this.dispose(); throw error; }
  }
  get available():boolean {return !!this.loaded&&!this.ended&&!this.lost;}
  private resize():void {
    if(this.ended||this.lost)return;
    const {width,height}=this.host.getBoundingClientRect();if(width<=0||height<=0)return;
    this.gpu.setSize(width,height,false);
    const aspect=width/height,halfHeight=Math.max(2.75,7.7/aspect);
    this.camera.left=-halfHeight*aspect;this.camera.right=halfHeight*aspect;this.camera.top=halfHeight;this.camera.bottom=-halfHeight;this.camera.updateProjectionMatrix();
    if(this.projection&&this.available)this.render(this.projection);
  }
  private removeFleet(id:string):void {
    const fleet=this.fleets.get(id);if(!fleet)return;
    this.scene.remove(fleet.root);fleet.scope.dispose();
    this.retiredCreated+=fleet.scope.created;this.retiredReleased+=fleet.scope.released;this.fleets.delete(id);
  }
  private fleet(ship:ShipState):Fleet {
    const existing=this.fleets.get(ship.id);if(existing)return existing;
    const scope=new RenderResources(),root=new THREE.Group();
    try {
    const art=createArt(scope);root.position.x=center(ship.id);this.scene.add(root);
    const source=this.loaded!.models.get(ship.id==='player'?'Striker':'Dispatcher');if(!source)throw new Error('Approved hull model is unavailable.');
    const hull=source.clone(true);hull.rotation.set(0,0,facing(ship.id)*Math.PI/2);hull.rotateX(Math.PI/2);hull.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(hull),size=bounds.getSize(new THREE.Vector3());
    hull.scale.setScalar(5.4/size.x);hull.updateMatrixWorld(true);bounds.setFromObject(hull);
    const midpoint=bounds.getCenter(new THREE.Vector3());hull.position.set(-midpoint.x,-midpoint.y,-.12-bounds.max.z);root.add(hull);
    const shield=art.shield(root,ship.id==='player'?'#60dbff':'#ff9b75');
    const modules=new Map<string,ModuleArt>();
    for(const tile of ship.modules)modules.set(tile.id,art.module(root,{id:tile.id,letter:tile.letter,type:tile.subtype,cell:tile.y*5+tile.x},COLORS[tile.subtype]!,facing(ship.id)));
    const result={root,shield,scope,modules};this.fleets.set(ship.id,result);return result;
    } catch(error) {
      this.scene.remove(root);scope.dispose();this.retiredCreated+=scope.created;this.retiredReleased+=scope.released;throw error;
    }
  }
  private particle(map:string,position:THREE.Vector3,size:number,color:string,opacity:number,rotation=0):void {
    if(this.used>=96||opacity<=0)return;
    const texture=this.loaded!.textures.get(map);if(!texture)return;
    let sprite=this.sprites[this.used++];
    if(!sprite){const material=this.shared.own(new THREE.SpriteMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}));sprite=new THREE.Sprite(material);this.scene.add(sprite);this.sprites.push(sprite);}
    if(sprite.material.map!==texture){sprite.material.map=texture;sprite.material.needsUpdate=true;}
    sprite.material.color.set(color);sprite.material.opacity=opacity;sprite.material.rotation=rotation;sprite.position.copy(position);sprite.scale.set(size,size,1);sprite.visible=true;
  }
  private beam(a:THREE.Vector3,b:THREE.Vector3,width:number,color:string):void {
    if(this.lineCount>=52)return;
    let mesh=this.lines[this.lineCount++];
    if(!mesh){const material=this.shared.own(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,blending:THREE.AdditiveBlending}));mesh=new THREE.Mesh(this.plane,material);this.lines.push(mesh);this.scene.add(mesh);}
    mesh.material.color.set(color);mesh.visible=true;mesh.position.copy(a).lerp(b,.5);mesh.scale.set(width,a.distanceTo(b),1);mesh.rotation.z=Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2;
  }
  private missile(position:THREE.Vector3,angle:number):void {
    if(this.missileCount>=16)return;
    let group=this.missiles[this.missileCount++];
    if(!group){
      group=new THREE.Group();
      const body=new THREE.Mesh(this.shared.own(new THREE.CylinderGeometry(.045,.045,.28,10)),this.shared.own(new THREE.MeshStandardMaterial({color:0xdce7ed,metalness:.4,roughness:.4})));body.rotation.z=-Math.PI/2;group.add(body);
      const nose=new THREE.Mesh(this.shared.own(new THREE.ConeGeometry(.048,.12,10)),this.shared.own(new THREE.MeshStandardMaterial({color:0xffad68})));nose.rotation.z=-Math.PI/2;nose.position.x=.2;group.add(nose);
      const fins=new THREE.Mesh(this.shared.own(new THREE.BoxGeometry(.08,.18,.02)),this.shared.own(new THREE.MeshStandardMaterial({color:0x6b889d})));fins.position.x=-.1;group.add(fins);
      this.scene.add(group);this.missiles.push(group);
    }
    group.visible=true;group.position.copy(position);group.rotation.z=angle;
  }
  render(view:CombatProjection):void {
    if(!this.available)return;
    const started=performance.now();this.projection=view;
    const battle=view.simulation.battle,tick=battle.tick,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ships=[battle.player,...(battle.enemy?[battle.enemy]:[])];
    for(const id of [...this.fleets.keys()])if(!ships.some(s=>s.id===id))this.removeFleet(id);
    this.used=0;this.lineCount=0;this.missileCount=0;
    for(const ship of ships){
      const fleet=this.fleet(ship);fleet.root.visible=ship.hull>0;
      const recent=view.recentEvents.filter(e=>e.event.kind==='hit'&&e.event.target===ship.id&&(e.event.shieldLoss??0)>0).at(-1);
      fleet.shield.visible=ship.shield>0;
      fleet.shield.material.uniforms.power!.value=ship.shield>0?.7:0;
      fleet.shield.material.uniforms.age!.value=recent?(tick-recent.tick)/60:10;
      fleet.shield.material.uniforms.hit!.value.set(-facing(ship.id),0,.25);
      for(const module of ship.modules){
        const art=fleet.modules.get(module.id)!;
        art.progress.visible=isWeapon(module.subtype)||module.subtype==='Support';
        const duration=isWeapon(module.subtype)?weaponRule(module.subtype).cycle:180;
        const due=isWeapon(module.subtype)?module.nextActivation:module.repairAt??tick+duration;
        const fraction=Math.min(1,Math.max(0,1-(due-tick)/duration));art.progress.scale.x=.54*Math.max(.02,fraction);art.progress.position.x=-.27+art.progress.scale.x/2;
        const fired=view.recentEvents.filter(e=>e.event.kind==='fire'&&e.event.source===ship.id&&e.event.moduleId===module.id).at(-1);
        const age=fired?tick-fired.tick:100;
        art.unit.position.x=.09-(reduced?0:facing(ship.id)*.09*Math.max(0,1-age/7));
        if(ship.hull<=0)continue;
        if(module.subtype==='Engine')this.particle('flame_01',point(ship.id,module.x,module.y,.25).add(new THREE.Vector3(-facing(ship.id)*.38,0,0)),reduced?.35:.4+Math.sin(tick*.25)*.025,'#8feaff',.7);
        const target=ships.find(s=>s.id===module.laserTarget&&s.hull>0);
        if(module.subtype==='Laser'&&module.laserStart!==null&&tick-module.laserStart<36&&target&&!battle.terminal){
          const a=point(ship.id,module.x,module.y),b=impact(target.id);this.beam(a,b,reduced?.08:.12,'#46e7e5');this.beam(a,b,.025,'#efffff');
          this.particle('flare_01',a,.4,'#80fff8',.7);this.particle('flare_01',b,.5,'#b4ffff',.7);
        }
      }
    }
    for(const observation of view.recentEvents){
      const event=observation.event,age=tick-observation.tick;
      if(age<0)continue;
      if(event.kind==='fire'&&event.weapon!=='Laser'&&event.x!==undefined&&event.y!==undefined){
        const a=point(event.source,event.x,event.y),b=impact(event.target);
        if(age<6)this.particle('muzzle_01',a,reduced?.25:.6,'#ffe0a0',1-age/6);
        if(event.due!==undefined&&tick<event.due&&ships.some(s=>s.id===event.target&&s.hull>0)){
          const fraction=age/(event.due-observation.tick),position=a.clone().lerp(b,fraction);
          if(event.weapon==='Missile')this.missile(position,Math.atan2(b.y-a.y,b.x-a.x));
          this.particle(event.weapon==='Missile'?'flame_01':'trace_01',position,event.weapon==='Missile'?.42:.3,event.weapon==='Missile'?'#ffb96c':'#fff0aa',1,Math.atan2(b.y-a.y,b.x-a.x));
          if(!reduced&&event.weapon==='Missile')for(let i=1;i<=3;i++)this.particle('smoke',a.clone().lerp(b,Math.max(0,fraction-i*.035)),.12+i*.035,'#b5c6d6',.2/i);
        }
      }
      if(event.kind==='hit'&&age<18&&((event.shieldLoss??0)+(event.hullLoss??0))>0){
        const shielded=(event.shieldLoss??0)>0,color=shielded?'#7be4ff':event.weapon==='Missile'?'#ffb46d':'#ffe3a0';
        this.particle('flare_01',impact(event.target),reduced?.32:event.weapon==='Missile'?1.1:.6,color,(1-age/18)*.7);
        if(!reduced)this.particle(shielded?'circle_03':'spark_05',impact(event.target),.3+age*.06,color,(1-age/18)*.45);
      }
      if((event.kind==='repair'||event.kind==='shield-regen')&&age<24)this.particle('circle_03',point(event.target,event.x??2,event.y??2),reduced?.5:1+age*.03,event.kind==='repair'?'#a9f6ba':'#80cfff',(1-age/24)*.45);
    }
    for(let i=this.used;i<this.sprites.length;i++)this.sprites[i]!.visible=false;
    for(let i=this.lineCount;i<this.lines.length;i++)this.lines[i]!.visible=false;
    for(let i=this.missileCount;i<this.missiles.length;i++)this.missiles[i]!.visible=false;
    this.gpu.render(this.scene,this.camera);
    const elapsed=performance.now()-started;this.samples.push(elapsed);if(this.samples.length>600)this.samples.shift();
    this.host.dataset.renderTick=String(tick);this.host.dataset.drawCalls=String(this.gpu.info.render.calls);this.host.dataset.triangles=String(this.gpu.info.render.triangles);
    this.host.dataset.renderMs=elapsed.toFixed(3);
    this.host.dataset.renderedEquipment=JSON.stringify(ships.flatMap(ship=>ship.modules.map(m=>{
      const object=this.fleets.get(ship.id)!.modules.get(m.id)!.group;let meshCount=0;
      object.traverse(child=>{if(child instanceof THREE.Mesh)meshCount++;});
      return {ship:ship.id,id:m.id,x:m.x,y:m.y,letter:m.letter,subtype:m.subtype,position:object.position.toArray(),meshCount};
    })));
    // Diagnostics describe actual allocated objects, not merely the source observations.
    this.host.dataset.renderedEffects=JSON.stringify({activeBeams:this.lines.filter(object=>object.visible).length,activeMissiles:this.missiles.filter(object=>object.visible).length,
      particles:this.sprites.filter(object=>object.visible).map(object=>[...this.loaded!.textures].find(([,texture])=>texture===object.material.map)?.[0]??'unknown')});
    this.host.dataset.observedEvents=JSON.stringify(view.recentEvents.map(e=>({id:e.id,tick:e.tick,kind:e.event.kind,weapon:e.event.weapon,shieldLoss:e.event.shieldLoss,hullLoss:e.event.hullLoss})));
  }
  diagnostics():Record<string,unknown> {
    const samples=[...this.samples].sort((a,b)=>a-b);
    const gl=this.gpu.getContext(),extension=gl.getExtension('WEBGL_debug_renderer_info');
    return {renderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),samples:samples.length,median:samples[Math.floor(samples.length*.5)]??0,p95:samples[Math.floor(samples.length*.95)]??0,drawCalls:this.gpu.info.render.calls,triangles:this.gpu.info.render.triangles,particles:this.sprites.length,beams:this.lines.length,owned:this.shared.alive+this.assetsScope.alive+[...this.fleets.values()].reduce((n,f)=>n+f.scope.alive,0),retiredCreated:this.retiredCreated,retiredReleased:this.retiredReleased};
  }
  dispose():void {
    if(this.ended)return;this.ended=true;this.controller.abort();this.observer?.disconnect();
    for(const id of [...this.fleets.keys()])this.removeFleet(id);
    this.shared.dispose();this.assetsScope.dispose();this.gpu.dispose();this.gpu.forceContextLoss();this.gpu.domElement.remove();this.scene.clear();this.projection=null;
    this.host.dataset.rendererState='disposed';
    this.host.dataset.disposedResources=String(this.shared.released+this.assetsScope.released+this.retiredReleased);
    this.host.dataset.ownedResources='0';
    this.host.dataset.createdResources=String(this.shared.created+this.assetsScope.created+this.retiredCreated);
  }
}
