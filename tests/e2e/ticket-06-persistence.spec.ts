import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { finishedBuildRun } from '../buildFixture';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';
const pack=JSON.parse(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json','utf8')) as ContentPackManifest;

for(const kind of ['start-attempt','interrupt-attempt','abandon-attempt','set-difficulty'] as const) test(kind+' is atomic with its receipt; failure and Retry preserve identity and Player Data',async({page})=>{
  await page.route('**/attempt-persistence-test',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated Attempt transaction</body></html>'}));
  await page.goto('/attempt-persistence-test');
  const result=await page.evaluate(async({pack,run,kind})=>{
    const load=(path:string)=>import(path);
    const {DexieWorkspaceRepository}=await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const {ContentPackApplication}=await load('/src/application/content/ContentPackApplication.ts');
    const {LocalStorageContentPackRepository}=await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const {BuildApplication}=await load('/src/application/build/BuildApplication.ts');
    const {AttemptApplication}=await load('/src/application/attempt/AttemptApplication.ts');
    const repo=new DexieWorkspaceRepository();await repo.initialize();
    await repo.createPilot({operationId:'pilot',pilot:{pilotId:run.pilotId,nickname:'Attempt persistence',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt}});
    await repo.createRun({operationId:'run',run});
    const content=new ContentPackApplication(new LocalStorageContentPackRepository(),{appVersion:'0.1.0',rulesetVersion:pack.compatibleRuleset});await content.bootstrap();await content.activateCandidate(pack);
    const build=new BuildApplication(repo,content);await build.open(run.pilotId);
    for(let index=0;index<4;index++)await build.place({operationId:'p'+index,tileId:run.runId+':starter:'+index,x:index,y:2});
    let id=0;const app=new AttemptApplication(repo,content,()=> 'generated-'+(++id),()=> '2026-10-07T01:00:00Z',build);
    const request={operationId:'start',pilotId:run.pilotId,runId:run.runId,mapId:'development-map-01',difficulty:'Normal',expectedBuildRevision:4,confirmNoOffense:false};
    if(kind==='interrupt-attempt'||kind==='abandon-attempt') await app.start(request);
    const before={run:await repo.getActiveRun(run.pilotId),pilot:await repo.getPilot(run.pilotId),build:build.snapshot()};
    const add=IDBObjectStore.prototype.add,attempts:unknown[]=[];let fail=true,error='',failure,pending=false;
    IDBObjectStore.prototype.add=function(...args:Parameters<typeof add>){
      if(this.name==='attemptOperations'&&(args[0] as {kind?:string}).kind===kind){attempts.push(structuredClone(args[0]));if(fail){fail=false;throw new DOMException('Injected Attempt receipt failure','UnknownError');}}
      return add.apply(this,args);
    };
    try {
      try {
        if(kind==='start-attempt')await app.start(request);
        else if(kind==='set-difficulty')await app.chooseDifficulty({operationId:'difficulty',pilotId:run.pilotId,difficulty:'Hard'});
        else await app.end({kind,operationId:'end',pilotId:run.pilotId,runId:run.runId,attemptId:before.run.attempt.attemptId});
      }catch(caught){error=String(caught);}
      pending=app.hasPendingSave();failure={run:await repo.getActiveRun(run.pilotId),pilot:await repo.getPilot(run.pilotId),build:build.snapshot()};
      if(kind==='start-attempt')await app.retryStart();else if(kind==='set-difficulty')await app.retryDifficulty();else await app.retryEnd();
    }finally{IDBObjectStore.prototype.add=add;}
    const fresh=new DexieWorkspaceRepository();await fresh.initialize();
    return {before,failure,error,pending,attempts,after:{run:await fresh.getActiveRun(run.pilotId),pilot:await fresh.getPilot(run.pilotId)},pendingAfter:app.hasPendingSave()};
  },{pack,run:finishedBuildRun('tx-run','tx-pilot',pack),kind});
  expect(result.error).toContain('Injected Attempt');expect(result.pending).toBe(true);expect(result.failure).toEqual(result.before);
  expect(result.attempts).toHaveLength(2);expect(result.attempts[1]).toEqual(result.attempts[0]);expect(result.pendingAfter).toBe(false);
  expect(result.after.run.shipBuild).toEqual(result.before.run.shipBuild);expect(result.after.run.salvage).toEqual(result.before.run.salvage);expect(result.after.run.quota).toEqual(result.before.run.quota);
  if(kind==='start-attempt')expect(result.after.run.attempt.status).toBe('running');
  else if(kind==='set-difficulty')expect(result.after.pilot.lastDifficulty).toBe('Hard');
  else expect(result.after.run.attempt.status).toBe(kind==='interrupt-attempt'?'interrupted':'abandoned');
});
