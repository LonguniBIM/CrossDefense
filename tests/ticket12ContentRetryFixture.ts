import { type Page } from '@playwright/test';

type AcknowledgmentTarget = 'content' | 'review';
export interface ContentRetryTrace {
  contentWrites: number;
  reviewWrites: Array<{ operationId?: string; kind?: string }>;
  nativeCompletions: Partial<Record<AcknowledgmentTarget, { isTrusted: boolean }>>;
  releases: AcknowledgmentTarget[];
}
interface HeldAcknowledgment {
  tx: IDBTransaction;
  complete: NonNullable<IDBTransaction['oncomplete']>;
  intercept: NonNullable<IDBTransaction['oncomplete']>;
  event: Event | null;
}
interface ContentRetryHarness {
  read(): ContentRetryTrace;
  release(target: AcknowledgmentTarget): Promise<void>;
  restore(): Promise<{ restored: boolean; problems: string[]; remainingCallbacks: number }>;
}
type RetryWindow = Window & { __ticket12ContentRetry?: ContentRetryHarness };

/** Remove only the replaceable body. The immutable identity registry and native Player Data stay intact. */
export async function removeReviewBody(page: Page, version: string): Promise<void> {
  await page.evaluate(async version => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-render-content-bodies');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('bodies', 'readwrite');
        const table = tx.objectStore('bodies'), request = table.get(version);
        request.onsuccess = () => {
          if (!request.result) { tx.abort(); return; }
          table.delete(version);
        };
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error ?? Error('The intended replaceable Review body did not exist.'));
        tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, version);
}

/**
 * Hold only the installed application acknowledgment callback after a genuine native commit.
 * Requests, transaction writes, events, worker installation and activation remain real.
 * This fixture delivers the original trusted event on release; it invents no acknowledgment.
 */
export async function installContentRetryAcknowledgments(page: Page, holdContent: boolean): Promise<void> {
  await page.evaluate(holdContent => {
    if (Object.hasOwn(window, '__ticket12ContentRetry')) throw Error('Content Retry fixture already installed.');
    const nativePut = IDBObjectStore.prototype.put, nativeAdd = IDBObjectStore.prototype.add;
    const held = new Map<AcknowledgmentTarget, HeldAcknowledgment>();
    const trace: ContentRetryTrace = { contentWrites: 0, reviewWrites: [], nativeCompletions: {}, releases: [] };
    function checkpoint(): Promise<void> {
      return new Promise(resolve => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.onmessage = null; channel.port1.close(); channel.port2.close(); resolve();
        };
        channel.port2.postMessage(null);
      });
    }
    function capture(target: AcknowledgmentTarget, tx: IDBTransaction): void {
      if (held.has(target)) return;
      const complete = tx.oncomplete;
      if (typeof complete !== 'function') throw Error('Expected the installed native transaction completion observer.');
      let record: HeldAcknowledgment;
      const intercept: NonNullable<IDBTransaction['oncomplete']> = event => {
        event.stopImmediatePropagation();
        record.event = event;
        trace.nativeCompletions[target] = { isTrusted: event.isTrusted };
      };
      record = { tx, complete, intercept, event: null };
      held.set(target, record); tx.oncomplete = intercept;
    }
    const wrappedPut = function (this: IDBObjectStore, ...args: Parameters<typeof nativePut>) {
      if (this.transaction.db.name === 'crossdefense-render-content-bodies' && this.name === 'bodies'
        && this.transaction.mode === 'readwrite') {
        trace.contentWrites += 1;
        if (holdContent) capture('content', this.transaction);
      }
      return nativePut.apply(this, args);
    };
    const wrappedAdd = function (this: IDBObjectStore, ...args: Parameters<typeof nativeAdd>) {
      if (this.transaction.db.name === 'crossdefense-player-data' && this.name === 'reviewOperations'
        && this.transaction.mode === 'readwrite') {
        const receipt = args[0] as { operationId?: string; kind?: string };
        if (receipt.kind !== 'ensure-review') throw Error('Unexpected Review receipt in the Content Retry fixture.');
        trace.reviewWrites.push(structuredClone(receipt));
        capture('review', this.transaction);
      }
      return nativeAdd.apply(this, args);
    };
    function deliver(target: AcknowledgmentTarget): void {
      const record = held.get(target);
      if (!record?.event || trace.releases.includes(target)) throw Error('No unreleased native acknowledgment for ' + target);
      const event = record.event;
      record.event = null; record.tx.oncomplete = record.complete;
      trace.releases.push(target);
      record.complete.call(record.tx, event);
    }
    const harness: ContentRetryHarness = {
      read: () => structuredClone(trace),
      async release(target) { deliver(target); await checkpoint(); },
      async restore() {
        const problems: string[] = [];
        if (IDBObjectStore.prototype.put !== wrappedPut) problems.push('The owned content put observer was displaced.');
        if (IDBObjectStore.prototype.add !== wrappedAdd) problems.push('The owned Review add observer was displaced.');
        IDBObjectStore.prototype.put = nativePut; IDBObjectStore.prototype.add = nativeAdd;
        for (const [target, record] of held) {
          if (record.tx.oncomplete !== record.intercept && record.tx.oncomplete !== record.complete) {
            problems.push('The owned completion observer was displaced: ' + target); continue;
          }
          record.tx.oncomplete = record.complete;
          if (record.event && !trace.releases.includes(target)) deliver(target);
        }
        await checkpoint();
        const remainingCallbacks = [...held.values()].filter(record => record.event !== null).length;
        held.clear(); delete (window as RetryWindow).__ticket12ContentRetry;
        return { restored: IDBObjectStore.prototype.put === nativePut && IDBObjectStore.prototype.add === nativeAdd,
          problems, remainingCallbacks };
      },
    };
    Object.defineProperty(window, '__ticket12ContentRetry', { value: harness, configurable: true });
    IDBObjectStore.prototype.put = wrappedPut; IDBObjectStore.prototype.add = wrappedAdd;
  }, holdContent);
}

export async function readContentRetryTrace(page: Page): Promise<ContentRetryTrace> {
  return page.evaluate(() => {
    const harness = (window as RetryWindow).__ticket12ContentRetry;
    if (!harness) throw Error('Content Retry acknowledgment fixture is unavailable.');
    return harness.read();
  });
}
export async function releaseContentRetryAcknowledgment(page: Page, target: AcknowledgmentTarget): Promise<void> {
  await page.evaluate(async target => {
    const harness = (window as RetryWindow).__ticket12ContentRetry;
    if (!harness) throw Error('Content Retry acknowledgment fixture is unavailable.');
    await harness.release(target);
  }, target);
}
export async function restoreContentRetryAcknowledgments(page: Page) {
  if (page.isClosed()) return { restored: true, problems: [], remainingCallbacks: 0 };
  return page.evaluate(async () => {
    const harness = (window as RetryWindow).__ticket12ContentRetry;
    return harness ? harness.restore() : { restored: true, problems: [], remainingCallbacks: 0 };
  });
}
