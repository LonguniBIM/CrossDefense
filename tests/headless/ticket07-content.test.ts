import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileDevelopmentPack, validateContentPack } from '../../src/application/content/ContentPackCodec';
const source=()=>JSON.parse(readFileSync('content/authoring/development-combat-ship-v1.json','utf8'));
it('approved Q10-Q13 compiles a real combat pack with two encounters and 24 independent payload entries',async()=>{
  const pack=await compileDevelopmentPack(source(),async()=>{throw Error('No assets');});
  expect(pack.schemaVersion).toBe(4);
  expect(pack.launch?.capability).toBe('combat');
  expect(pack.combat!.encounters.map(e=>[e.name,e.hull,e.limitTicks])).toEqual([['Scout',240,2700],['Boss',480,4500]]);
  expect(pack.combat!.payloads).toHaveLength(24);
  expect(pack.build).toEqual(JSON.parse(readFileSync('content/authoring/development-build-ship-v1.json','utf8')).build);
  expect(pack.assetManifest).toEqual([]);
  expect((await validateContentPack(pack,{appVersion:'0.1.0',rulesetVersion:'development-combat-ruleset-v1'})).issues).toEqual([]);
});

import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
for(const mutation of ['missing-combat','old-schema','diagnostic-capability','wrong-ruleset','missing-boss','underpowered-enemy','duplicate-tile','invalid-coordinate','wrong-pool-size','auto-settlement'] as const)it('rejects '+mutation+' before activating content',async()=>{
  const input=source();
  if(mutation==='missing-combat')delete input.combat;
  if(mutation==='old-schema')input.schemaVersion=3;
  if(mutation==='diagnostic-capability')input.launch.capability='launch-recovery-only';
  if(mutation==='wrong-ruleset')input.compatibleRuleset='development-attempt-ruleset-v1';
  if(mutation==='missing-boss')input.combat.encounters[1].boss=false;
  if(mutation==='underpowered-enemy')input.combat.encounters[0].equipment=input.combat.encounters[0].equipment.filter((t:{subtype:string})=>t.subtype!=='Power');
  if(mutation==='duplicate-tile')input.combat.encounters[0].equipment[1].id=input.combat.encounters[0].equipment[0].id;
  if(mutation==='invalid-coordinate')input.combat.encounters[0].equipment[0].x=9;
  if(mutation==='wrong-pool-size')input.combat.payloads.pop();
  if(mutation==='auto-settlement')input.combat.rewards.settlement='automatic';
  await expect(compileDevelopmentPack(input,async()=>new Uint8Array())).rejects.toThrow();
});
it('real CLI reproduces the approved combat bytes and preserves all earlier artifacts',()=>{
  const temporary=mkdtempSync(path.join(tmpdir(),'crossdefense-q10-'));
  try{
    const output=path.join(temporary,'combat.json');
    execFileSync(process.execPath,['scripts/content/compile-development-pack.mjs','--source','content/authoring/development-combat-ship-v1.json','--assets-root','content/authoring','--out',output],{stdio:'pipe'});
    expect(readFileSync(output).equals(readFileSync('public/content/packs/development-combat-ship-v1/manifest.json'))).toBe(true);
  }finally{rmSync(temporary,{recursive:true,force:true});}
  for(const [file,hash] of [
    ['public/content/packs/development/manifest.json','99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe'],
    ['public/content/packs/development-build-ship-v1/manifest.json','d5e8541107f99c0facb95a9496fd664a14d440a5b7697af21b440e7ba0f7e7fc'],
    ['public/content/packs/development-attempt-ship-v1/manifest.json','7636819b01fc9ee0a729ec356909cac73a6ce092996954c1692e4cfeffe293a6'],
  ])expect(createHash('sha256').update(readFileSync(file!)).digest('hex')).toBe(hash);
});
