import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileDevelopmentPack, validateContentPack } from '../../src/application/content/ContentPackCodec';
import { RENDER_ASSETS, RENDERED_CONTENT_VERSION } from '../../src/domain/content/renderAssets';
const source=()=>JSON.parse(readFileSync('content/authoring/development-rendered-combat-ship-v1.json','utf8'));
const asset=async(path:string)=>new Uint8Array(readFileSync('content/authoring/rendered-assets-v1/'+path));
it('Q14 inherits the exact approved gameplay and packages all fourteen audited assets deterministically',async()=>{
  const s=source(),old=JSON.parse(readFileSync('content/authoring/development-combat-ship-v1.json','utf8'));
  const {assets,contentVersion,...gameplay}=s;const {assets:oldAssets,contentVersion:oldVersion,...oldGameplay}=old;
  expect(gameplay).toEqual(oldGameplay);expect(contentVersion).toBe(RENDERED_CONTENT_VERSION);expect(oldAssets).toEqual([]);
  const a=await compileDevelopmentPack(s,asset),b=await compileDevelopmentPack(s,asset);
  expect(a).toEqual(b);expect(a.assetManifest).toHaveLength(14);
  for(const expected of RENDER_ASSETS)expect(a.assetManifest.find(e=>e.path===expected.path)).toMatchObject(expected);
  expect((await validateContentPack(a)).issues).toEqual([]);
},20000);
it('Q14 cannot compile an empty or incomplete asset set under the approved rendered content identity',async()=>{
  const s=source();s.assets=[];await expect(compileDevelopmentPack(s,asset)).rejects.toThrow(/Q14/);
});
it('Q14 rejects changed asset bytes even when a new manifest hash could be computed',async()=>{
  const s=source();await expect(compileDevelopmentPack(s,async path=>path.endsWith('Quaternius.txt')?new TextEncoder().encode('different license'):asset(path))).rejects.toThrow(/Q14/);
},20000);


import {mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
it('the actual CLI reproduces the rendered artifact byte-for-byte without changing older content',()=>{
  const oldPaths=['content/authoring/development-starter-ship-v1.json','content/authoring/development-build-ship-v1.json','content/authoring/development-attempt-ship-v1.json','content/authoring/development-combat-ship-v1.json','public/content/packs/development/manifest.json','public/content/packs/development-build-ship-v1/manifest.json','public/content/packs/development-attempt-ship-v1/manifest.json','public/content/packs/development-combat-ship-v1/manifest.json'];
  const digest=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
  const before=oldPaths.map(digest),dir=mkdtempSync(path.join(tmpdir(),'crossdefense-q14-cli-'));
  try{
    const out=path.join(dir,'manifest.json');
    execFileSync(process.execPath,['scripts/content/compile-development-pack.mjs','--source','content/authoring/development-rendered-combat-ship-v1.json','--assets-root','content/authoring/rendered-assets-v1','--out',out],{stdio:'pipe',timeout:20000});
    expect(readFileSync(out).equals(readFileSync('public/content/packs/development-rendered-combat-ship-v1/manifest.json'))).toBe(true);
    expect(oldPaths.map(digest)).toEqual(before);
  }finally{rmSync(dir,{recursive:true,force:true});}
},25000);
