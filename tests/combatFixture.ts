import { readFileSync } from 'node:fs';
import type { ContentPackManifest, BuildContent } from '../src/domain/content/contentPack';
import type { CombatDefinition } from '../src/domain/combat/content';
import type { ActiveRun } from '../src/domain/run/run';
import { applyPlacement } from '../src/domain/build/shipBuild';
import { applyStartAttempt, type StartAttemptCommand } from '../src/domain/attempt/attempt';
import { finishedBuildRun } from './buildFixture';
export function combatPack(): ContentPackManifest & {build:BuildContent;combat:CombatDefinition} {
  return JSON.parse(readFileSync('public/content/packs/development-combat-ship-v1/manifest.json','utf8'));
}
export function combatBuild(pack:ContentPackManifest=combatPack()):ActiveRun {
  let run=finishedBuildRun('combat-run','combat-pilot',pack);
  for(let i=0;i<4;i++)run=applyPlacement(run,pack.build!,{operationId:'fixture-place-'+i,kind:'place',pilotId:run.pilotId,runId:run.runId,contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion,expectedRevision:i,tileId:run.runId+':starter:'+i,x:i,y:2});
  return run;
}
export function startCommand(run:ActiveRun):StartAttemptCommand {
  return {kind:'start-attempt',operationId:'combat-start',attemptId:'combat-attempt',pilotId:run.pilotId,runId:run.runId,mapId:'development-map-01',difficulty:'Normal',expectedBuildRevision:run.shipBuild?.revision??0,confirmNoOffense:false,seed:'combat-seed-7',appVersion:'0.1.0',startedAt:'2026-10-09T00:00:00Z',contentVersion:run.contentVersion,rulesetVersion:run.rulesetVersion};
}
export function startedCombat(pack=combatPack()):ActiveRun {const run=combatBuild(pack);return applyStartAttempt(run,pack,startCommand(run));}
