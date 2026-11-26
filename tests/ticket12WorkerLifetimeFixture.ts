import { expect, type APIRequestContext, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { setTicket12ServerState } from './ticket12ServerControl';
import { requestActualUpdate, waitForWaitingBuild } from './ticket12UpdateFixture';

export type LifetimeGateMode = 'before-skip-waiting' | 'during-activation' | 'before-window-check';
interface LifetimeGateState { mode: LifetimeGateMode; enteredAt: number; released: boolean; nativeCalls: number; }
interface LifetimeGate extends LifetimeGateState { release(): void; }
interface LifetimeScope {
  __ticket12Lifetime?: LifetimeGate;
  skipWaiting(): Promise<void>;
  addEventListener(type: string, listener: (event: { waitUntil(promise: Promise<void>): void }) => void): void;
  clients: { matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<unknown[]> };
}

/** Capture the newly installed native worker. No fetch/worker/protocol response is substituted. */
export async function stageLifetimeCandidate(page: Page, context: BrowserContext, request: APIRequestContext, currentBuild: string) {
  const previous = new Set(context.serviceWorkers());
  const next = context.waitForEvent('serviceworker', {
    predicate: worker => !previous.has(worker) && new URL(worker.url()).pathname === '/sw.js', timeout: 45_000,
  });
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] });
  await requestActualUpdate(page);
  const worker = await next;
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  expect(context.serviceWorkers()).toContain(worker);
  return { worker, candidateBuild };
}

/**
 * Isolated native scheduling fixture, not a production hook: defer the original
 * skipWaiting/clients.matchAll call, or extend the real activate event lifetime.
 * Every release invokes the original browser behavior and keeps native validation.
 */
export async function installLifetimeGate(worker: Worker, mode: LifetimeGateMode): Promise<void> {
  await worker.evaluate(mode => {
    const scope = self as unknown as LifetimeScope;
    if (scope.__ticket12Lifetime) throw Error('A lifetime gate is already installed.');
    let release!: () => void;
    const promise = new Promise<void>(resolve => { release = resolve; });
    const state: LifetimeGate = {
      mode, enteredAt: 0, released: false, nativeCalls: 0,
      release() { state.released = true; release(); },
    };
    scope.__ticket12Lifetime = state;
    if (mode === 'before-skip-waiting') {
      const native = scope.skipWaiting.bind(scope);
      scope.skipWaiting = async () => {
        state.enteredAt = Date.now(); await promise; state.nativeCalls += 1;
        await native();
      };
    } else if (mode === 'during-activation') {
      scope.addEventListener('activate', event => {
        state.enteredAt = Date.now(); event.waitUntil(promise);
      });
    } else {
      const native = scope.clients.matchAll.bind(scope.clients);
      scope.clients.matchAll = async options => {
        if (options?.includeUncontrolled === true) { state.enteredAt = Date.now(); await promise; }
        state.nativeCalls += 1;
        return native(options);
      };
    }
  }, mode);
}

export async function lifetimeGateState(worker: Worker): Promise<LifetimeGateState & { elapsedMs: number }> {
  return worker.evaluate(() => {
    const state = (self as unknown as LifetimeScope).__ticket12Lifetime;
    if (!state) throw Error('The native worker scheduling gate is missing.');
    return { mode: state.mode, enteredAt: state.enteredAt, released: state.released, nativeCalls: state.nativeCalls,
      elapsedMs: state.enteredAt ? Date.now() - state.enteredAt : 0 };
  });
}

export async function waitPastOriginalLifetimeTimeout(page: Page, worker: Worker): Promise<void> {
  await expect.poll(async () => (await lifetimeGateState(worker)).enteredAt, { timeout: 10_000 }).toBeGreaterThan(0);
  const state = await lifetimeGateState(worker);
  // Real elapsed time is the assertion boundary. No fake browser clock or accelerated timeout.
  const remaining = 16_500 - state.elapsedMs;
  if (remaining > 0) await page.waitForTimeout(remaining);
  expect((await lifetimeGateState(worker)).elapsedMs).toBeGreaterThanOrEqual(16_000);
}

export async function releaseLifetimeGate(worker: Worker): Promise<void> {
  await worker.evaluate(() => {
    const state = (self as unknown as LifetimeScope).__ticket12Lifetime;
    if (!state) throw Error('The native worker scheduling gate is missing.');
    state.release();
  });
}

export async function readLifetimePage(page: Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const root = document.querySelector<HTMLElement>('#app');
    const undo = document.querySelector<HTMLButtonElement>('[data-testid="undo-build"]');
    const chooseMap = document.querySelector<HTMLButtonElement>('[data-testid="choose-map"]');
    return {
      timeOrigin: performance.timeOrigin, inert: root?.inert ?? null,
      heading: document.querySelector('h1')?.textContent,
      appBuild: document.querySelector<HTMLElement>('[data-testid="offline-app-version"]')?.dataset.appBuild,
      status: document.querySelector('[data-testid="offline-status"]')?.textContent,
      installing: registration?.installing?.state ?? null, waiting: registration?.waiting?.state ?? null,
      active: registration?.active?.state ?? null, controller: navigator.serviceWorker.controller?.state ?? null,
      undoDisabled: undo?.disabled ?? null, chooseMapDisabled: chooseMap?.disabled ?? null,
    };
  });
}

/** A real pointer event also exercises the inert browser boundary, unlike dispatchEvent. */
export async function clickLifetimeProtectedControl(page: Page, testId: string): Promise<void> {
  const bounds = await page.getByTestId(testId).boundingBox();
  if (!bounds) throw Error('Protected control is missing: ' + testId);
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}
