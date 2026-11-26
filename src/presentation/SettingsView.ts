import type { SettingsApplication } from '../application/workspace/SettingsApplication';
import { ACTION_LABELS, AUDIO_CHANNELS, DEFAULT_SETTINGS, GAMEPLAY_ACTIONS, validateSettingsForSave, SettingsRejection, type WorkspaceSettings } from '../domain/workspace/settings';
import './settings.css';
import { controlsText, keyLabel } from './GameplayInput';
import { applyPresentationSettings } from './PresentationPreferences';

export interface SettingsAccess {
  current(): WorkspaceSettings;
  open(invoker: HTMLElement): void;
  attach(root: HTMLElement, beforeOpen?: () => void): void;
}

/** Owns the editable draft and native modal; only acknowledged settings affect the game. */
export class WorkspaceSettingsView implements SettingsAccess {
  private dialog: HTMLDialogElement | null = null;
  private pendingDraft: WorkspaceSettings | null = null;
  private refreshRequired = false;
  // An operation belongs to this view even when a host transition replaces its modal.
  private readonly ui: { draft: WorkspaceSettings; ready: boolean; busy: boolean; message: string; operationError: string } = {
    draft: structuredClone(DEFAULT_SETTINGS), ready: false, busy: false, message: '', operationError: '',
  };
  private renderer: { dialog: HTMLDialogElement; render: () => void } | null = null;

  private renderCurrent(): void {
    const owner = this.renderer;
    if (owner && this.dialog === owner.dialog && owner.dialog.open && owner.dialog.isConnected) owner.render();
  }

  constructor(private readonly application: () => SettingsApplication | null) {}

  current(): WorkspaceSettings {
    try { return this.application()?.projection() ?? structuredClone(DEFAULT_SETTINGS); }
    catch { return structuredClone(DEFAULT_SETTINGS); }
  }

  attach(root: HTMLElement, beforeOpen?: () => void): void {
    // Reconcile a surviving Settings modal before a newly mounted host starts.
    if (this.dialog?.open) beforeOpen?.();
    if (root.querySelector('[data-testid="open-settings"]')) return;
    let actions = root.querySelector<HTMLElement>('.bu-history, .cb-header .actions, .pr-actions, .actions') ?? root.querySelector<HTMLElement>('header');
    if (!actions) {
      actions = document.createElement('div'); actions.className = 'actions st-launcher-row';
      const heading = root.querySelector('h1');
      if (heading) heading.after(actions); else root.append(actions);
    }
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'secondary st-launcher'; button.dataset.testid = 'open-settings';
    button.textContent = 'Settings'; button.setAttribute('aria-haspopup', 'dialog');
    button.onclick = () => { if (document.querySelector('dialog[open]')) return; beforeOpen?.(); this.open(button); };
    actions.append(button);
    if (root.querySelector('[data-testid="start-run"], [data-testid="begin-salvage"], [data-testid="start-attempt"]')) {
      const summary = document.createElement('p'); summary.className = 'st-controls-summary'; summary.dataset.testid = 'controls-before-play';
      summary.textContent = controlsText(this.current()); actions.before(summary);
    }
  }

  dismiss(): void { this.dialog?.close(); }

