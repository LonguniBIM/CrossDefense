import './results.css';
import type { SalvageApplication, SalvageChoices } from '../application/results/SalvageApplication';
import { retainedTiles } from '../domain/run/cargo';
import { INITIAL_CARGO_CAPACITY } from '../domain/build/rules';
import { formatHundredths } from './BuildView';
import type { StarterTile } from '../domain/preRun/salvage';

/** Native staged choices; one final confirmation, no implicit Keep, discard, swap or reward. */
export function mountSalvage(root: HTMLElement, app: SalvageApplication, callbacks: {
  back(): Promise<void>; applied(): Promise<void>;
}): () => void {
  const controller = new AbortController(); let ended = false, busy = false;
  const snapshot = app.snapshot(), buffer = snapshot.run.salvageBuffer ?? [], retained = retainedTiles(snapshot.run);
  const chosen = new Map<string, 'keep' | 'discard'>(), removed = new Set<string>();
  root.innerHTML = `<main class="rs-shell"><header class="rs-header"><div><span class="rs-eyebrow">STAGED / NOT SAVED</span><h1>Resolve Salvage</h1></div><div class="actions"><button class="secondary" data-testid="cancel-salvage">Cancel and return</button><button class="primary" data-testid="review-salvage">Review and apply</button><button class="primary" data-testid="retry-salvage" hidden>Retry the same batch</button></div></header>
    <section class="rs-panel rs-summary"><p>Projected retained Cargo: <strong data-testid="salvage-capacity"></strong> / <span>24</span></p><p data-testid="salvage-unresolved"></p><p data-testid="salvage-preview-power"></p><p data-testid="salvage-preview-words"></p><p class="error" data-testid="salvage-validation"></p><p class="error" data-testid="salvage-error" role="alert" hidden></p><p data-testid="salvage-status" role="status"></p></section>
    <div class="rs-columns"><section class="rs-panel"><h2>New Salvage: <span data-testid="salvage-buffer-count"></span></h2><p class="muted">Choose Keep or Discard for every item. Kept items enter unplaced Cargo. Nothing changes until confirmation.</p><div class="rs-tile-list" data-testid="salvage-buffer-list"></div></section>
    <section class="rs-panel"><h2>Retained Cargo: <span data-testid="salvage-retained-count"></span></h2><p class="muted">Optional replacements: explicitly mark retained items to discard. Equipped items count toward capacity. Their positions are removed; no new tile is placed automatically.</p><div class="rs-tile-list" data-testid="salvage-retained-list"></div></section></div>
    <p class="rs-discard-note">Discard gives no reward and cannot be reversed by layout Undo. Cancel changes no saved data.</p></main>`;
  const get = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const tileLabel = (tile: StarterTile) => tile.letter + ' / ' + tile.subtype;
  const title = (tile: StarterTile, host: HTMLElement) => {
    const name = document.createElement('strong'), identity = document.createElement('small');
    name.textContent = tileLabel(tile); identity.textContent = tile.id; identity.className = 'identity'; host.append(name, identity);
  };
  for (const tile of buffer) {
    const row = document.createElement('article'); row.className = 'rs-tile-choice'; row.dataset.tileId = tile.id; title(tile, row);
    const label = document.createElement('label'), select = document.createElement('select'); label.textContent = 'Decision';
    select.dataset.testid = 'salvage-choice'; select.dataset.tileId = tile.id; select.setAttribute('aria-label', 'Decision for ' + tileLabel(tile) + ', ' + tile.id);
    for (const [value, text] of [['', 'Choose...'], ['keep', 'Keep'], ['discard', 'Discard']]) { const option = document.createElement('option'); option.value = value!; option.textContent = text!; select.append(option); }
    label.append(select); row.append(label); get('salvage-buffer-list').append(row);
    select.addEventListener('change', () => { if (busy || app.hasPendingSave()) return; if (select.value) chosen.set(tile.id, select.value as 'keep' | 'discard'); else chosen.delete(tile.id); render(); }, { signal: controller.signal });
  }
  for (const tile of retained) {
    const row = document.createElement('article'); row.className = 'rs-tile-choice'; row.dataset.tileId = tile.id; title(tile, row);
    const position = snapshot.run.shipBuild?.placements.find(value => value.tileId === tile.id);
    const detail = document.createElement('span'); detail.textContent = position ? 'Equipped at ' + String.fromCharCode(65 + position.x) + (position.y + 1) : 'Unplaced'; row.append(detail);
    const label = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.dataset.testid = 'discard-retained'; input.dataset.tileId = tile.id;
    label.append(input, document.createTextNode('Discard this retained item')); row.append(label); get('salvage-retained-list').append(row);
    input.addEventListener('change', () => { if (busy || app.hasPendingSave()) return; if (input.checked) removed.add(tile.id); else removed.delete(tile.id); render(); }, { signal: controller.signal });
  }
  get('salvage-buffer-count').textContent = String(buffer.length); get('salvage-retained-count').textContent = String(retained.length);
  if (!buffer.length) get('salvage-buffer-list').textContent = 'No unresolved Salvage.';
  function choices(): SalvageChoices { return { keepIds: buffer.filter(tile => chosen.get(tile.id) === 'keep').map(tile => tile.id), discardIds: buffer.filter(tile => chosen.get(tile.id) === 'discard').map(tile => tile.id), removeRetainedIds: [...removed] }; }
  function render(): void {
    if (ended) return;
    const staged = choices(), preview = app.preview(staged), frozen = busy || app.hasPendingSave();
    get('salvage-capacity').textContent = String(retained.length - removed.size + staged.keepIds.length);
    get('salvage-unresolved').textContent = 'Unresolved choices: ' + (buffer.length - chosen.size);
    get('salvage-validation').textContent = preview.message ?? '';
    const after = preview.after;
    get('salvage-preview-power').textContent = after ? 'Power Available ' + formatHundredths(preview.before.power.available) + ' -> ' + formatHundredths(after.power.available) + '; Required ' + formatHundredths(preview.before.power.required) + ' -> ' + formatHundredths(after.power.required) + '; Surplus ' + formatHundredths(preview.before.power.surplus) + ' -> ' + formatHundredths(after.power.surplus) + '.' : 'Complete capacity-valid choices to inspect Build impact.';
    get('salvage-preview-words').textContent = after ? 'Equipped words: ' + (preview.before.words.filter(word => word.supported).map(word => word.spelling + ' (' + word.axis + ')').join(', ') || 'None') + ' -> ' + (after.words.filter(word => word.supported).map(word => word.spelling + ' (' + word.axis + ')').join(', ') || 'None') + '.' : '';
    // Feature save locks do not own the shared Workspace Settings launcher.
    for (const control of root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input,select,button:not(.st-launcher)')) control.disabled = frozen;
    get<HTMLButtonElement>('review-salvage').disabled = frozen || !preview.valid;
    get<HTMLButtonElement>('retry-salvage').hidden = !app.hasPendingSave(); get<HTMLButtonElement>('retry-salvage').disabled = busy;
  }
  async function persist(staged?: SalvageChoices): Promise<void> {
    if (busy || ended) return; busy = true; get('salvage-error').hidden = true; get('salvage-status').textContent = 'Saving the confirmed Salvage batch...'; render();
    try { if (staged) await app.apply(staged, true); else await app.retry(); if (!ended) { get('salvage-status').textContent = 'Salvage saved.'; await callbacks.applied(); } }
    catch (error) { if (!ended) { get('salvage-status').textContent = ''; get('salvage-error').hidden = false; get('salvage-error').textContent = error instanceof Error ? error.message : String(error); } }
    finally { busy = false; if (!ended && !app.hasPendingSave() && !(app.snapshot().run.salvageBuffer?.length)) { get<HTMLButtonElement>('review-salvage').disabled = true; get<HTMLButtonElement>('cancel-salvage').disabled = false; } else render(); }
  }
  get('review-salvage').addEventListener('click', () => {
    if (busy || app.hasPendingSave()) return;
    const staged = choices(), preview = app.preview(staged); if (!preview.valid) return;
    const dialog = document.createElement('dialog'); dialog.className = 'rs-confirm'; dialog.dataset.testid = 'salvage-confirmation';
    const heading = document.createElement('h2'); heading.id = 'salvage-confirm-title'; heading.textContent = 'Confirm this Salvage batch'; dialog.setAttribute('aria-labelledby', heading.id); dialog.append(heading);
    const paragraph = (text: string) => { const node = document.createElement('p'); node.textContent = text; dialog.append(node); };
    paragraph('Retained capacity: ' + preview.before.retainedCount + ' -> ' + preview.after!.retainedCount + ' / ' + INITIAL_CARGO_CAPACITY + '.');
    paragraph('Keep ' + preview.kept.length + ' as unplaced Cargo: ' + (preview.kept.map(tile => tileLabel(tile) + ' [' + tile.id + ']').join('; ') || 'none') + '.');
    paragraph('Permanently discard ' + (preview.discarded.length + preview.removed.length) + ' items: ' + ([...preview.discarded, ...preview.removed].map(tile => tileLabel(tile) + ' [' + tile.id + ']').join('; ') || 'none') + '.');
    paragraph('Removed equipment: ' + (preview.before.equipped.filter(tile => staged.removeRetainedIds.includes(tile.id)).map(tile => tileLabel(tile) + ' at ' + String.fromCharCode(65 + tile.x) + (tile.y + 1)).join('; ') || 'none') + '.');
    paragraph(get('salvage-preview-power').textContent ?? ''); paragraph(get('salvage-preview-words').textContent ?? '');
    paragraph('Discard gives no reward. Removed items cannot be recovered with layout Undo. This is the only destructive confirmation.');
    const actions = document.createElement('div'); actions.className = 'actions';
    const cancel = document.createElement('button'), confirm = document.createElement('button'); cancel.textContent = 'Cancel'; cancel.className = 'secondary'; cancel.autofocus = true; cancel.dataset.testid = 'cancel-salvage-confirmation'; confirm.textContent = 'Confirm Apply'; confirm.className = 'primary'; confirm.dataset.testid = 'confirm-salvage';
    cancel.onclick = () => dialog.close('cancel'); confirm.onclick = () => dialog.close('confirm'); actions.append(cancel, confirm); dialog.append(actions); root.append(dialog);
    dialog.addEventListener('close', () => { const accepted = dialog.returnValue === 'confirm'; dialog.remove(); if (ended) return; get('review-salvage').focus(); if (accepted) void persist(staged); }, { once: true }); dialog.showModal();
  }, { signal: controller.signal });
  get('retry-salvage').addEventListener('click', () => void persist(), { signal: controller.signal });
  get('cancel-salvage').addEventListener('click', () => { if (busy || app.hasPendingSave()) return; busy = true; render(); void callbacks.back().catch(error => { if (!ended) { busy = false; get('salvage-error').hidden = false; get('salvage-error').textContent = String(error); render(); } }); }, { signal: controller.signal });
  render(); get('cancel-salvage').focus();
  return () => { ended = true; controller.abort(); for (const dialog of root.querySelectorAll('dialog')) dialog.close('cancel'); };
}
