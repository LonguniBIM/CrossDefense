import './results.css';
import type { ResultsApplication } from '../application/results/ResultsApplication';
import type { ReviewApplication } from '../application/review/ReviewApplication';
import type { ContentPackManifest } from '../domain/content/contentPack';
import { rewardPreview } from '../domain/results/settlement';
import { combatPayloadEntries } from '../domain/combat/payload';

/** Outcome facts and saved rewards are distinct; no success is displayed before receipt acknowledgment. */
export function mountResults(root: HTMLElement, app: ResultsApplication, callbacks: {
  back(): Promise<void>; salvage(): Promise<void>;
  review?: { app: ReviewApplication; open(): Promise<void> };
}, initialAttemptId?: string, pack?: ContentPackManifest): () => void {
  const controller = new AbortController(); let ended = false, busy = false;
  const review = callbacks.review;
  let preparedFor: string | null = null, offerFailed = false;
  const initial = app.snapshot();
  let selected = initialAttemptId ?? initial.run.attempt?.attemptId ?? initial.outcomes.at(-1)?.outcome.attemptId ?? '';
  if (!initial.outcomes.some(row => row.outcome.attemptId === selected)) selected = initial.outcomes.at(-1)?.outcome.attemptId ?? '';
  root.innerHTML = `<main class="rs-shell"><header class="rs-header"><div><span class="rs-eyebrow">SAVED OUTCOMES</span><h1>Results</h1></div><div class="actions"><button class="primary" data-testid="settle-result">Save rewards</button><button class="primary" data-testid="retry-result" hidden>Retry the same settlement</button><button class="primary" data-testid="results-review" hidden>Review one word</button><button class="primary" data-testid="retry-review-offer" hidden>Retry Review offer</button><button class="secondary" data-testid="results-back">Back to Build</button><button class="primary" data-testid="results-salvage">Resolve Salvage</button></div></header>
    <section class="rs-panel rs-balance" aria-label="Saved Pilot balances"><p>Credits <strong data-testid="results-credits"></strong></p><p>Celestium <strong data-testid="results-celestium"></strong></p><p class="muted">Permanent Pilot balances. Pending rewards are not included.</p></section>
    <section class="rs-feedback" aria-label="Settlement status"><p data-testid="result-saved" role="status"></p><p class="error" data-testid="result-error" role="alert" hidden></p><p data-testid="result-status" role="status"></p></section><div class="rs-columns"><section class="rs-panel"><label>Saved Attempt<select data-testid="result-selection"></select></label><h2 data-testid="result-title"></h2><p class="identity" data-testid="result-identity"></p><p data-testid="result-detail"></p><p data-testid="result-progress"></p>
      <h3>Reward settlement</h3><p data-testid="result-eligibility"></p><dl class="rs-amounts"><div><dt>Repeatable victory</dt><dd data-testid="result-repeatable"></dd></div><div><dt>First-Clear bonus</dt><dd data-testid="result-first-clear"></dd></div><div><dt>Total for this outcome</dt><dd data-testid="result-total"></dd></div></dl>
      
    </section><section class="rs-panel"><h2>Committed loot: <span data-testid="result-loot-count"></span></h2><p class="muted">Only payloads saved during this Attempt appear here. This history is not a second inventory; kept or discarded items are not granted again.</p><div class="rs-list" data-testid="result-loot"></div><p data-testid="result-salvage-count"></p><p class="muted">Resolve every Salvage choice before the next Attempt. Review is optional when offered by this Run’s content.</p></section></div></main>`;
  const get = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const choice = get<HTMLSelectElement>('result-selection');
  for (const row of initial.outcomes) {
    const option = document.createElement('option'); option.value = row.outcome.attemptId;
    option.textContent = row.outcome.terminal.kind + ' / ' + row.outcome.difficulty + ' / ' + row.outcome.attemptId;
    choice.append(option);
  }
  choice.value = selected;
  const money = (value: { credits: number; celestium: number }) => value.credits + ' Credits / ' + value.celestium + ' Celestium';
  function eligibleOffer(): boolean {
    const row = app.snapshot().outcomes.find(item => item.outcome.attemptId === selected);
    return !!review && !!pack?.review && !!row?.settlement
      && (row.outcome.terminal.kind === 'victory' || row.outcome.terminal.kind === 'failed')
      && row.outcome.contentVersion === pack.contentVersion
      && row.outcome.rulesetVersion === pack.compatibleRuleset
      && row.outcome.contentDigest === pack.integrity.manifestSha256;
  }
  const blocked = () => busy || app.hasPendingSave() || !!review?.app.hasPendingSave() || offerFailed;
  async function loadOffer(retry: boolean): Promise<void> {
    if (!eligibleOffer() || !review) { preparedFor = null; offerFailed = false; return; }
    try {
      if (retry && review.app.hasPendingSave()) await review.app.retry();
      else await review.app.open(initial.run.pilotId, selected);
      preparedFor = selected; offerFailed = false;
      if (!ended) get('result-status').textContent = 'Review is ready. You can review now or skip and return from Build.';
    } catch (error) { offerFailed = true; throw error; }
  }
  async function prepareOffer(retry = false): Promise<void> {
    if (ended || busy || !eligibleOffer()) return;
    busy = true; get('result-error').hidden = true;
    get('result-status').textContent = 'Preparing optional Review...'; render();
    try { await loadOffer(retry); }
    catch (error) { if (!ended) { get('result-status').textContent = ''; get('result-error').hidden = false; get('result-error').textContent = error instanceof Error ? error.message : String(error); } }
    finally { busy = false; render(); }
  }
  function render(): void {
    if (ended) return;
    const state = app.snapshot(), row = state.outcomes.find(item => item.outcome.attemptId === selected);
    const isBlocked = blocked(), eligible = eligibleOffer();
    const prepared = eligible && preparedFor === selected;
    const reviewState = prepared ? review?.app.snapshot() : undefined;
    const completed = reviewState?.occurrences.some(item => item.occurrenceId === reviewState.selectedOccurrenceId && !!item.completedAt);
    get<HTMLButtonElement>('results-review').hidden = !eligible;
    get<HTMLButtonElement>('results-review').disabled = isBlocked || !prepared;
    get('results-review').textContent = completed ? 'View completed Review' : 'Review one word';
    get('results-back').textContent = eligible && !completed ? 'Skip Review · Back to Build' : 'Back to Build';
    get<HTMLButtonElement>('retry-review-offer').hidden = !offerFailed && !review?.app.hasPendingSave();
    get<HTMLButtonElement>('retry-review-offer').disabled = busy;
    get('results-credits').textContent = String(state.economy.credits); get('results-celestium').textContent = String(state.economy.celestium);
    choice.disabled = isBlocked || !state.outcomes.length;
    get<HTMLButtonElement>('results-back').disabled = isBlocked;
    get<HTMLButtonElement>('results-salvage').disabled = isBlocked || !(state.run.salvageBuffer?.length);
    get('result-salvage-count').textContent = 'Currently unresolved Salvage: ' + (state.run.salvageBuffer?.length ?? 0);
    get<HTMLButtonElement>('settle-result').disabled = isBlocked || !row || !!row.settlement;
    get<HTMLButtonElement>('retry-result').hidden = !app.hasPendingSave(); get<HTMLButtonElement>('retry-result').disabled = busy;
    get('result-loot').replaceChildren();
    if (!row) {
      get('result-title').textContent = 'No completed combat outcomes yet.'; get('result-loot-count').textContent = '0';
      get('result-eligibility').textContent = 'Diagnostic Attempts do not produce combat rewards.'; return;
    }
    const { outcome, settlement } = row, victory = outcome.terminal.kind === 'victory';
    const first = victory && !state.economy.firstClearMapIds.includes(outcome.mapId);
    const amounts = settlement ?? (victory ? rewardPreview(outcome.rewards, outcome.difficulty, first) : {
      repeatable: { credits: 0, celestium: 0 }, firstClearBonus: { credits: 0, celestium: 0 }, total: { credits: 0, celestium: 0 },
    });
    get('result-title').textContent = outcome.terminal.kind === 'victory' ? 'Victory' : outcome.terminal.kind === 'failed' ? 'Failed: ' + outcome.terminal.causes[0] : outcome.terminal.kind === 'abandoned' ? 'Abandoned' : 'Interrupted';
    get('result-identity').textContent = outcome.attemptId;
    get('result-detail').textContent = outcome.mapId + ' / ' + outcome.difficulty + ' / ' + outcome.contentVersion + '. Saved at ' + outcome.recordedAt + '.' + (outcome.terminal.causes.length > 1 ? ' Concurrent causes: ' + outcome.terminal.causes.join(', ') + '.' : '');
    get('result-progress').textContent = victory ? 'This development pack contains one Map. Your Run, Cargo and layout are preserved for replay.' : 'No victory or First-Clear reward is eligible for this ending. Saved loot is preserved.';
    get('result-eligibility').textContent = settlement ? 'Recorded from this outcome. The saved amount does not change when another difficulty is selected.' : victory ? (first ? 'First-Clear eligible for this Pilot and Map, once across difficulties and content versions.' : 'Replay: the Pilot has already received this Map\'s First-Clear bonus.') : 'Record this outcome with zero currency and no First-Clear claim.';
    get('result-repeatable').textContent = money(amounts.repeatable); get('result-first-clear').textContent = money(amounts.firstClearBonus); get('result-total').textContent = money(amounts.total);
    get('result-saved').textContent = settlement ? 'Settlement saved. This outcome cannot pay again.' : 'Not settled. No currency from this outcome has been added to the displayed balance.';
    get('settle-result').textContent = victory ? 'Save rewards' : 'Record result';
    get('result-loot-count').textContent = String(outcome.collectedIds.length);
    const entries = pack?.combat && pack.contentVersion === outcome.contentVersion && pack.integrity.manifestSha256 === outcome.contentDigest ? combatPayloadEntries(outcome.attemptId, pack.combat) : [];
    for (const id of outcome.collectedIds) {
      const tile = entries.find(entry => entry.id === id), node = document.createElement('p'); node.dataset.tileId = id;
      node.textContent = (tile ? tile.letter + ' / ' + tile.subtype : 'Saved Letter Tile') + ' - ' + id; get('result-loot').append(node);
    }
    if (!outcome.collectedIds.length) get('result-loot').textContent = 'No payloads were committed in this Attempt.';
  }
  async function save(retry: boolean): Promise<void> {
    if (busy || ended) return; busy = true; get('result-error').hidden = true; get('result-status').textContent = 'Saving outcome settlement...'; render();
    try { if (retry) await app.retry(); else await app.settle(selected); if (!ended) get('result-status').textContent = 'Outcome settlement saved.'; await loadOffer(false); }
    catch (error) { if (!ended) { get('result-status').textContent = ''; get('result-error').hidden = false; get('result-error').textContent = error instanceof Error ? error.message : String(error); } }
    finally { busy = false; render(); }
  }
  choice.addEventListener('change', () => { if (blocked()) return; selected = choice.value; preparedFor = null; get('result-error').hidden = true; get('result-status').textContent = ''; render(); void prepareOffer(); }, { signal: controller.signal });
  get('settle-result').addEventListener('click', () => void save(false), { signal: controller.signal });
  get('retry-result').addEventListener('click', () => void save(true), { signal: controller.signal });
  get('retry-review-offer').addEventListener('click', () => void prepareOffer(true), { signal: controller.signal });
  for (const [id, action] of [['results-back', callbacks.back], ['results-salvage', callbacks.salvage], ['results-review', async () => { if (review && preparedFor === selected) await review.open(); }]] as const) get(id).addEventListener('click', () => {
    if (blocked()) return; busy = true; render(); void action().catch(error => { if (!ended) { busy = false; get('result-error').hidden = false; get('result-error').textContent = String(error); render(); } });
  }, { signal: controller.signal });
  render(); choice.focus(); void prepareOffer();
  return () => { ended = true; controller.abort(); };
}
