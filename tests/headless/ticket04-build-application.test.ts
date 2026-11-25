import { expect, it } from 'vitest';
import { buildPack, finishedBuildRun } from '../buildFixture';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { BuildApplication } from '../../src/application/build/BuildApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryRunRepository } from '../../src/infrastructure/persistence/InMemoryRunRepository';

it('uses public preview and placement, retains only committed summaries and reloads the same layout', async () => {
  const pack = buildPack(), run = finishedBuildRun();
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository();
  await repository.createRun({ operationId: 'fixture-start', run });
  const app = new BuildApplication(repository, content);
  expect((await app.open(run.pilotId)).kind).toBe('ready');
  expect(app.preview({ tileId: run.runId + ':starter:0', x: 0, y: 2 }).valid).toBe(true);
  expect(app.snapshot().summary.equipped).toHaveLength(0);
  const input = { operationId: 'place-s', tileId: run.runId + ':starter:0', x: 0, y: 2 };
  const [first, duplicate] = await Promise.all([app.place(input), app.place(input)]);
  expect(duplicate).toEqual(first);
  expect(first.summary.equipped).toHaveLength(1);
  expect(first.run.shipBuild?.revision).toBe(1);
  const reloaded = new BuildApplication(repository, content);
  await reloaded.open(run.pilotId);
  // Q246: reload preserves all durable data and derived summaries, but clears transient history.
  expect(reloaded.snapshot()).toEqual({ ...first, history: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 } });
  expect((await repository.getActiveRun(run.pilotId))?.salvage).toEqual(run.salvage);
});

import { readFileSync } from 'node:fs';
it('does not borrow definitions from the default pack for an older pinned Run', async () => {
  const legacy = JSON.parse(readFileSync('public/content/packs/development/manifest.json', 'utf8'));
  const modern = buildPack(), run = finishedBuildRun('old-run', 'old-pilot', legacy);
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: modern.compatibleRuleset, supportedRulesetVersions: [legacy.compatibleRuleset, modern.compatibleRuleset] });
  await content.bootstrap(); expect((await content.activateCandidate(legacy)).activated).toBe(true);
  expect((await content.activateCandidate(modern)).activated).toBe(true);
  const repository = new InMemoryRunRepository(); await repository.createRun({ operationId: 'old-fixture', run });
  const result = await new BuildApplication(repository, content).open(run.pilotId);
  expect(result.kind).toBe('build-content-required');
  expect(await repository.getActiveRun(run.pilotId)).toEqual(run);
});

it('two editing contexts cannot overwrite each other with the same stale revision', async () => {
  const pack = buildPack(), run = finishedBuildRun();
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository(); await repository.createRun({ operationId: 'seed', run });
  const first = new BuildApplication(repository, content), second = new BuildApplication(repository, content);
  await first.open(run.pilotId); await second.open(run.pilotId);
  const results = await Promise.allSettled([
    first.place({ operationId: 'a', tileId: run.runId + ':starter:0', x: 0, y: 2 }),
    second.place({ operationId: 'b', tileId: run.runId + ':starter:1', x: 1, y: 2 }),
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  const rejection = results.find(result => result.status === 'rejected');
  expect(rejection?.status === 'rejected' && rejection.reason.code).toBe('STALE_REVISION');
  expect((await repository.getActiveRun(run.pilotId))?.shipBuild?.placements).toHaveLength(1);
});

it('replaying a previously committed request does not reverse later layout changes', async () => {
  const pack = buildPack(), run = finishedBuildRun();
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository(); await repository.createRun({ operationId: 'seed', run });
  const app = new BuildApplication(repository, content); await app.open(run.pilotId);
  const first = { operationId: 'first', tileId: run.runId + ':starter:0', x: 0, y: 2 };
  await app.place(first);
  const moved = await app.place({ ...first, operationId: 'move', x: 4 });
  expect(await app.place(first)).toEqual(moved);
  expect(moved.run.shipBuild?.placements).toEqual([{ tileId: first.tileId, x: 4, y: 2 }]);
});

it('same-turn reopening cannot invalidate or retarget an already queued placement', async () => {
  const pack = buildPack(), firstRun = finishedBuildRun('run-a', 'pilot-a'), secondRun = finishedBuildRun('run-b', 'pilot-b');
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository();
  await repository.createRun({ operationId: 'seed-a', run: firstRun });
  await repository.createRun({ operationId: 'seed-b', run: secondRun });
  const app = new BuildApplication(repository, content); await app.open(firstRun.pilotId);
  const results = await Promise.allSettled([
    app.place({ operationId: 'queued-a', tileId: firstRun.runId + ':starter:0', x: 0, y: 2 }),
    app.open(secondRun.pilotId),
  ]);
  expect(results[0]?.status).toBe('fulfilled');
  expect(results[1]?.status).toBe('rejected');
  expect(app.snapshot().run.pilotId).toBe(firstRun.pilotId);
  expect((await repository.getActiveRun(firstRun.pilotId))?.shipBuild?.placements).toHaveLength(1);
  expect((await repository.getActiveRun(secondRun.pilotId))?.shipBuild).toBeUndefined();
});

it('overlapping open requests cannot replace the first opening context', async () => {
  const pack = buildPack(), first = finishedBuildRun('run-a', 'pilot-a'), second = finishedBuildRun('run-b', 'pilot-b');
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository();
  await repository.createRun({ operationId: 'seed-a', run: first }); await repository.createRun({ operationId: 'seed-b', run: second });
  const app = new BuildApplication(repository, content);
  const results = await Promise.allSettled([app.open(first.pilotId), app.open(second.pilotId)]);
  expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
  expect(app.snapshot().run.pilotId).toBe(first.pilotId);
});
