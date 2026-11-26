import { APP_BUILD_ID } from './protocol';

export interface OfflineStatus {
  ready: boolean;
  online: boolean;
  preparing: boolean;
  applying: boolean;
  stagedBuildId: string | null;
  stagedReady: boolean;
  message: string;
}
interface CacheReply { buildId: string; ready: boolean; missing: string[]; }

/** Browser delivery only. Application lifecycle admission is owned by the host. */
export class BrowserOfflineRuntime {
  private registration: ServiceWorkerRegistration | null = null;
  private readonly watched = new WeakSet<ServiceWorker>();
  private readonly listeners = new Set<(status: OfflineStatus) => void>();
  private inspecting = false;
  private inspectAgain = false;
  private started = false;
  private transitionRefusal: string | null = null;
  private readonly state: OfflineStatus = {
    ready: false, online: navigator.onLine, preparing: true, applying: false,
    stagedBuildId: null, stagedReady: false, message: 'Preparing offline play...',
  };

  subscribe(listener: (status: OfflineStatus) => void): () => void {
    this.listeners.add(listener); listener(this.status());
    return () => this.listeners.delete(listener);
  }
  status(): OfflineStatus { return { ...this.state }; }
  private emit(): void { for (const listener of this.listeners) listener(this.status()); }
  private readonly connectivity = () => {
    this.state.online = navigator.onLine;
    this.state.ready = false;
    this.emit();
    void this.refresh();
  };
  private readonly controllerChanged = () => { void this.refresh(); };
  private readonly visible = () => { if (!document.hidden) void this.refresh(); };

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      this.state.preparing = false;
      this.state.message = 'Offline play is unavailable in this browser or connection.';
      this.emit(); return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', this.controllerChanged);
    window.addEventListener('online', this.connectivity);
    window.addEventListener('offline', this.connectivity);
    document.addEventListener('visibilitychange', this.visible);
    await this.register();
  }

  private async register(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      this.registration.addEventListener('updatefound', () => {
        this.watch(this.registration?.installing ?? null);
        void this.refresh();
      });
      this.watch(this.registration.installing);
      this.watch(this.registration.waiting);
      await this.refresh();
    } catch (error) { this.failed(error); }
  }

  private watch(worker: ServiceWorker | null): void {
    if (!worker || this.watched.has(worker)) return;
    this.watched.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !this.state.applying) {
        this.state.preparing = false;
        this.state.message = this.state.ready
          ? 'Update preparation failed. Your current offline version is preserved.'
          : 'Offline preparation failed. Reconnect and retry; saved progress is preserved.';
        this.emit();
      }
      void this.refresh();
    });
  }

  async refresh(): Promise<void> {
    if (this.inspecting) { this.inspectAgain = true; return; }
    this.inspecting = true;
    try {
      do {
        this.inspectAgain = false;
        await this.inspect();
      } while (this.inspectAgain);
    } catch (error) { this.failed(error); }
    finally { this.inspecting = false; }
  }

  private async inspect(): Promise<void> {
    const registration = this.registration;
    if (!registration || this.state.applying) return;
    this.state.online = navigator.onLine;
    this.watch(registration.installing);
    this.watch(registration.waiting);
    const active = navigator.serviceWorker.controller ?? registration.active;
    if (!active || active.state !== 'activated') {
      this.state.ready = false;
      this.state.preparing = !!registration.installing || !!registration.waiting || active?.state === 'activating';
      if (!this.state.preparing) this.state.message = 'Offline preparation is incomplete. Reconnect and retry.';
      this.emit(); return;
    }
    const current = cacheReply(await askWorker(active, { type: 'CHECK_CACHE', buildId: APP_BUILD_ID }));
    if (this.state.applying) return;
    this.state.ready = current.ready && current.buildId === APP_BUILD_ID;
    this.state.preparing = false;
    if (this.state.ready && !navigator.serviceWorker.controller) {
      const reply = await askWorker(active, { type: 'CLAIM_CURRENT', buildId: APP_BUILD_ID });
      if (this.state.applying) return;
      if (!isRecord(reply) || reply.claimed !== true) {
        this.state.ready = false;
        this.state.message = reason(reply, 'Close other CrossDefense tabs and retry offline preparation.');
      }
    }
    if (this.state.ready) this.state.message = this.state.online ? 'Ready offline' : 'Ready offline · playing without network';
    else if (current.buildId !== APP_BUILD_ID) this.state.message = 'A different App version is cached. Return to the Pilot chooser or Build to reload safely.';
    else if (!current.ready) this.state.message = 'Offline files are incomplete. Reconnect and retry; saved progress is preserved.';
    const waiting = registration.waiting;
    if (waiting && waiting.state === 'installed') {
      const candidate = cacheReply(await askWorker(waiting, { type: 'CHECK_CACHE', buildId: APP_BUILD_ID }));
      if (this.state.applying) return;
      this.state.stagedBuildId = candidate.buildId;
      this.state.stagedReady = candidate.ready;
      if (!candidate.ready) this.state.message = 'The staged update is incomplete. Retry its download; saved progress is preserved.';
    } else {
      this.state.stagedBuildId = current.buildId !== APP_BUILD_ID && current.ready ? current.buildId : null;
      this.state.stagedReady = this.state.stagedBuildId !== null;
    }
    if (this.transitionRefusal) this.state.message = this.transitionRefusal;
    this.emit();
  }

  async retry(): Promise<void> {
    if (this.state.applying || this.state.preparing) return;
    this.transitionRefusal = null;
    this.state.preparing = true; this.state.message = 'Checking offline files...'; this.emit();
    try {
      if (!this.registration || (!this.registration.active && !this.registration.waiting && !this.registration.installing)) {
        // A failed first install can remove its registration. Reacquire it for an actual new preparation attempt.
        await this.register(); return;
      }
      const active = navigator.serviceWorker.controller ?? this.registration.active;
      if (navigator.onLine) {
        if (active?.state === 'activated') {
          const current = cacheReply(await askWorker(active, { type: 'CHECK_CACHE', buildId: APP_BUILD_ID }));
          if (current.buildId === APP_BUILD_ID && !current.ready) {
            const repaired = cacheReply(await askWorker(active, { type: 'REPAIR_CACHE', buildId: current.buildId }));
            if (repaired.buildId !== current.buildId) throw Error('The cached App build changed while repairing. Check again.');
          }
        }
        const waiting = this.registration.waiting;
        if (waiting?.state === 'installed') {
          const candidate = cacheReply(await askWorker(waiting, { type: 'CHECK_CACHE', buildId: APP_BUILD_ID }));
          if (!candidate.ready) {
            // The waiting worker owns its own cache and immutable manifest; page fetches would repair the active build instead.
            const repaired = cacheReply(await askWorker(waiting, { type: 'REPAIR_CACHE', buildId: candidate.buildId }));
            if (repaired.buildId !== candidate.buildId) throw Error('The staged App build changed while repairing. Check again.');
          }
        }
        await this.registration.update();
      }
      this.watch(this.registration.installing);
      await this.refresh();
    } catch (error) { this.failed(error); }
  }

  async activateWaiting(): Promise<boolean> {
    if (this.state.applying || this.state.preparing || !this.state.stagedBuildId || !this.state.stagedReady || !this.registration) return false;
    this.transitionRefusal = null;
    const expected = this.state.stagedBuildId;
    const waiting = this.registration.waiting;
    if (!waiting) {
      // Another completed activation can only be adopted through this explicit safe reload action.
      const active = this.registration.active;
      if (!active) return false;
      const status = cacheReply(await askWorker(active, { type: 'CHECK_CACHE', buildId: expected }));
      return status.ready && status.buildId === expected && status.buildId !== APP_BUILD_ID;
    }
    this.state.applying = true;
    this.state.message = 'Applying the saved update. Play remains paused until the reload.';
    this.emit();
    try {
      const reply = await activateAndObserve(waiting, expected, message => {
        this.state.message = message; this.emit();
      });
      if (!reply.activated) {
        this.transitionRefusal = reply.reason ?? 'The update was not applied. Current progress is preserved.';
        this.state.message = this.transitionRefusal;
      }
      return reply.activated;
    } finally {
      this.state.applying = false; this.emit(); void this.refresh();
    }
  }

  private failed(error: unknown): void {
    if (this.state.applying) return;
    this.state.ready = false;
    this.state.preparing = false;
    this.state.message = error instanceof Error ? error.message : 'Offline preparation could not complete. Reconnect and retry.';
    this.emit();
  }
  dispose(): void {
    if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', this.controllerChanged);
    window.removeEventListener('online', this.connectivity); window.removeEventListener('offline', this.connectivity);
    document.removeEventListener('visibilitychange', this.visible); this.listeners.clear();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function reason(value: unknown, fallback: string): string { return isRecord(value) && typeof value.reason === 'string' ? value.reason : fallback; }
function cacheReply(value: unknown): CacheReply {
  if (!isRecord(value) || typeof value.buildId !== 'string' || typeof value.ready !== 'boolean' || !Array.isArray(value.missing) || value.missing.length > 128 || value.missing.some(path => typeof path !== 'string')) throw Error('Offline readiness could not be verified. Retry preparation.');
  return value as unknown as CacheReply;
}
function askWorker(worker: ServiceWorker, message: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = () => { clearTimeout(timer); channel.port1.close(); };
    const timer = window.setTimeout(() => { finish(); reject(Error('Offline verification timed out. Reconnect and retry.')); }, 15_000);
    channel.port1.onmessage = event => { finish(); resolve(event.data); };
    channel.port1.onmessageerror = () => { finish(); reject(Error('Offline verification returned an unreadable response.')); };
    try { worker.postMessage(message, [channel.port2]); }
    catch (error) { finish(); reject(error); }
  });
}
interface ActivationResult { activated: boolean; reason?: string; }

