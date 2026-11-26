import { createHash } from 'node:crypto';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { CombatApplication } from '../src/application/combat/CombatApplication';
import { InMemoryAttemptRepository } from '../src/infrastructure/persistence/InMemoryAttemptRepository';
import type { CombatOutcome } from '../src/domain/combat/collection';
import type { BoardAction, BoardInput } from '../src/domain/preRun/board';
import type { ActiveRun } from '../src/domain/run/run';
import { collectStarterThroughKeyboard, observedBoard } from './preRunBrowserPlayer';
import { choosePlacement } from './preRunPlayer';
import { inspectResultsSave } from './resultsBrowserFixture';

const controls: Record<BoardAction, { key: string; code: string }> = {
  cw: { key: 'x', code: 'KeyX' }, ccw: { key: 'z', code: 'KeyZ' },
  left: { key: 'ArrowLeft', code: 'ArrowLeft' }, right: { key: 'ArrowRight', code: 'ArrowRight' },
  drop: { key: 'Space', code: 'Space' }, down: { key: 'ArrowDown', code: 'ArrowDown' }, hold: { key: 'c', code: 'KeyC' },
};
export interface Ticket12InputBatch { beforeTick: number; pieceId: string; inputs: BoardInput[]; }

export async function ticket12Frames(page: Page, count = 1, milliseconds = 1000 / 60): Promise<void> {
  await page.evaluate(async ({ count, milliseconds }) => {
    for (let index = 0; index < count; index++) await (window as unknown as {
      __buildTestFrame: (elapsed: number) => Promise<void>;
    }).__buildTestFrame(milliseconds);
  }, { count, milliseconds });
}

/** Earn every starter tile through the ordinary production UI; no prepared save or reward injection. */
export async function earnTicket12Build(page: Page, nickname: string): Promise<void> {
  await page.getByLabel('Nickname').fill(nickname);
  await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').filter({ hasText: nickname }).getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('start-content-version')).toHaveText('development-review-ship-v1');
  await page.getByTestId('start-run').click();
  await page.getByTestId('begin-salvage').click();
  await collectStarterThroughKeyboard(page);
  await page.getByTestId('finish-salvage').click();
  for (const [letter, subtype, cell] of [['S', 'Ballistic', 'A3'], ['H', 'Armor', 'B3'], ['I', 'Power', 'C3'], ['P', 'Armor', 'D3']]) {
    await page.getByRole('button', { name: letter + ', ' + subtype + ', unplaced Letter Tile', exact: true }).first().click();
    await page.getByTestId('cell-' + cell).click();
    await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  }
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
}

/** Override only the random-ID/seed platform boundary for one reproducible workload. */
export async function startTicket12Combat(page: Page): Promise<ActiveRun> {
  await page.getByTestId('choose-map').click();
  await page.evaluate(() => {
    const native = crypto.randomUUID.bind(crypto);
    const ids = ['00000012-0000-4000-8000-000000000001', '00000012-0000-4000-8000-000000000002',
      '00000007-0000-4000-8000-000000000004'];
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () => ids.shift() ?? native() });
  });
  await page.getByTestId('start-attempt').click();
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state', 'ready', { timeout: 20_000 });
  const saved = await inspectResultsSave(page);
  const run = saved.tables.runs![0] as ActiveRun;
  expect(run.phase).toBe('attempt');
  expect(run.attempt!.combatProgress!.lastCommittedTick).toBe(0);
  await ticket12Frames(page, 1, 0);
  return run;
}

