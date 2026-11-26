import { APP_VERSION } from '../application/version';
import { APP_BUILD_ID } from '../infrastructure/offline/protocol';
import type { BrowserOfflineRuntime } from '../infrastructure/offline/BrowserOfflineRuntime';
import './offline.css';

/** Compact factual delivery status; the host owns admission to a safe update. */
export class OfflineStatusView {
  private readonly element = document.createElement('div');
  private readonly observer: MutationObserver;
  private readonly interval: number;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly root: HTMLElement,
    private readonly runtime: BrowserOfflineRuntime,
    private readonly contentReady: () => boolean,
    private readonly canUpdate: () => boolean,
    private readonly activate: () => Promise<void>,
  ) {
    this.element.className = 'of-delivery';
    this.element.innerHTML = `<div class="of-summary"><span data-testid="offline-status" role="status" aria-live="polite"></span>
      <button class="secondary" type="button" data-testid="offline-retry">Check offline files</button>
      <button class="primary" type="button" data-testid="update-activate" hidden>Apply update and reload</button></div>
      <span class="of-update" data-testid="update-available" hidden></span>
      <span class="of-version" data-testid="offline-app-version"></span>`;
    const version = this.element.querySelector<HTMLElement>('[data-testid="offline-app-version"]')!;
    version.textContent = 'App ' + APP_VERSION + ' · ' + APP_BUILD_ID;
    version.dataset.appBuild = APP_BUILD_ID;
    this.element.querySelector<HTMLButtonElement>('[data-testid="offline-retry"]')!.onclick = () => { void this.runtime.retry(); };
    this.element.querySelector<HTMLButtonElement>('[data-testid="update-activate"]')!.onclick = () => { void this.activate(); };
    this.observer = new MutationObserver(() => this.attach());
    this.observer.observe(root, { childList: true });
    this.unsubscribe = runtime.subscribe(() => this.render());
    // Pending save admission is checked again synchronously on activation; this only refreshes the affordance.
    this.interval = window.setInterval(() => this.render(), 400);
    this.attach();
  }

  private attach(): void {
    const host = this.root.querySelector<HTMLElement>('.cb-header, .bu-header, .pr-header')
      ?? this.root.querySelector<HTMLElement>('.panel');
    if (!host) return;
    if (this.element.parentElement !== host) {
      if (host.classList.contains('panel')) host.querySelector('h1')?.after(this.element);
      else host.append(this.element);
    }
    this.render();
  }

  render(): void {
    const state = this.runtime.status();
    const ready = state.ready && this.contentReady();
    const status = this.element.querySelector<HTMLElement>('[data-testid="offline-status"]')!;
    const message = ready ? state.message : state.ready ? 'Offline files cached; local content or storage needs attention.' : state.message;
    const inCombat = !!this.root.querySelector('.cb-shell');
    const visibleMessage = inCombat ? (ready ? (state.online ? 'Ready offline' : 'Ready offline · Offline')
      : state.preparing ? 'Preparing offline play...' : 'Offline preparation incomplete · Retry') : message;
    status.title = message;
    if (status.textContent !== visibleMessage) status.textContent = visibleMessage;
    status.dataset.offlineReady = String(ready);
    const retry = this.element.querySelector<HTMLButtonElement>('[data-testid="offline-retry"]')!;
    retry.disabled = state.applying || state.preparing;
    retry.textContent = state.stagedBuildId && !state.stagedReady ? 'Retry update preparation'
      : ready ? 'Check for updates' : 'Retry offline preparation';
    const staged = this.element.querySelector<HTMLElement>('[data-testid="update-available"]')!;
    const update = this.element.querySelector<HTMLButtonElement>('[data-testid="update-activate"]')!;
    const available = state.stagedBuildId !== null;
    staged.hidden = !available; update.hidden = !available;
    retry.hidden = available && state.stagedReady;
    update.disabled = state.applying || state.preparing || !state.stagedReady || !this.canUpdate();
    const updateMessage = state.applying ? 'Controls stay paused until the safe reload.'
      : !state.stagedReady ? 'Update preparation is incomplete. Retry its download before applying.'
      : inCombat ? 'Update staged · apply at Build after saving.'
      : this.canUpdate() ? 'Update ready. Your saved progress and pinned content will be kept.'
      : 'Update staged. Return to the Pilot chooser or Build and finish pending saves.';
    if (staged.textContent !== updateMessage) staged.textContent = updateMessage;
  }

  dispose(): void { this.observer.disconnect(); clearInterval(this.interval); this.unsubscribe(); this.element.remove(); }
}