/** A notification deadline never cancels a native worker's outstanding activation. */
function activateAndObserve(worker: ServiceWorker, buildId: string, pending: (message: string) => void): Promise<ActivationResult> {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    let finished = false;
    const finish = (result: ActivationResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.removeEventListener('statechange', changed);
      channel.port1.onmessage = null; channel.port1.onmessageerror = null;
      channel.port1.close(); channel.port2.close();
      resolve(result);
    };
    const changed = () => {
      if (worker.state === 'activated') finish({ activated: true });
      else if (worker.state === 'redundant') finish({ activated: false, reason: 'The staged update became unavailable. Current progress is preserved.' });
    };
    const uncertain = () => {
      if (!finished) pending('The update is taking longer than expected. Keep this window open; play remains paused until its result is known.');
    };
    const timer = window.setTimeout(uncertain, 15_000);
    channel.port1.onmessage = event => {
      changed();
      if (finished) return;
      if (!isRecord(event.data) || typeof event.data.activated !== 'boolean') { uncertain(); return; }
      if (event.data.activated === false) {
        // Native activation already in progress takes precedence over a late or contradictory reply.
        if (worker.state === 'activating') { uncertain(); return; }
        finish({ activated: false, reason: reason(event.data, 'The update was not applied. Current progress is preserved.') });
      }
      // A positive acknowledgment still waits for the native activated state.
    };
    channel.port1.onmessageerror = uncertain;
    worker.addEventListener('statechange', changed);
    changed();
    if (!finished) {
      try { worker.postMessage({ type: 'ACTIVATE_UPDATE', buildId }, [channel.port2]); }
      catch { finish({ activated: false, reason: 'The update request could not be sent. Current progress is preserved.' }); }
    }
  });
}
