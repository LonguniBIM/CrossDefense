import type { EquippedTile } from '../build/shipBuild';
import type { Difficulty } from '../attempt/rules';
import type { CombatDefinition } from './content';
import { PLAYER_SHIP_ID, RESOURCE_SCALE, MITIGATION_K, DIFFICULTY_FACTORS, isWeapon, weaponRule, threatFactor, scaleAmount, roundRatio, type WeaponKind } from './rules';

export type FailureCause='Hull destroyed'|'Top-out'|'Timeout';
export interface TerminalResult { kind:'victory'|'failed'; causes:FailureCause[]; }
export interface ModuleState extends EquippedTile {
  nextActivation:number; laserStart:number|null; laserTarget:string|null; laserTotal:number; repairAt:number|null;
}
export interface ShipState {
  id:string; hull:number; maxHull:number; shield:number; maxShield:number; armor:number; system:number; engine:number;
  shieldRegen:number; rechargeAt:number|null; lastDamageTick:number|null; modules:ModuleState[];
}
export interface Projectile { id:string; source:string; target:string; type:WeaponKind; amount:number; due:number; moduleId?:string; }
/** Observational metadata; never used to decide damage, RNG, clock or outcomes. */
export interface CombatEvent { kind:'fire'|'hit'|'shield-regen'|'repair'|'spawn'|'defeated'; source:string; target:string; amount:number; moduleId?:string; weapon?:WeaponKind; x?:number; y?:number; due?:number; shieldLoss?:number; hullLoss?:number; }
export interface BattleState {
  tick:number; definition:CombatDefinition; difficulty:Difficulty; player:ShipState; enemy:ShipState|null;
  encounterIndex:number; encounterStartedAt:number; nextEncounterAt:number|null;
  projectiles:Projectile[]; serial:number; terminal:TerminalResult|null; events:CombatEvent[];
}
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;

/** Resolved equipment is copied; module clocks are independent and passive modules have no fake cooldown. */
export function createCombatShip(id:string,hull:number,equipment:readonly EquippedTile[]):ShipState {
  if(!id||!Number.isSafeInteger(hull)||hull<=0||hull>1000000||equipment.length>13||new Set(equipment.map(t=>t.id)).size!==equipment.length||
     equipment.some(t=>!Number.isSafeInteger(t.multiplier)||t.multiplier<100||t.multiplier>260))throw Error('Invalid resolved combat ship.');
  const sum=(type:EquippedTile['subtype'],base:number)=>equipment.filter(m=>m.subtype===type).reduce((n,m)=>n+scaleAmount(base*RESOURCE_SCALE,m.multiplier),0);
  const shield=sum('Shield',25);
  return {id,hull:hull*RESOURCE_SCALE,maxHull:hull*RESOURCE_SCALE,shield,maxShield:shield,armor:sum('Armor',10),system:sum('System',10),engine:sum('Engine',10),
    shieldRegen:sum('Shield',2),rechargeAt:null,lastDamageTick:null,modules:[...equipment].sort((a,b)=>compare(a.id,b.id)).map(tile=>({...tile,nextActivation:0,laserStart:null,laserTarget:null,laserTotal:0,repairAt:null}))};
}
export function createBattle(definition:CombatDefinition,equipment:readonly EquippedTile[],difficulty:Difficulty):BattleState {
  const state:BattleState={tick:0,definition:structuredClone(definition),difficulty,player:createCombatShip(PLAYER_SHIP_ID,definition.playerHull,equipment),enemy:null,
    encounterIndex:0,encounterStartedAt:0,nextEncounterAt:null,projectiles:[],serial:0,terminal:null,events:[]};
  spawnEnemy(state,0);state.events=[];return state;
}
function spawnEnemy(state:BattleState,tick:number):void {
  const definition=state.definition.encounters[state.encounterIndex];if(!definition)throw Error('Encounter definition is missing.');
  if(definition.id===PLAYER_SHIP_ID)throw Error('Enemy identity collides with the reserved player actor.');
  const enemy=createCombatShip(definition.id,definition.hull,definition.equipment.map(tile=>({...tile,multiplier:100})));
  enemy.hull=enemy.maxHull=scaleAmount(enemy.maxHull,DIFFICULTY_FACTORS[state.difficulty].hull);
  state.enemy=enemy;state.encounterStartedAt=tick;state.nextEncounterAt=null;
  state.events.push({kind:'spawn',source:enemy.id,target:enemy.id,amount:enemy.hull});
}

