import { syntheticPack as createSyntheticPack } from '../developmentPackFixture';
import { describe, expect, it } from 'vitest';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { RunApplication } from '../../src/application/run/RunApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryRunRepository } from '../../src/infrastructure/persistence/InMemoryRunRepository';

const compatibility = {
  appVersion: '0.1.0',
  rulesetVersion: 'development-ruleset-2026-09-30',
};

const syntheticPack = createSyntheticPack();

describe('Ticket 02 public StartRun scenario', () => {
  it('pins validated versions, is idempotent, survives reload, and becomes Content Required when pinned content is missing', async () => {
    const contentRepository = new InMemoryContentPackRepository();
    const content = new ContentPackApplication(contentRepository, compatibility);
    await content.bootstrap();
    expect((await content.activateCandidate(syntheticPack)).activated).toBe(true);

    const runRepository = new InMemoryRunRepository();
    const app = new RunApplication(
      runRepository,
      content,
      () => 'run-001',
      () => '2026-10-04T09:00:00.000Z',
    );

    const started = await app.startRun({
      operationId: 'start-001',
      pilotId: 'pilot-001',
    });
    const duplicate = await app.startRun({
      operationId: 'start-001',
      pilotId: 'pilot-001',
    });

    expect(started.kind).toBe('pre-run-salvage');
    expect(duplicate).toEqual(started);
    expect(await runRepository.countRuns()).toBe(1);

    if (started.kind !== 'pre-run-salvage') {
      throw new Error('Expected Pre-Run Salvage projection.');
    }
    expect(started.run).toMatchObject({
      runId: 'run-001',
      pilotId: 'pilot-001',
      rulesetVersion: compatibility.rulesetVersion,
      contentVersion: 'test-content-v1',
      quota: { total: 4, remaining: 4 },
      starterObjective: {
        targetWord: 'TEST',
        requiresWeaponTile: true,
      },
    });

    const reloaded = new RunApplication(
      runRepository,
      content,
      () => 'run-002',
      () => '2026-10-04T09:01:00.000Z',
    );
    expect(await reloaded.getRunProjection('pilot-001')).toEqual(started);

    contentRepository.removePack('test-content-v1');

    const contentRequired = await reloaded.getRunProjection('pilot-001');
    expect(contentRequired).toMatchObject({
      kind: 'content-required',
      missingContentVersion: 'test-content-v1',
      run: {
        runId: 'run-001',
        contentVersion: 'test-content-v1',
      },
    });
    expect(await runRepository.countRuns()).toBe(1);
  });
});

it('rejects reusing a StartRun operation for another Pilot without returning or changing that Pilot Run', async () => {
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), compatibility);
  await content.bootstrap();
  await content.activateCandidate(syntheticPack);
  const repository = new InMemoryRunRepository();
  let id = 0;
  const app = new RunApplication(repository, content, () => 'run-' + ++id);
  const first = await app.startRun({ operationId: 'shared-operation', pilotId: 'pilot-a' });
  await expect(app.startRun({ operationId: 'shared-operation', pilotId: 'pilot-b' })).rejects.toThrow(/operation/i);
  expect(await app.getRunProjection('pilot-a')).toEqual(first);
  expect(await app.getRunProjection('pilot-b')).toEqual({ kind: 'no-run' });
});
