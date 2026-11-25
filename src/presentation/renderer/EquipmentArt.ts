import * as THREE from 'three';
import { RenderResources } from './RenderResources';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Adapted from the user-accepted visual study only; all allocations have an explicit owner.
// No prototype imports, simulation rules, clocks, RNG or durable state.
export function createArt(resources: RenderResources) {
  const box=resources.own(new THREE.BoxGeometry(1,1,1)),plane=resources.own(new THREE.PlaneGeometry(1,1));
  const cylinder=resources.own(new THREE.CylinderGeometry(1,1,1,20)),cone=resources.own(new THREE.ConeGeometry(1,1,20));
  const sphere=resources.own(new THREE.SphereGeometry(1,24,16)),ring=resources.own(new THREE.TorusGeometry(1,.1,6,32));
  const crystal=resources.own(new THREE.OctahedronGeometry(1));
  const shape=new THREE.Shape();shape.moveTo(-.25,-.29);shape.lineTo(.25,-.29);shape.lineTo(.29,-.25);shape.lineTo(.29,.25);shape.lineTo(.25,.29);shape.lineTo(-.25,.29);shape.lineTo(-.29,.25);shape.lineTo(-.29,-.25);shape.closePath();
  const plate=resources.own(new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:1,steps:1}));
  const metal=(color:THREE.ColorRepresentation)=>resources.own(new THREE.MeshStandardMaterial({color,metalness:.4,roughness:.46}));
  const steel=metal('#627d91'),dark=metal('#203447'),ceramic=metal('#bfd0dc');
  const black=resources.own(new THREE.MeshStandardMaterial({color:'#07121c',metalness:.25,roughness:.65}));
  const titanium=resources.own(new THREE.MeshStandardMaterial({color:'#acc4d6',metalness:.65,roughness:.32}));
  const glass=resources.own(new THREE.MeshPhysicalMaterial({color:'#568fb8',metalness:.25,roughness:.15,clearcoat:1,clearcoatRoughness:.15,transparent:true,opacity:.67}));
  const screen=resources.own(new THREE.MeshBasicMaterial({color:'#0d344b',toneMapped:false}));
  const shell=new THREE.Shape();shell.moveTo(-.40,-.5);shell.lineTo(.40,-.5);shell.lineTo(.5,-.40);shell.lineTo(.5,.40);shell.lineTo(.40,.5);shell.lineTo(-.40,.5);shell.lineTo(-.5,.40);shell.lineTo(-.5,-.40);shell.closePath();
  const housing=resources.own(new THREE.ExtrudeGeometry(shell,{depth:.90,bevelEnabled:true,bevelThickness:.05,bevelSize:.035,bevelSegments:1,steps:1}));housing.translate(0,0,-.45);
  // The mounting plate texture adds readable seams and fasteners without extra draws.
  const panelCanvas=document.createElement('canvas');panelCanvas.width=256;panelCanvas.height=256;const panel=panelCanvas.getContext('2d')!;panel.fillStyle='#8296a6';panel.fillRect(0,0,256,256);panel.fillStyle='#4d6577';panel.fillRect(8,8,240,8);panel.fillRect(8,8,8,240);panel.fillStyle='#bacbd5';panel.fillRect(8,240,240,4);panel.fillRect(240,8,4,236);panel.strokeStyle='#536d80';panel.lineWidth=4;panel.strokeRect(35,35,186,186);for(const x of [22,234])for(const y of [22,234]){panel.fillStyle='#253b4d';panel.beginPath();panel.arc(x,y,9,0,Math.PI*2);panel.fill();panel.fillStyle='#c5d2dc';panel.fillRect(x-5,y-2,10,4);}for(let i=0;i<4;i++){panel.fillStyle=i%2?'#233f51':'#cfb27a';panel.fillRect(177+i*12,214,10,12);}
  const panelTexture=resources.own(new THREE.CanvasTexture(panelCanvas));panelTexture.colorSpace=THREE.SRGBColorSpace;panelTexture.anisotropy=4;
  const deckMaterial=resources.own(new THREE.MeshStandardMaterial({map:panelTexture,metalness:.35,roughness:.62}));
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const shadow=shadowCanvas.getContext('2d')!,gradient=shadow.createRadialGradient(64,64,14,64,64,62);gradient.addColorStop(0,'#000000b8');gradient.addColorStop(1,'#00000000');shadow.fillStyle=gradient;shadow.fillRect(0,0,128,128);
  const contactMaterial=resources.own(new THREE.MeshBasicMaterial({map:resources.own(new THREE.CanvasTexture(shadowCanvas)),transparent:true,depthWrite:false,toneMapped:false}));
  const glow=(color:THREE.ColorRepresentation)=>resources.own(new THREE.MeshBasicMaterial({color,toneMapped:false}));
  function mesh(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,pos:[number,number,number],scale:[number,number,number]){const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
  function badge(text:string,color:string){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.scale(2,2);ctx.fillStyle='#092337';ctx.beginPath();ctx.roundRect(3,3,122,122,15);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='#ffffff';ctx.font='bold 94px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,67);const texture=resources.own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;const material=resources.own(new THREE.MeshBasicMaterial({map:texture,transparent:true,toneMapped:false,depthWrite:false}));const m=new THREE.Mesh(plane,material);m.scale.set(.29,.29,1);m.userData.ownedLabel=true;return m;}
  // Static mechanical details share materials and are merged before animation.
  function batchUnit(unit:THREE.Group){
    const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
    for(const child of [...unit.children]){if(!(child instanceof THREE.Mesh)||Array.isArray(child.material))continue;child.updateMatrix();const geometry=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geometry.applyMatrix4(child.matrix);if(!buckets.has(child.material))buckets.set(child.material,[]);buckets.get(child.material)!.push(geometry);unit.remove(child);}
    for(const [material,geometries]of buckets){const merged=mergeGeometries(geometries);for(const geometry of geometries)geometry.dispose();if(!merged)throw new Error('Equipment geometry could not be merged');resources.own(merged);const object=new THREE.Mesh(merged,material);object.userData.ownedGeometry=true;unit.add(object);}
  }
  function module(parent:THREE.Object3D,m:{id:string;cell:number;type:string;letter:string},color:string,direction:number){
    const group=new THREE.Group();group.position.set((m.cell%5-2)*.7,(2-Math.floor(m.cell/5))*.7,-.02);parent.add(group);
    const accent=glow(color);
    const body=mesh(group,plate,steel,[0,0,0],[1,1,1]);
    mesh(group,box,dark,[0,0,-.11],[.61,.61,.22]);
    mesh(group,plane,deckMaterial,[0,0,.111],[.54,.54,1]);
    mesh(group,plane,contactMaterial,[.09,.09,.114],[.48,.37,1]);
    mesh(group,box,accent,[0,-.292,.07],[.43,.017,.027]);
    const unit=new THREE.Group();unit.position.set(.09,.09,.13);group.add(unit);
    const part=(g:THREE.BufferGeometry,material:THREE.Material,pos:[number,number,number],scale:[number,number,number])=>mesh(unit,g,material,pos,scale);
    const casing=(material:THREE.Material,pos:[number,number,number],scale:[number,number,number])=>part(housing,material,pos,scale);
    const disc=(material:THREE.Material,pos:[number,number,number],radius:number,height:number)=>{const object=part(cylinder,material,pos,[radius,height,radius]);object.rotation.x=Math.PI/2;return object;};
    const tube=(material:THREE.Material,pos:[number,number,number],radius:number,length:number)=>{const object=part(cylinder,material,pos,[radius,length,radius]);object.rotation.z=-direction*Math.PI/2;return object;};
    const hoop=(material:THREE.Material,pos:[number,number,number],radius:number,vertical=false)=>{const object=part(ring,material,pos,[radius,radius,radius]);if(vertical)object.rotation.y=Math.PI/2;return object;};
    const vent=(x:number,y:number,z:number,width=.10)=>part(box,black,[x,y,z],[width,.019,.009]);
    const bolt=(x:number,y:number,z:number)=>disc(titanium,[x,y,z],.011,.01);
    if(m.type==='Ballistic'){
      disc(black,[0,.015,.025],.17,.055);disc(titanium,[0,.015,.055],.145,.035);
      casing(dark,[-direction*.025,.015,.105],[.24,.26,.13]);
      casing(ceramic,[-direction*.045,.015,.155],[.16,.23,.055]);
      for(const y of [-.067,.097]){
        tube(black,[direction*.145,y,.105],.042,.30);
        tube(titanium,[direction*.16,y,.105],.049,.09);
        tube(steel,[direction*.27,y,.105],.057,.055);
        tube(black,[direction*.30,y,.105],.032,.012);
        hoop(titanium,[direction*.303,y,.105],.041,true);
      }
      for(const y of [-.06,0,.06])vent(-direction*.055,y,.186,.08);
      casing(accent,[-direction*.105,.10,.188],[.025,.065,.012]);
      bolt(-.10,-.09,.185);bolt(.02,.12,.185);
    }
    if(m.type==='Missile'){
      casing(black,[0,.02,.04],[.36,.34,.08]);
      casing(steel,[-direction*.05,.02,.08],[.25,.32,.10]);
      for(const y of [-.085,.025,.135]){
        tube(black,[direction*.035,y,.105],.052,.30);
        tube(ceramic,[direction*.05,y,.12],.035,.24);
        tube(dark,[direction*.16,y,.12],.041,.028);
        const nose=part(cone,accent,[direction*.21,y,.12],[.035,.07,.035]);nose.rotation.z=-direction*Math.PI/2;
      }
      for(const y of [-.15,.20])casing(titanium,[-direction*.01,y,.05],[.36,.025,.14]);
      for(const y of [-.075,.025,.125])part(box,accent,[-direction*.18,y,.10],[.018,.034,.035]);
    }
    if(m.type==='Laser'){
      disc(black,[0,.015,.025],.175,.05);disc(steel,[0,.015,.065],.155,.07);
      hoop(titanium,[0,.015,.11],.14);
      const core=part(crystal,accent,[0,.015,.14],[.085,.085,.14]);core.rotation.z=Math.PI/4;
      for(const y of [-.08,.11])casing(dark,[direction*.09,y,.105],[.25,.045,.07]);
      tube(titanium,[direction*.19,.015,.12],.062,.19);
      tube(black,[direction*.30,.015,.12],.045,.055);
      tube(accent,[direction*.332,.015,.12],.025,.009);
      for(const x of [-.09,0,.09]){casing(titanium,[x,-.12,.05],[.025,.07,.08]);}
    }
    if(m.type==='Armor'){
      casing(black,[0,.025,.035],[.38,.31,.075]);
      for(let i=0;i<3;i++){
        const panel=casing(i===1?ceramic:steel,[0,(i-1)*.10+.025,.085],[.36,.088,.075]);panel.rotation.y=.13;
        part(box,titanium,[0,(i-1)*.10+.018,.126],[.29,.012,.012]);
        bolt(-.14,(i-1)*.10+.035,.137);bolt(.14,(i-1)*.10+.035,.137);
      }
      for(const x of [-.14,.14])part(box,accent,[x,-.14,.06],[.035,.025,.02]);
    }
    if(m.type==='Shield'){
      disc(black,[0,.02,.025],.18,.05);disc(steel,[0,.02,.06],.16,.06);
      hoop(titanium,[0,.02,.105],.155);disc(dark,[0,.02,.10],.12,.025);
      const lens=part(sphere,glass,[0,.02,.115],[.10,.10,.065]);
      disc(accent,[0,.02,.105],.075,.013);
      for(let i=0;i<4;i++){const angle=i*Math.PI/2,x=Math.cos(angle)*.15,y=.02+Math.sin(angle)*.15;const clamp=casing(ceramic,[x,y,.115],[.07,.055,.05]);clamp.rotation.z=angle;bolt(x,y,.15);}
      hoop(accent,[0,.02,.14],.106);
    }
    if(m.type==='System'){
      casing(black,[0,.025,.04],[.36,.31,.08]);casing(steel,[0,.025,.095],[.30,.25,.075]);
      part(box,black,[-.015,.035,.14],[.19,.17,.025]);
      part(box,screen,[-.015,.035,.157],[.15,.135,.009]);
      for(let i=0;i<3;i++)part(box,accent,[-.053+i*.04,.03,.164],[.014,.055+i*.02,.006]);
      for(const y of [-.07,-.035,0,.035,.07])part(box,titanium,[.16,y+.025,.09],[.042,.016,.015]);
      for(const x of [-.105,-.065,-.025,.015,.055])part(box,black,[x,-.12,.12],[.022,.025,.016]);
      bolt(-.125,.125,.14);bolt(.115,.125,.14);
    }
    if(m.type==='Engine'){
      tube(black,[0,.025,.085],.13,.31);tube(steel,[direction*.06,.025,.085],.125,.18);
      for(const x of [-.10,-.03,.04,.11])hoop(titanium,[x,.025,.085],.132,true);
      tube(black,[-direction*.18,.025,.085],.096,.045);
      hoop(titanium,[-direction*.205,.025,.085],.108,true);
      tube(accent,[-direction*.205,.025,.085],.062,.008);
      for(const y of [-.095,.145])casing(dark,[.04,y,.045],[.30,.037,.065]);
      part(box,ceramic,[.07,.025,.218],[.16,.055,.025]);
      for(const x of [.02,.07,.12])vent(x,.025,.234,.022);
    }
    if(m.type==='Power'){
      casing(black,[0,.02,.025],[.38,.32,.05]);
      for(const y of [-.06,.105]){
        tube(steel,[0,y,.085],.065,.27);tube(black,[-.15,y,.085],.075,.035);tube(titanium,[.15,y,.085],.075,.035);
        part(box,accent,[.01,y,.151],[.19,.027,.009]);
        for(const x of [-.10,.10])hoop(ceramic,[x,y,.085],.070,true);
      }
      casing(dark,[0,.024,.07],[.09,.08,.10]);part(box,accent,[0,.024,.125],[.035,.035,.01]);
    }
    if(m.type==='Support'){
      casing(black,[0,.025,.025],[.35,.31,.05]);casing(ceramic,[0,.025,.08],[.32,.28,.085]);
      casing(dark,[0,.025,.128],[.24,.22,.015]);
      part(box,accent,[0,.025,.141],[.17,.048,.009]);part(box,accent,[0,.025,.142],[.048,.15,.009]);
      for(const x of [-.15,.15]){casing(titanium,[x,.025,.095],[.035,.19,.045]);bolt(x,-.045,.127);bolt(x,.095,.127);}
      for(const x of [-.085,0,.085])vent(x,-.14,.06,.042);
      part(box,accent,[.105,.13,.136],[.028,.025,.01]);
    }
    batchUnit(unit);
    const letter=badge(m.letter,color);letter.position.set(-.13,-.13,.12);group.add(letter);
    const progress=mesh(group,box,accent,[0,-.325,.04],[.54,.018,.018]);
    group.traverse(o=>{o.userData.module=m.id;if(o instanceof THREE.Mesh&&o.material===accent)o.userData.ownedMaterial=true;});
    resources.track(group);return{group,unit,progress,body};
  }
  function shield(parent:THREE.Object3D,color:string){const material=resources.own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,uniforms:{color:{value:new THREE.Color(color)},power:{value:0},hit:{value:new THREE.Vector3(1,0,0)},age:{value:10}},vertexShader:`varying vec3 normalView; varying vec3 eye; varying vec3 local; void main(){local=position;vec4 p=modelViewMatrix*vec4(position,1.0);normalView=normalize(normalMatrix*normal);eye=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform vec3 color; uniform float power; uniform vec3 hit; uniform float age; varying vec3 normalView; varying vec3 eye; varying vec3 local; void main(){float rim=pow(1.0-abs(dot(normalize(normalView),normalize(eye))),3.0);float distance=length(normalize(local)-normalize(hit));float wave=exp(-pow((distance-age*2.5)*12.0,2.0))*max(0.0,1.0-age);float grid=pow(abs(sin(local.x*30.0)*sin(local.y*30.0)*sin(local.z*30.0)),12.0);float alpha=rim*.36+wave*.7+grid*.12*max(0.0,1.0-age);gl_FragColor=vec4(color*(1.0+wave),alpha*power);}`}));
    const shell=mesh(parent,sphere,material,[0,0,-.23],[3,1.95,.9]);shell.userData.ownedMaterial=true;resources.track(shell);return shell as THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>;}
  function stage(scene:THREE.Scene){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d')!;const gradient=ctx.createLinearGradient(0,0,1024,512);gradient.addColorStop(0,'#18364e');gradient.addColorStop(.5,'#10283e');gradient.addColorStop(1,'#203342');ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);for(const [x,y,c] of [[220,280,'#287ba332'],[880,180,'#9b583426']] as const){const g=ctx.createRadialGradient(x,y,0,x,y,370);g.addColorStop(0,c);g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);}const background=resources.own(new THREE.CanvasTexture(canvas));background.colorSpace=THREE.SRGBColorSpace;scene.background=background;
    const dots=[];for(let i=0;i<450;i++)dots.push(Math.sin(i*127.1)*24,Math.cos(i*311.7)*12,-3.5-(i%3));const stars=resources.own(new THREE.BufferGeometry());stars.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));scene.add(new THREE.Points(stars,resources.own(new THREE.PointsMaterial({color:'#b5def5',size:.025,transparent:true,opacity:.65,toneMapped:false}))));
    const lines=[];for(let i=-20;i<=20;i+=2){lines.push(i,-12,-3.6,i,12,-3.6,-24,i,-3.6,24,i,-3.6);}const grid=resources.own(new THREE.BufferGeometry());grid.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));scene.add(new THREE.LineSegments(grid,resources.own(new THREE.LineBasicMaterial({color:'#5995b2',transparent:true,opacity:.07}))));
    for(const [x,color] of [[-4.1,'#47cfee'],[4.1,'#f39369']] as const){const orbit=new THREE.Mesh(resources.own(new THREE.RingGeometry(3.18,3.20,96)),resources.own(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false})));orbit.position.set(x,0,-2.4);orbit.scale.y=.72;scene.add(orbit);}resources.track(scene);resources.own(background);
  }
  for(const resource of [box,plane,cylinder,cone,sphere,ring,crystal,plate,housing,steel,dark,ceramic,black,titanium,glass,screen,deckMaterial,contactMaterial,panelTexture,contactMaterial.map!])resources.own(resource);
  return{box,plane,cylinder,cone,sphere,steel,dark,ceramic,glow,mesh,module,shield,stage};
}
