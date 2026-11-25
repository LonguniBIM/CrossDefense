import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileDevelopmentPack, canonicalStringify, validateContentPack } from '../../src/application/content/ContentPackCodec';

const source = () => JSON.parse(readFileSync('content/authoring/development-attempt-ship-v1.json', 'utf8'));
it('Q9 compiles one explicit launch/recovery-only Map and inherits approved Build and starter without combat defaults', async () => {
  const authored = source();
  const original = JSON.parse(readFileSync('content/authoring/development-build-ship-v1.json', 'utf8'));
  const pack = await compileDevelopmentPack(authored, async () => { throw Error('No asset read is authorized.'); });
  expect(pack.schemaVersion).toBe(3);
  expect(pack.contentVersion).toBe('development-attempt-ship-v1');
  expect(pack.compatibleRuleset).toBe('development-attempt-ruleset-v1');
  expect(pack.build).toEqual(original.build); expect(pack.preRun).toEqual(original.preRun);
  expect(pack.assetManifest).toEqual([]);
  expect(pack.launch).toEqual({capability:'launch-recovery-only',maps:[{mapId:'development-map-01',name:'Map 1 - Development',initiallyAvailable:true}]});
  expect(pack.launch).not.toHaveProperty('encounters'); expect(pack.launch).not.toHaveProperty('rewards');
  const again = await compileDevelopmentPack(authored, async () => new Uint8Array());
  expect(canonicalStringify(again)).toBe(canonicalStringify(pack));
  expect((await validateContentPack(pack, {appVersion:'0.1.0',rulesetVersion:'development-attempt-ruleset-v1'})).issues).toEqual([]);
});

for (const mutation of ['missing-launch','fake-combat','two-maps','wrong-ruleset','old-schema-launch'] as const) it('rejects '+mutation+' without inventing a compatible Map',async()=>{
  const authored=source();
  if(mutation==='missing-launch')delete authored.launch;
  if(mutation==='fake-combat')authored.launch.encounters=[];
  if(mutation==='two-maps')authored.launch.maps.push({...authored.launch.maps[0],mapId:'unapproved-map'});
  if(mutation==='wrong-ruleset')authored.compatibleRuleset='development-build-ruleset-v1';
  if(mutation==='old-schema-launch')authored.schemaVersion=2;
  await expect(compileDevelopmentPack(authored,async()=>new Uint8Array())).rejects.toThrow();
});
it('actual new manifest validates and a tampered Map cannot pass integrity validation',async()=>{
  const artifact=JSON.parse(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json','utf8'));
  expect((await validateContentPack(artifact)).issues).toEqual([]);
  artifact.launch.maps[0].name='Tampered Map';
  expect((await validateContentPack(artifact)).issues.map(issue=>issue.code)).toContain('INTEGRITY_MISMATCH');
});
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { tmpdir } from 'node:os';
it('real CLI recompilation is byte-identical and old authored/runtime packs retain their exact hashes',()=>{
  const temporary=mkdtempSync(path.join(tmpdir(),'crossdefense-q9-'));
  try {
    const output=path.join(temporary,'manifest.json');
    execFileSync(process.execPath,['scripts/content/compile-development-pack.mjs','--source','content/authoring/development-attempt-ship-v1.json','--assets-root','content/authoring','--out',output],{stdio:'pipe'});
    expect(readFileSync(output).equals(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json'))).toBe(true);
    expect(()=>execFileSync(process.execPath,['scripts/content/compile-development-pack.mjs','--source','content/authoring/development-attempt-ship-v1.json','--assets-root','content/authoring','--out',output],{stdio:'pipe'})).toThrow();
  } finally {rmSync(temporary,{recursive:true,force:true});}
  for(const [file,digest] of [
    ['public/content/packs/development/manifest.json','99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe'],
    ['public/content/packs/development-build-ship-v1/manifest.json','d5e8541107f99c0facb95a9496fd664a14d440a5b7697af21b440e7ba0f7e7fc'],
  ]) expect(createHash('sha256').update(readFileSync(file!)).digest('hex')).toBe(digest);
});
import { createHash } from 'node:crypto';

import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
it('restoring a pinned pack cannot switch active/LKG or admit a different version or immutable-content collision',async()=>{
  const old=JSON.parse(readFileSync('public/content/packs/development-build-ship-v1/manifest.json','utf8'));
  const current=JSON.parse(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json','utf8'));
  const repository=new InMemoryContentPackRepository();
  const app=new ContentPackApplication(repository,{appVersion:'0.1.0',rulesetVersion:current.compatibleRuleset,supportedRulesetVersions:[old.compatibleRuleset,current.compatibleRuleset]});
  await app.bootstrap();await app.activateCandidate(old);await app.activateCandidate(current);const before=await app.bootstrap();
  repository.removePack(old.contentVersion);expect(await app.getPack(old.contentVersion,old.compatibleRuleset)).toBeNull();
  expect((await app.restorePinned(old,old.contentVersion,old.compatibleRuleset)).restored).toBe(true);
  expect(await app.bootstrap()).toEqual(before);expect((await app.getActivePack())?.contentVersion).toBe(current.contentVersion);
  expect((await app.restorePinned(current,old.contentVersion,current.compatibleRuleset)).issues[0]?.code).toBe('CONTENT_VERSION_MISMATCH');
  const changed=JSON.parse(readFileSync('content/authoring/development-build-ship-v1.json','utf8'));changed.build.supportedSpellings.push({spelling:'PIP',cefr:'Unknown'});
  const collision=await compileDevelopmentPack(changed,async()=>new Uint8Array());
  expect((await app.restorePinned(collision,old.contentVersion,old.compatibleRuleset)).issues[0]?.code).toBe('VERSION_CONTENT_CONFLICT');
  expect(await app.getPack(old.contentVersion,old.compatibleRuleset)).toEqual(old);expect(await app.bootstrap()).toEqual(before);
});
