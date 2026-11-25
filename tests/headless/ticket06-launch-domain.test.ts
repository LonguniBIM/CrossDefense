import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';
import { finishedBuildRun } from '../buildFixture';
import { applyPlacement } from '../../src/domain/build/shipBuild';
import { applyStartAttempt, applyEndAttempt, type StartAttemptCommand } from '../../src/domain/attempt/attempt';

const pack = JSON.parse(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json','utf8')) as ContentPackManifest;
it('launch freezes canonical startup inputs and recovery preserves the exact Build without rewards', () => {
  let run = finishedBuildRun('launch-run','launch-pilot',pack);
  for (let index=0; index<4; index++) run=applyPlacement(run,pack.build!,{operationId:'place-'+index,kind:'place',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedRevision:index,tileId:run.runId+':starter:'+index,x:index,y:2});
  const before=structuredClone(run);
  const command: StartAttemptCommand={kind:'start-attempt',operationId:'start-1',attemptId:'attempt-1',pilotId:run.pilotId,runId:run.runId,mapId:'development-map-01',difficulty:'Normal',expectedBuildRevision:4,confirmNoOffense:false,seed:'seed-1',appVersion:'0.1.0',startedAt:'2026-10-07T00:00:00Z',contentVersion:pack.contentVersion,rulesetVersion:pack.compatibleRuleset};
  const running=applyStartAttempt(run,pack,command);
  expect(running.phase).toBe('attempt'); expect(running.attempt?.status).toBe('running');
  expect(running.attempt?.startup.placements).toEqual(before.shipBuild?.placements);
  expect(running.attempt?.startup.retainedTiles).toHaveLength(8);
  expect(running.attempt?.startup.capability).toBe('launch-recovery-only');
  expect(running.attempt?.startup).not.toHaveProperty('enemyHP');
  const recovered=applyEndAttempt(running,{kind:'interrupt-attempt',operationId:'recover-1',attemptId:'attempt-1',runId:run.runId,pilotId:run.pilotId,endedAt:'2026-10-07T00:01:00Z'});
  expect(recovered.phase).toBe('build'); expect(recovered.attempt?.status).toBe('interrupted');
  expect(recovered.shipBuild).toEqual(before.shipBuild); expect(recovered.salvage).toEqual(before.salvage); expect(recovered.quota).toEqual(before.quota);
  expect(run).toEqual(before);
});

function prepared(indices: number[] = [0,1,2,3]) {
  let run=finishedBuildRun('domain-run','domain-pilot',pack);
  for(const index of indices) run=applyPlacement(run,pack.build!,{operationId:'p'+index,kind:'place',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedRevision:run.shipBuild?.revision??0,tileId:run.runId+':starter:'+index,x:index,y:2});
  const command:StartAttemptCommand={kind:'start-attempt',operationId:'start',attemptId:'attempt',pilotId:run.pilotId,runId:run.runId,mapId:'development-map-01',difficulty:'Normal',expectedBuildRevision:run.shipBuild?.revision??0,confirmNoOffense:false,seed:'seed',appVersion:'0.1.0',startedAt:'2026-10-07T00:00:00Z',contentVersion:pack.contentVersion,rulesetVersion:pack.compatibleRuleset};
  return {run,command};
}
it('Power and unresolved Salvage block even confirmed starts, while unsupported SHI can launch',()=>{
  const low=prepared([0]);expect(()=>applyStartAttempt(low.run,pack,{...low.command,confirmNoOffense:true})).toThrow(/Power/);
  const unresolved=prepared();unresolved.run.salvageBuffer=[{id:'pending-tile',letter:'Q',subtype:'Armor'}];
  expect(()=>applyStartAttempt(unresolved.run,pack,{...unresolved.command,confirmNoOffense:true})).toThrow(/Salvage/);
  const unsupported=prepared([0,1,2]);expect(applyStartAttempt(unsupported.run,pack,unsupported.command).phase).toBe('attempt');
});
it('no offense is an explicit advisory, not a word or empty-layout hard blocker',()=>{
  const {run,command}=prepared([]);expect(()=>applyStartAttempt(run,pack,command)).toThrow(/Start anyway/);
  const started=applyStartAttempt(run,pack,{...command,confirmNoOffense:true});expect(started.attempt?.startup.placements).toEqual([]);
});
for(const [field,value] of [['pilotId','foreign'],['runId','foreign'],['mapId','unknown-map'],['difficulty','Extreme'],['expectedBuildRevision',0],['confirmNoOffense','yes'],['rulesetVersion','other']] as const) it('rejects mismatched or invalid '+field+' without mutating the saved Run',()=>{
  const {run,command}=prepared(),before=structuredClone(run);
  expect(()=>applyStartAttempt(run,pack,{...command,[field]:value} as StartAttemptCommand)).toThrow();expect(run).toEqual(before);
});
it('old Build content cannot acquire the new Map by being paired with a newer pack',()=>{
  const oldPack=JSON.parse(readFileSync('public/content/packs/development-build-ship-v1/manifest.json','utf8')) as ContentPackManifest;
  const old=finishedBuildRun('old','old-pilot',oldPack),{command}=prepared();
  expect(()=>applyStartAttempt(old,pack,{...command,pilotId:old.pilotId,runId:old.runId,contentVersion:old.contentVersion,rulesetVersion:old.rulesetVersion,expectedBuildRevision:0,confirmNoOffense:true})).toThrow();
});
it('running Attempts reject layout edits and ending the wrong Attempt',()=>{
  const {run,command}=prepared(),started=applyStartAttempt(run,pack,command);
  expect(()=>applyPlacement(started,pack.build!,{operationId:'late',kind:'place',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedRevision:4,tileId:run.runId+':starter:0',x:4,y:2})).toThrow();
  expect(()=>applyEndAttempt(started,{kind:'interrupt-attempt',operationId:'wrong',pilotId:run.pilotId,runId:run.runId,attemptId:'other',endedAt:'2026-10-07T00:01:00Z'})).toThrow();
  expect(started.attempt?.status).toBe('running');
});
