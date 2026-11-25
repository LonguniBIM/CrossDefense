import { expect, type Page } from '@playwright/test';
import { buildPack } from './buildFixture';
import { readFileSync } from 'node:fs';
import type { ActiveRun } from '../src/domain/run/run';
import type { ContentPackManifest } from '../src/domain/content/contentPack';
import { hasRenderAssets } from '../src/domain/content/renderAssets';

/** Disposable v3 save exercises normal bootstrap/migration; never a production profile. */
export async function seedBuildSave(page: Page, run: ActiveRun, cachedPack?: ContentPackManifest): Promise<void> {
  await page.route('**/build-save-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated saved Build fixture</body></html>' }));
  await page.goto('/build-save-fixture');
  await page.evaluate(async ({ run, cachedPack, renderBody }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data', 30);
      request.onupgradeneeded = () => {
        const create = (name: string, key: string, indexes: string[]) => {
          const store = request.result.createObjectStore(name, { keyPath: key });
          for (const index of indexes) store.createIndex(index, index, { unique: name === 'runs' && index === 'pilotId' });
        };
        create('workspace', 'key', []); create('pilots', 'pilotId', ['lastUsedAt']); create('operations', 'operationId', ['pilotId']);
        create('runs', 'runId', ['pilotId', 'contentVersion', 'rulesetVersion']);
        create('runOperations', 'operationId', ['pilotId', 'runId']); create('salvageOperations', 'operationId', ['pilotId', 'runId']);
      };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['workspace', 'pilots', 'runs', 'operations', 'runOperations'], 'readwrite');
        tx.objectStore('workspace').add({ key: 'workspace', schemaVersion: 3 });
        tx.objectStore('pilots').add({ pilotId: run.pilotId, nickname: 'Build tester', avatarId: 'pilot-blue', createdAt: run.startedAt, lastUsedAt: run.startedAt });
        tx.objectStore('runs').add(run);
        tx.objectStore('operations').add({ operationId: 'fixture-pilot', pilotId: run.pilotId, kind: 'create-pilot' });
        tx.objectStore('runOperations').add({ operationId: 'fixture-run', pilotId: run.pilotId, runId: run.runId, kind: 'start-run' });
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    if (cachedPack) {
      if (renderBody) {
        const bodies = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('crossdefense-render-content-bodies', 10);
          request.onupgradeneeded = () => request.result.createObjectStore('bodies', { keyPath: 'version' });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          await new Promise<void>((resolve, reject) => {
            const tx = bodies.transaction('bodies', 'readwrite');
            tx.objectStore('bodies').put({ version: cachedPack.contentVersion, encoded: JSON.stringify(cachedPack) });
            tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
          });
        } finally { bodies.close(); }
      } else localStorage.setItem('crossdefense-content-pack:' + cachedPack.contentVersion, JSON.stringify(cachedPack));
      localStorage.setItem('crossdefense-content-pack-state', JSON.stringify({ activeVersion: cachedPack.contentVersion, lastKnownGoodVersion: cachedPack.contentVersion, digests: { [cachedPack.contentVersion]: cachedPack.integrity.manifestSha256 } }));
    }
  }, { run, cachedPack, renderBody: !!cachedPack && hasRenderAssets(cachedPack.contentVersion) });
}

export async function openSavedBuild(page: Page, run: ActiveRun, cachedPack?: ContentPackManifest): Promise<void> {
  // A ready saved-Build fixture includes its own pinned pack, not whichever default a newer app activates.
  const originalBuild = buildPack();
  const renderedFixtures = new Set(['development-rendered-combat-ship-v1', 'development-review-ship-v1']);
  const pinnedFixture = run.contentVersion === originalBuild.contentVersion ? originalBuild
    : renderedFixtures.has(run.contentVersion) ? JSON.parse(readFileSync('public/content/packs/' + run.contentVersion + '/manifest.json', 'utf8')) as ContentPackManifest
    : undefined;
  await seedBuildSave(page, run, cachedPack ?? pinnedFixture);
  await page.goto('/');
  await continueSavedBuild(page);
}

export async function continueSavedBuild(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /^(Pilot chooser|Workspace is active in another tab)$/ })).toBeVisible();
  if (await page.getByTestId('retry-ownership').isVisible()) await page.getByTestId('retry-ownership').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
}