  open(invoker: HTMLElement): void {
    // Native close is synchronous, but its close event may arrive after another open action.
    if (this.dialog && !this.dialog.open) {
      if (this.renderer?.dialog === this.dialog) this.renderer = null;
      this.dialog.remove(); this.dialog = null;
    }
    if (this.dialog || document.querySelector('dialog[open]')) return;
    const app = this.application();
    let readyForOpen = false;
    try { app?.projection(); readyForOpen = app !== null && !this.refreshRequired; } catch { /* Recovery remains accessible without writable settings. */ }
    const dialog = document.createElement('dialog');
    this.dialog = dialog; dialog.className = 'st-dialog'; dialog.setAttribute('aria-labelledby', 'settings-title');
    dialog.innerHTML = `<header><h2 id="settings-title">Settings and controls</h2>
      <p id="settings-scope" data-testid="settings-scope">Saved on this device for all Pilots in this local Workspace.</p></header>
      <div class="st-sections"><section><h3>Gameplay controls</h3><p class="st-help" id="binding-help">Select a key field and press a new key. Tab moves focus; Escape closes Settings. Browser shortcuts remain available. Standalone Shift activates on release for rotation, Hard drop, Hold or Pause. Movement and Soft drop need a key that can be held. Empty extra fields are optional.</p>
        <div class="st-bindings" data-testid="settings-bindings"></div>
        <button type="button" class="secondary" data-testid="restore-controls">Restore control defaults</button></section>
      <section><h3>Audio and motion</h3><div class="st-audio" data-testid="settings-audio"></div>
        <p class="st-help">No audio is included in this development pack. Missing audio never blocks play or Review. Pronunciation is only requested by you.</p>
        <label class="st-check"><input type="checkbox" data-testid="reduced-motion"> Reduce motion</label>
        <p class="st-help">Your system's reduced-motion preference is always respected. Resources, warnings, progress and collected tiles remain visible.</p>
      </section></div>
      <p id="settings-error" class="error" data-testid="settings-error" role="alert" hidden></p>
      <p data-testid="settings-status" role="status" aria-live="polite"></p>
      <footer class="st-actions"><button type="button" class="primary" data-testid="save-settings">Save settings</button>
        <button type="button" class="primary" data-testid="retry-settings" hidden>Retry the same save</button>
        <button type="button" class="secondary" data-testid="close-settings">Close</button></footer>`;
    dialog.setAttribute('aria-describedby', 'settings-scope');
    const get = <T extends HTMLElement = HTMLElement>(id: string) => dialog.querySelector<T>(`[data-testid="${id}"]`)!;
    const state = this.ui;
    if (!state.busy) {
      state.draft = structuredClone(app?.hasPendingSave() && this.pendingDraft ? this.pendingDraft : this.current());
      state.ready = readyForOpen;
      state.message = state.ready ? 'Changes apply only after Save settings.' : 'Settings are read-only until Workspace storage is ready. Close this dialog to use recovery.';
      state.operationError = '';
    }
    const bindings = get('settings-bindings');
    const inputs: HTMLInputElement[] = [];
    function update(): void {
      let validationError = '';
      try { validateSettingsForSave(state.draft); } catch (error) { validationError = error instanceof Error ? error.message : String(error); }
      const pending = app?.hasPendingSave() ?? false, locked = state.busy || pending || !state.ready;
      for (const input of inputs) {
        const action = input.dataset.action as typeof GAMEPLAY_ACTIONS[number], index = Number(input.dataset.index);
        input.value = keyLabel(state.draft.bindings[action][index] ?? ''); input.disabled = locked;
        input.setAttribute('aria-invalid', String(!!validationError));
      }
      dialog.querySelectorAll<HTMLButtonElement>('[data-clear-binding]').forEach(button => { button.disabled = locked; });
      for (const channel of AUDIO_CHANNELS) {
        const volume = get<HTMLInputElement>('volume-' + channel), mute = get<HTMLInputElement>('mute-' + channel);
        volume.value = Number.isFinite(state.draft.audio[channel].volume) ? String(state.draft.audio[channel].volume) : '';
        volume.disabled = locked; mute.checked = state.draft.audio[channel].muted; mute.disabled = locked;
      }
      get<HTMLInputElement>('reduced-motion').checked = state.draft.reducedMotion; get<HTMLInputElement>('reduced-motion').disabled = locked;
      get<HTMLButtonElement>('restore-controls').disabled = locked;
      get<HTMLButtonElement>('save-settings').disabled = locked || !!validationError;
      get<HTMLButtonElement>('retry-settings').hidden = !pending; get<HTMLButtonElement>('retry-settings').disabled = state.busy || !state.ready;
      get<HTMLButtonElement>('close-settings').disabled = state.busy;
      get('settings-error').textContent = validationError || state.operationError;
      get('settings-error').hidden = !(validationError || state.operationError);
      get('settings-status').textContent = state.message;
    }
    this.renderer = { dialog, render: update };
    const changed = () => { state.operationError = ''; state.message = 'Unsaved changes.'; update(); };
    for (const action of GAMEPLAY_ACTIONS) {
      const row = document.createElement('div'); row.className = 'st-binding-row';
      const name = document.createElement('strong'); name.textContent = ACTION_LABELS[action]; row.append(name);
      for (let index = 0; index < 3; index++) {
        const slot = document.createElement('div'); slot.className = 'st-key-slot';
        const input = document.createElement('input'); input.readOnly = true;
        input.setAttribute('aria-label', ACTION_LABELS[action] + ' binding ' + (index + 1));
        input.setAttribute('aria-describedby', 'binding-help settings-error'); input.placeholder = 'Add key';
        input.dataset.testid = 'binding-' + action + '-' + index; input.dataset.action = action; input.dataset.index = String(index);
        const capture = (code: string) => {
          if (state.busy || app?.hasPendingSave() || !state.ready) return;
          state.draft.bindings[action][index] = code;
          state.draft.bindings[action] = state.draft.bindings[action].filter(Boolean);
          changed();
        };
        let shiftCandidate: string | null = null;
        input.addEventListener('keydown', event => {
          if (event.key === 'Tab' || event.key === 'Escape' || event.ctrlKey || event.altKey || event.metaKey) { shiftCandidate = null; return; }
          if (event.repeat) return;
          // Wait for release to distinguish standalone Shift from native Shift+Tab navigation.
          if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') { shiftCandidate = event.code; return; }
          shiftCandidate = null; event.preventDefault(); capture(event.code);
        });
        input.addEventListener('keyup', event => {
          if (shiftCandidate === event.code) capture(event.code);
          shiftCandidate = null;
        });
        input.addEventListener('blur', () => { shiftCandidate = null; });
        const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'secondary st-clear';
        clear.textContent = '×'; clear.dataset.clearBinding = action + '-' + index;
        clear.setAttribute('aria-label', 'Clear ' + ACTION_LABELS[action] + ' binding ' + (index + 1));
        clear.onclick = () => { state.draft.bindings[action].splice(index, 1); changed(); input.focus(); };
        slot.append(input, clear); row.append(slot); inputs.push(input);
      }
      bindings.append(row);
    }
    for (const channel of AUDIO_CHANNELS) {
      const label = channel[0]!.toUpperCase() + channel.slice(1);
      const field = document.createElement('fieldset'); field.className = 'st-channel';
      field.innerHTML = `<legend>${label}</legend><label>Volume (0–100)<input type="number" min="0" max="100" step="1" data-testid="volume-${channel}" aria-label="${label} volume"></label><label class="st-check"><input type="checkbox" data-testid="mute-${channel}" aria-label="Mute ${label.toLowerCase()}"> Mute</label>`;
      get('settings-audio').append(field);
      get<HTMLInputElement>('volume-' + channel).oninput = event => { state.draft.audio[channel].volume = (event.target as HTMLInputElement).valueAsNumber; changed(); };
      get<HTMLInputElement>('mute-' + channel).onchange = event => { state.draft.audio[channel].muted = (event.target as HTMLInputElement).checked; changed(); };
    }
    get<HTMLInputElement>('reduced-motion').onchange = event => { state.draft.reducedMotion = (event.target as HTMLInputElement).checked; changed(); };
    get('restore-controls').onclick = () => { state.draft.bindings = structuredClone(DEFAULT_SETTINGS.bindings); changed(); };
    const publish = (saved: WorkspaceSettings) => {
      state.draft = saved; applyPresentationSettings(saved); this.pendingDraft = null;
      document.querySelectorAll<HTMLElement>('[data-testid="controls-before-play"]').forEach(summary => { summary.textContent = controlsText(saved); });
    };
    const reloadCurrent = async () => {
      if (!app) return;
      state.busy = true; state.ready = false; this.refreshRequired = true;
      state.message = 'Loading current saved settings...'; this.renderCurrent();
      try {
        publish(await app.open()); state.ready = true; this.refreshRequired = false;
        state.operationError = 'Your previous draft was not saved because Settings changed.';
        state.message = 'Loaded current saved settings. Review them before saving further changes.';
      } catch (error) {
        state.operationError = error instanceof Error ? error.message : String(error);
        state.message = 'Current Settings could not be loaded. Close and reopen Settings to try again.';
      } finally { state.busy = false; this.renderCurrent(); }
    };
    const save = async (retry: boolean) => {
      if (!app || !state.ready || state.busy) return;
      state.busy = true; state.operationError = ''; state.message = retry ? 'Retrying the same Settings save...' : 'Saving settings...';
      this.pendingDraft = structuredClone(state.draft); this.renderCurrent();
      try {
        const saved = retry ? await app.retry() : await app.save(state.draft);
        publish(saved); state.message = 'Settings saved for all Pilots on this device.';
      } catch (error) {
        state.operationError = error instanceof Error ? error.message : String(error);
        state.message = 'Settings were not acknowledged. The previously saved settings remain active.';
        if (!app.hasPendingSave()) this.pendingDraft = null;
        if (error instanceof SettingsRejection && error.code === 'STALE_SETTINGS') await reloadCurrent();
      } finally { state.busy = false; this.renderCurrent(); }
    };
    get('save-settings').onclick = () => { void save(false); };
    get('retry-settings').onclick = () => { void save(true); };
    get('close-settings').onclick = () => { if (!state.busy) dialog.close(); };
    dialog.addEventListener('cancel', event => { if (state.busy) event.preventDefault(); });
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('keyup', event => event.stopPropagation());
    dialog.addEventListener('close', () => {
      // Native close already restores focus; deferred cleanup must preserve a later focus move.
      const focused = document.activeElement;
      const restoreInvoker = focused === null || focused === document.body || dialog.contains(focused);
      dialog.remove(); if (this.dialog === dialog) this.dialog = null;
      if (this.renderer?.dialog === dialog) this.renderer = null;
      if (restoreInvoker && invoker.isConnected && !document.querySelector('dialog[open]')) invoker.focus();
    }, { once: true });
    update(); document.body.append(dialog); dialog.showModal();
    if (state.ready) inputs[0]!.focus(); else get('close-settings').focus();
    if (this.refreshRequired && !state.busy) void reloadCurrent();
  }
}
