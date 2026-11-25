import type { BuildContent, ViabilityTile } from '../content/contentPack';
import { MODULE_SUBTYPES } from '../content/contentPack';
import { tilePower } from '../build/rules';
import { PLAYER_SHIP_ID } from './rules';

export interface EnemyEquipment extends ViabilityTile { id: string; x: number; y: number; }
export interface EncounterDefinition { id: string; name: string; boss: boolean; hull: number; limitTicks: number; equipment: EnemyEquipment[]; }
export interface CombatRewards {
  repeatable: { credits: number; celestium: number };
  firstClear: { credits: number; celestium: number };
  firstClearScope: 'pilot-map'; settlement: 'ticket09-only';
}
export interface CombatDefinition {
  mapId: string; playerHull: number; gapTicks: number;
  encounters: EncounterDefinition[]; payloads: ViabilityTile[]; rewards: CombatRewards;
}

/** Domain validation is also used for copied startup content, not just authoring JSON. */
export function assertCombatDefinition(value: CombatDefinition, build: BuildContent): void {
  const id=(v:unknown)=>typeof v==='string'&&/^[a-z0-9-]+$/.test(v);
  const amount=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0&&v<=max;
  const fail=()=>{throw Error('Combat content violates the versioned development Map contract.');};
  if (!value||!id(value.mapId)||!amount(value.playerHull,1000000)||!amount(value.gapTicks,3600)||value.encounters.length!==2||
      value.encounters[0]!.boss||!value.encounters[1]!.boss||value.payloads.length!==24) fail();
  const allIds=new Set<string>();
  for(const enemy of value.encounters) {
    if(enemy.id===PLAYER_SHIP_ID)throw Error('Enemy identity collides with the reserved player actor.');
    if(!id(enemy.id)||allIds.has(enemy.id)||!enemy.name.trim()||enemy.name.length>100||!amount(enemy.hull,1000000)||!amount(enemy.limitTicks,36000)||!enemy.equipment.length||enemy.equipment.length>13) fail();
    allIds.add(enemy.id); const cells=new Map<string,EnemyEquipment>(); let available=0,required=0;
    for(const tile of enemy.equipment) {
      if(!id(tile.id)||allIds.has(tile.id)||!/^[A-Z]$/.test(tile.letter)||!MODULE_SUBTYPES.includes(tile.subtype)||!Number.isInteger(tile.x)||!Number.isInteger(tile.y)||
          !build.hull.cells.some(c=>c.x===tile.x&&c.y===tile.y)||cells.has(tile.x+':'+tile.y)) fail();
      allIds.add(tile.id); cells.set(tile.x+':'+tile.y,tile);
      const power=tilePower(tile.subtype,100); available+=power.available; required+=power.required;
    }
    if(available<required) fail();
    for(const [dx,dy] of [[1,0],[0,1]] as const) for(const tile of enemy.equipment) {
      if(cells.has((tile.x-dx)+':'+(tile.y-dy))) continue;
      let x=tile.x,y=tile.y,word='';
      while(cells.has(x+':'+y)) {word+=cells.get(x+':'+y)!.letter;x+=dx;y+=dy;}
      if(build.supportedSpellings.some(w=>w.spelling===word)) fail();
    }
  }
  for(const tile of value.payloads) if(!/^[A-Z]$/.test(tile.letter)||!MODULE_SUBTYPES.includes(tile.subtype)) fail();
  const rewards=value.rewards;
  if(!rewards||rewards.firstClearScope!=='pilot-map'||rewards.settlement!=='ticket09-only') fail();
  for(const entry of [rewards.repeatable,rewards.firstClear]) for(const n of [entry.credits,entry.celestium]) if(!Number.isSafeInteger(n)||n<0||n>1000000) fail();
}