export async function ticket12KeyboardBatch(page: Page): Promise<Ticket12InputBatch> {
  const board = await observedBoard(page), beforeTick = Number(await page.getByTestId('combat-tick').innerText());
  const inputs: BoardInput[] = [];
  for (const action of choosePlacement(board)) {
    const control = controls[action];
    inputs.push({ action, code: control.code, down: true, pieceId: board.active.id },
      { action, code: control.code, down: false, pieceId: board.active.id });
    await page.keyboard.press(control.key);
  }
  return { beforeTick, pieceId: board.active.id, inputs };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => JSON.stringify(key) + ':' + canonical(child)).join(',') + '}';
  return JSON.stringify(value);
}
function semanticOutcome(outcome: CombatOutcome) {
  const { recordedAt: _wallClock, ...semantic } = outcome;
  return semantic;
}

/** Replay observed ordered inputs through the public Application seam, independently of the browser frame host. */
export async function proveTicket12Parity(page: Page, initial: ActiveRun, batches: Ticket12InputBatch[], info: TestInfo): Promise<void> {
  const saved = await inspectResultsSave(page);
  const actual = (saved.tables.combatOutcomes as CombatOutcome[]).find(item => item.attemptId === initial.attempt!.attemptId)!;
  expect(actual).toBeDefined(); expect(actual.terminal.kind).toBe('victory');
  const repository = new InMemoryAttemptRepository();
  await repository.createPilot({ operationId: 'replay-create-pilot', pilot: { pilotId: initial.pilotId, nickname: 'Offline replay',
    avatarId: 'pilot-blue', createdAt: initial.startedAt, lastUsedAt: initial.startedAt } });
  await repository.createRun({ operationId: 'replay-create-run', run: initial });
  let operation = 0;
  const app = new CombatApplication(repository, () => 'replay-combat-' + (++operation), () => '2026-11-26T00:00:00Z');
  await app.open(initial.pilotId, initial.attempt!.attemptId);
  let batch = 0;
  for (let tick = 0; tick < actual.tick!; tick++) {
    const entry = batches[batch];
    const inputs = entry?.beforeTick === tick ? entry.inputs : [];
    if (entry?.beforeTick === tick) {
      expect(app.projection().simulation.board.active.id).toBe(entry.pieceId);
      batch++;
    }
    await app.advance(inputs);
  }
  const expected = app.projection();
  expect(batch).toBe(batches.length);
  expect(expected.outcome).not.toBeNull();
  expect(semanticOutcome(actual)).toEqual(semanticOutcome(expected.outcome!));
  const battle = expected.simulation.battle;
  await expect(page.getByTestId('combat-tick')).toHaveText(String(battle.tick));
  await expect(page.getByTestId('board-tick')).toHaveText(String(expected.simulation.board.tick));
  await expect(page.getByTestId('combat-threat')).toHaveText(String(expected.simulation.board.locks));
  expect(Number(await page.getByTestId('player-hull').innerText())).toBe(Number((battle.player.hull / 10000).toFixed(2)));
  expect(Number(await page.getByTestId('player-shield').innerText())).toBe(Number((battle.player.shield / 10000).toFixed(2)));
  const browserDigest = createHash('sha256').update(canonical(semanticOutcome(actual))).digest('hex');
  const headlessDigest = createHash('sha256').update(canonical(semanticOutcome(expected.outcome!))).digest('hex');
  expect(browserDigest).toBe(headlessDigest);
  await info.attach('offline-scenario-diagnostic.json', { contentType: 'application/json', body: JSON.stringify({
    appVersion: initial.attempt!.appVersion, appBuild: await page.getByTestId('offline-app-version').getAttribute('data-app-build'),
    browser: page.context().browser()?.version(), viewport: page.viewportSize(),
    contentVersion: initial.contentVersion, rulesetVersion: initial.rulesetVersion,
    contentDigest: initial.attempt!.startup.contentDigest, seed: initial.attempt!.seed,
    inputBatches: batches.length, orderedInputCount: batches.reduce((sum, item) => sum + item.inputs.length, 0),
    terminal: actual.terminal, tick: actual.tick, collectedIds: actual.collectedIds,
    browserDigest, headlessDigest, exclusions: ['recordedAt: wall clock metadata only'],
  }, null, 2) });
}
