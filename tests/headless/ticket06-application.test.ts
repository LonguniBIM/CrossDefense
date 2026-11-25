import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';
import { finishedBuildRun } from '../buildFixture';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryAttemptRepository } from '../../src/infrastructure/persistence/InMemoryAttemptRepository';
import { BuildApplication } from '../../src/application/build/BuildApplication';
import { AttemptApplication } from '../../src/application/attempt/AttemptApplication';

async function setup(repository = new InMemoryAttemptRepository()) {
  const pack=JSON.parse(readFileSync('public/content/packs/development-attempt-ship-v1/manifest.json','utf8')) as ContentPackManifest;
  const run=finishedBuildRun('attempt-run','attempt-pilot',pack);
  await repository.createPilot({operationId:'pilot',pilot:{pilotId:run.pilotId,nickname:'Attempt test',avatarId:'pilot-blue',createdAt:run.startedAt,lastUsedAt:run.startedAt}});
  await repository.createRun({operationId:'run',run});
  const content=new ContentPackApplication(new InMemoryContentPackRepository(),{appVersion:'0.1.0',rulesetVersion:pack.compatibleRuleset});
  await content.bootstrap(); await content.activateCandidate(pack);
  const build=new BuildApplication(repository,content); await build.open(run.pilotId);
  for(let index=0;index<4;index++) await build.place({operationId:'place-'+index,tileId:run.runId+':starter:'+index,x:index,y:2});
  let id=0;
  const app=new AttemptApplication(repository,content,()=> 'generated-'+(++id),()=> '2026-10-07T00:02:00Z',build);
  const request={operationId:'launch',pilotId:run.pilotId,runId:run.runId,mapId:'development-map-01',difficulty:'Normal' as const,expectedBuildRevision:4,confirmNoOffense:false};
  return {app,build,repository,request,run,pack,content};
}
it('Start admission excludes same-turn Build writes and clears history only after successful commit', async()=>{
  const {app,build,repository,request}=await setup();
  expect((await app.selection(request.pilotId)).difficulty).toBe('Normal');
  expect(build.snapshot().history.canUndo).toBe(true);
  const started=app.start(request);
  await expect(build.returnToCargo({operationId:'racing-edit',tileId:request.runId+':starter:2'})).rejects.toMatchObject({code:'BUILD_TRANSITION'});
  const run=await started;
  expect(run.phase).toBe('attempt'); expect(build.snapshot().history.canUndo).toBe(false);
  const duplicate=await app.start(request); expect(duplicate).toEqual(run);
  expect((await repository.getRunningAttempts())).toHaveLength(1);
});

import type { StartAttemptCommand, EndAttemptCommand } from '../../src/domain/attempt/attempt';
class FailingStartRepository extends InMemoryAttemptRepository {
  readonly commands: StartAttemptCommand[]=[]; fail=true;
  constructor(readonly afterCommit=false){super();}
  override async startAttempt(command:StartAttemptCommand,pack:ContentPackManifest){
    this.commands.push(structuredClone(command));
    if(this.fail&&!this.afterCommit){this.fail=false;throw Error('Injected Start failure');}
    const result=await super.startAttempt(command,pack);
    if(this.fail){this.fail=false;throw Error('Injected lost Start acknowledgment');}
    return result;
  }
}
it('an unacknowledged Start cannot be bypassed by ending the Attempt before Retry',async()=>{
  const repo=new FailingStartRepository(true),{app,build,request}=await setup(repo);
  await expect(app.start(request)).rejects.toThrow('lost Start acknowledgment');
  const saved=await repo.getActiveRun(request.pilotId);
  expect(saved?.phase).toBe('attempt');expect(build.snapshot().history.canUndo).toBe(true);
  await expect(app.end({kind:'abandon-attempt',operationId:'premature-end',pilotId:request.pilotId,runId:request.runId,attemptId:saved!.attempt!.attemptId})).rejects.toMatchObject({code:'SAVE_PENDING'});
  const retried=await app.retryStart();expect(retried.attempt?.attemptId).toBe(saved?.attempt?.attemptId);
  expect(build.snapshot().history.canUndo).toBe(false);expect(repo.commands).toHaveLength(1);
});