/** Resource losses round once at the Shield/Hull boundary, with exact intermediate mitigation. */
export function applyCombatHit(ship:ShipState,amount:number,type:WeaponKind,tick:number):{shield:number;hull:number} {
  if(!Number.isSafeInteger(amount)||amount<0||[ship.hull,ship.shield,ship.armor,ship.system,ship.engine].some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Invalid damage inputs.');
  const k=BigInt(MITIGATION_K);
  let numerator=BigInt(amount)*k,denominator=k+BigInt(ship.engine);
  if(type==='Missile'){numerator*=k;denominator*=k+BigInt(ship.system);}
  let shieldLoss=0,hullLoss=0;
  if(ship.shield>0) {
    const boostN=type==='Laser'?3n:1n,boostD=type==='Laser'?2n:1n;
    shieldLoss=Math.min(ship.shield,roundRatio(numerator*boostN,denominator*boostD));
    ship.shield-=shieldLoss;
    numerator=numerator*boostN-BigInt(shieldLoss)*denominator*boostD;denominator*=boostN;
  }
  if(numerator>0n) {
    const armorN=type==='Missile'?75n:100n;
    hullLoss=Math.min(ship.hull,roundRatio(numerator*k*100n,denominator*(k*100n+BigInt(ship.armor)*armorN)));
    ship.hull-=hullLoss;
  }
  if(shieldLoss>0||hullLoss>0){ship.rechargeAt=ship.maxShield>0?tick+180:null;ship.lastDamageTick=tick;}
  return {shield:shieldLoss,hull:hullLoss};
}
function attacks(state:BattleState,source:ShipState,target:ShipState|null,tick:number,locks:number,hits:Projectile[]):void {
  for(const module of source.modules) {
    if(!isWeapon(module.subtype))continue;
    const rule=weaponRule(module.subtype);
    if(tick>=module.nextActivation&&target&&target.hull>0) {
      module.nextActivation=tick+rule.cycle;
      const amount=scaleAmount(rule.damage,module.multiplier,source.id===PLAYER_SHIP_ID?100:DIFFICULTY_FACTORS[state.difficulty].damage,source.id===PLAYER_SHIP_ID?100:threatFactor(locks));
      state.events.push({kind:'fire',source:source.id,target:target.id,amount,moduleId:module.id,weapon:module.subtype,x:module.x,y:module.y,due:tick+rule.flight});
      if(module.subtype==='Laser'){module.laserStart=tick;module.laserTarget=target.id;module.laserTotal=amount;}
      else state.projectiles.push({id:source.id+':'+module.id+':'+state.serial++,source:source.id,target:target.id,type:module.subtype,amount,due:tick+rule.flight,moduleId:module.id});
    }
    if(module.subtype==='Laser'&&module.laserStart!==null) {
      const index=tick-module.laserStart;
      if(index>=rule.active||!target||target.id!==module.laserTarget||target.hull<=0){module.laserStart=null;module.laserTarget=null;continue;}
      const total=BigInt(module.laserTotal),count=BigInt(rule.active);
      const amount=Number(total*BigInt(index+1)/count-total*BigInt(index)/count);
      hits.push({id:source.id+':'+module.id+':laser:'+tick,source:source.id,target:target.id,type:'Laser',amount,due:tick,moduleId:module.id});
    }
  }
}
function regenerate(state:BattleState,ship:ShipState,tick:number):void {
  if(ship.hull<=0)return;
  if(ship.shield>=ship.maxShield)ship.rechargeAt=null;
  else if(ship.rechargeAt!==null&&tick>=ship.rechargeAt) {
    const amount=Math.min(ship.maxShield-ship.shield,ship.shieldRegen);ship.shield+=amount;
    ship.rechargeAt=ship.shield>=ship.maxShield?null:tick+60;
    if(amount)state.events.push({kind:'shield-regen',source:ship.id,target:ship.id,amount});
  }
  for(const module of ship.modules) {
    if(module.subtype!=='Support')continue;
    if(ship.hull===ship.maxHull){module.repairAt=null;continue;}
    if(module.repairAt===null)module.repairAt=tick+180;
    if(tick>=module.repairAt) {
      const amount=Math.min(ship.maxHull-ship.hull,scaleAmount(3*RESOURCE_SCALE,module.multiplier));
      ship.hull+=amount;module.repairAt=tick+180;
      state.events.push({kind:'repair',source:ship.id,target:ship.id,amount,moduleId:module.id,x:module.x,y:module.y});
    }
  }
  if(ship.hull===ship.maxHull)for(const module of ship.modules)if(module.subtype==='Support')module.repairAt=null;
}

/** One shared-clock tick: gather both sides' attacks, resolve due hits, terminal, then recovery. */
export function stepBattle(snapshot:BattleState,locks:number,topOut=false):BattleState {
  if(snapshot.terminal)return structuredClone(snapshot);
  const state=structuredClone(snapshot),tick=++state.tick;state.events=[];
  if(state.nextEncounterAt!==null&&tick>=state.nextEncounterAt){state.encounterIndex++;spawnEnemy(state,tick);}
  const hits:Projectile[]=[];
  const enemy=state.enemy;
  if(state.player.hull>0)attacks(state,state.player,enemy,tick,locks,hits);
  if(enemy&&enemy.hull>0)attacks(state,enemy,state.player,tick,locks,hits);
  hits.push(...state.projectiles.filter(shot=>shot.due<=tick));
  state.projectiles=state.projectiles.filter(shot=>shot.due>tick);
  const aliveAtStart=new Map([state.player,enemy].filter((ship):ship is ShipState=>!!ship&&ship.hull>0).map(ship=>[ship.id,ship]));
  for(const hit of hits.sort((a,b)=>a.due-b.due||compare(a.id,b.id))) {
    const target=aliveAtStart.get(hit.target);if(!target)continue;
    const lost=applyCombatHit(target,hit.amount,hit.type,tick);
    if(lost.shield+lost.hull)state.events.push({kind:'hit',source:hit.source,target:hit.target,amount:lost.shield+lost.hull,weapon:hit.type,...(hit.moduleId?{moduleId:hit.moduleId}:{}),shieldLoss:lost.shield,hullLoss:lost.hull});
  }
  const expired=!!enemy&&tick-state.encounterStartedAt>=state.definition.encounters[state.encounterIndex]!.limitTicks;
  const causes:FailureCause[]=[];
  if(state.player.hull<=0)causes.push('Hull destroyed');if(topOut)causes.push('Top-out');if(expired)causes.push('Timeout');
  if(causes.length)state.terminal={kind:'failed',causes};
  else if(enemy&&enemy.hull<=0) {
    state.events.push({kind:'defeated',source:'player',target:enemy.id,amount:0});
    if(state.definition.encounters[state.encounterIndex]!.boss)state.terminal={kind:'victory',causes:[]};
    else {state.enemy=null;state.nextEncounterAt=tick+state.definition.gapTicks;}
  }
  if(!state.terminal){regenerate(state,state.player,tick);if(state.enemy)regenerate(state,state.enemy,tick);}
  return state;
}