it('failed Start retains seed, time, request and Build history; Retry commits once',async()=>{
  const repo=new FailingStartRepository(),{app,build,request,run}=await setup(repo),before=build.snapshot();
  await expect(app.start(request)).rejects.toThrow('Injected Start failure');
  expect(app.hasPendingSave()).toBe(true);expect(build.snapshot()).toEqual(before);
  expect((await repo.getActiveRun(run.pilotId))?.phase).toBe('build');
  await expect(build.place({operationId:'after-failure',tileId:run.runId+':starter:4',x:4,y:2})).rejects.toMatchObject({code:'BUILD_TRANSITION'});
  await expect(app.chooseDifficulty({operationId:'change',pilotId:run.pilotId,difficulty:'Hard'})).rejects.toMatchObject({code:'SAVE_PENDING'});
  const saved=await app.retryStart();expect(saved.phase).toBe('attempt');expect(repo.commands).toHaveLength(2);expect(repo.commands[1]).toEqual(repo.commands[0]);
  expect(build.snapshot().history.canUndo).toBe(false);expect(app.hasPendingSave()).toBe(false);
});
it('a queued Build edit blocks same-turn Start rather than snapshotting stale positions',async()=>{
  const {app,build,request}=await setup();
  const edit=build.returnToCargo({operationId:'queued',tileId:request.runId+':starter:1'});
  await expect(app.start(request)).rejects.toMatchObject({code:'BUILD_BUSY'});await edit;
  expect(build.isAttemptHeld()).toBe(false);expect((await app.selection(request.pilotId)).run.phase).toBe('build');
});
it('explicit Pilot difficulty persists independently and duplicate preference receipts cannot revert later choices',async()=>{
  const {app,repository,request,content}=await setup();
  await app.chooseDifficulty({operationId:'hard',pilotId:request.pilotId,difficulty:'Hard'});
  await app.chooseDifficulty({operationId:'easy',pilotId:request.pilotId,difficulty:'Easy'});
  await app.chooseDifficulty({operationId:'hard',pilotId:request.pilotId,difficulty:'Hard'});
  const reopened=new AttemptApplication(repository,content,()=> 'unused');
  expect((await reopened.selection(request.pilotId)).difficulty).toBe('Easy');
  await repository.createPilot({operationId:'pilot-b',pilot:{pilotId:'b',nickname:'Other',avatarId:'pilot-gold',createdAt:'2026-10-07',lastUsedAt:'2026-10-07'}});
  expect((await repository.getPilot('b'))?.lastDifficulty).toBeUndefined();
  await expect(app.chooseDifficulty({operationId:'hard',pilotId:request.pilotId,difficulty:'Insane'})).rejects.toMatchObject({code:'OPERATION_CONFLICT'});
});
it('startup recovery is content-independent and keeps the same retained tiles and layout',async()=>{
  const {app,request,repository,run,content}=await setup();const started=await app.start(request);
  const empty=new ContentPackApplication(new InMemoryContentPackRepository(),{appVersion:'0.1.0',rulesetVersion:'development-attempt-ruleset-v1'});await empty.bootstrap();
  const recovery=new AttemptApplication(repository,empty,()=> 'unused',()=> '2026-10-07T00:03:00Z');
  await recovery.recoverAtStartup();await recovery.recoverAtStartup();
  const saved=await repository.getActiveRun(run.pilotId);expect(saved?.attempt?.status).toBe('interrupted');expect(saved?.shipBuild).toEqual(started.shipBuild);expect(saved?.salvage).toEqual(started.salvage);expect(saved?.quota).toEqual(started.quota);
  const freshBuild=new BuildApplication(repository,content);await freshBuild.open(run.pilotId);expect(freshBuild.snapshot().history.canUndo).toBe(false);
});
class FailingEndRepository extends InMemoryAttemptRepository {
  readonly commands:EndAttemptCommand[]=[];fail=true;
  override async endAttempt(command:EndAttemptCommand){this.commands.push(structuredClone(command));if(this.fail){this.fail=false;throw Error('Injected recovery failure');}return super.endAttempt(command);}
}
it('failed recovery leaves the running envelope intact until the same operation is retried',async()=>{
  const repo=new FailingEndRepository(),{app,request,content}=await setup(repo);const started=await app.start(request);
  const recovery=new AttemptApplication(repo,content,()=> 'unused',()=> '2026-10-07T00:03:00Z');
  await expect(recovery.recoverAtStartup()).rejects.toThrow('Injected recovery failure');expect(await repo.getActiveRun(request.pilotId)).toEqual(started);
  await recovery.recoverAtStartup();expect(repo.commands).toHaveLength(2);expect(repo.commands[1]).toEqual(repo.commands[0]);
  expect((await repo.getActiveRun(request.pilotId))?.attempt?.status).toBe('interrupted');
});
it('concurrent Start operations create only one active Attempt and cannot edit an already running ship',async()=>{
  const {app,repository,request,content}=await setup();
  const second=new AttemptApplication(repository,content,()=> 'second',()=> '2026-10-07T00:02:00Z');
  const results=await Promise.allSettled([app.start(request),second.start({...request,operationId:'another'})]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await repository.getRunningAttempts()).toHaveLength(1);
});

it('CS06-04 a corrected backwards wall clock cannot prevent interrupted recovery',async()=>{
  const {app,repository,request,content}=await setup();const started=await app.start(request);
  const recovery=new AttemptApplication(repository,content,()=> 'unused',()=> '2026-10-06T23:50:00Z');
  await recovery.recoverAtStartup();
  const saved=await repository.getActiveRun(request.pilotId);
  expect(saved?.attempt?.status).toBe('interrupted');expect(saved?.attempt?.endedAt).toBe('2026-10-06T23:50:00Z');
  expect(saved?.shipBuild).toEqual(started.shipBuild);expect(saved?.salvage).toEqual(started.salvage);expect(saved?.quota).toEqual(started.quota);
});

it('CS06-05 replaying an acknowledged Start after ending returns current saved state, not a stale running projection',async()=>{
  const {app,repository,request}=await setup();const started=await app.start(request);
  const ended=await app.end({kind:'abandon-attempt',operationId:'end-then-replay',pilotId:request.pilotId,runId:request.runId,attemptId:started.attempt!.attemptId});
  expect(ended.phase).toBe('build');
  expect(await app.start(request)).toEqual(ended);
  expect(await repository.getRunningAttempts()).toHaveLength(0);
});
