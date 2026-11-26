import './review.css';
import type { ReviewApplication } from '../application/review/ReviewApplication';
import type { ReviewHintKind } from '../domain/review/occurrence';

/** The view displays acknowledged evidence; unsent typing never becomes a response. */
export function mountReview(root: HTMLElement, app: ReviewApplication, leave: () => Promise<void>): () => void {
  const controller = new AbortController();
  let disposed = false, busy = false, pendingKind: 'submit' | 'hint' | null = null;
  root.innerHTML = `<main class="rv-shell">
    <header class="rv-header"><div><span class="rv-eyebrow">OPTIONAL PRACTICE</span><h1>Vocabulary Review</h1></div><button class="secondary" data-testid="review-leave">Leave Review · Back to Build</button></header>
    <section class="rv-balances" aria-label="Saved Pilot balances"><p>Credits <strong data-testid="review-credits"></strong></p><p>Celestium <strong data-testid="review-celestium"></strong></p><span class="muted">Saved balances</span></section>
    <div class="rv-columns"><section class="rv-card" aria-label="Meaning question">
      <p class="rv-eyebrow">ONE WORD · ONE MEANING</p><h2 data-testid="review-prompt"></h2>
      <p class="muted">Type the English word. Uppercase and lowercase are accepted. You can retry as often as you like.</p>
      <form data-testid="review-form" novalidate><label for="review-answer">Your answer</label><input id="review-answer" data-testid="review-answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="review-feedback review-error" />
        <div class="rv-actions"><button type="submit" class="primary" data-testid="review-submit">Submit answer</button><button type="button" class="primary" data-testid="review-retry" hidden>Retry the same save</button></div></form>
      <p data-testid="review-saving" role="status"></p><p id="review-feedback" data-testid="review-feedback" role="status"></p><p id="review-error" class="error" data-testid="review-error" role="alert" hidden></p>
      <section class="rv-completed" data-testid="review-completed" hidden><h3>Review complete</h3><p data-testid="review-reward"></p><p data-testid="review-reward-detail"></p><p class="muted">This occurrence is saved. Returning to it does not grant another reward.</p></section>
    </section><aside class="rv-card"><h2>Optional help</h2><p class="muted">Each requested hint is saved. Hints keep the completion Credit available, but remove the independent first-response bonus.</p>
      <button type="button" class="secondary" data-testid="request-pronunciation">Play pronunciation</button><p class="muted" data-testid="pronunciation-feedback" role="status"></p>
      <div class="rv-hint-actions"><button class="secondary" data-testid="review-hint-context">Context hint</button><button class="secondary" data-testid="review-hint-letter">Letter hint</button><button class="secondary" data-testid="review-hint-reveal">Reveal answer</button></div>
      <div class="rv-hints" data-testid="review-hints" aria-live="polite"></div>
      <h3>Your saved practice</h3><p>Submitted responses: <strong data-testid="review-response-count"></strong></p><p data-testid="review-first-response"></p><p data-testid="review-attempts"></p>
      <p class="muted">Leaving keeps your saved responses and hints. Unsubmitted typing is not an attempt. Revealing alone earns no reward.</p>
    </aside></div>
  </main>`;
  const get = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const answer = get<HTMLInputElement>('review-answer');
  const blocked = () => busy || app.hasPendingSave();
  function render(): void {
    if (disposed) return;
    const state = app.snapshot();
    const occurrence = state.occurrences.find(row => row.occurrenceId === state.selectedOccurrenceId);
    const entry = occurrence?.definition.entries.find(row => row.id === occurrence.entryId);
    const reward = state.rewards.find(row => row.occurrenceId === occurrence?.occurrenceId);
    const complete = !!occurrence?.completedAt;
    get('review-credits').textContent = String(state.economy.credits);
    get('review-celestium').textContent = String(state.economy.celestium);
    get('review-prompt').textContent = entry?.prompt ?? 'There is no due Review to answer.';
    answer.disabled = blocked() || complete || !entry;
    get<HTMLButtonElement>('request-pronunciation').disabled = blocked() || !entry;
    get<HTMLButtonElement>('review-submit').disabled = answer.disabled;
    get<HTMLButtonElement>('review-leave').disabled = blocked();
    get<HTMLButtonElement>('review-retry').hidden = !app.hasPendingSave();
    get<HTMLButtonElement>('review-retry').disabled = busy;
    get('review-completed').hidden = !complete || !reward;
    get('review-response-count').textContent = String(occurrence?.responses.length ?? 0);
    get('review-first-response').textContent = occurrence?.firstResponse
      ? 'First response: ' + occurrence.firstResponse.answer + (occurrence.firstResponse.correct ? ' — correct.' : ' — not correct.')
      : 'No response submitted yet.';
    get('review-attempts').textContent = occurrence?.attemptsToFirstCorrect
      ? 'Responses to first correct: ' + occurrence.attemptsToFirstCorrect + '.' : '';
    const latest = occurrence?.responses.at(-1);
    get('review-feedback').textContent = latest ? latest.correct ? 'Correct. Your completion is saved.' : 'Try again. Your response is saved.' : '';
    get('review-hints').replaceChildren();
    for (const hint of ['context', 'letter', 'reveal'] as const) {
      const requested = occurrence?.hints.some(row => row.hint === hint) ?? false;
      get<HTMLButtonElement>('review-hint-' + hint).disabled = blocked() || complete || !entry || requested;
      if (requested && entry) {
        const p = document.createElement('p');
        p.textContent = (hint === 'reveal' ? 'Answer: ' : '') + entry.hints[hint];
        get('review-hints').append(p);
      }
    }
    get('review-reward').textContent = reward ? reward.total.credits + (reward.total.credits === 1 ? ' Credit saved.' : ' Credits saved.') : '';
    get('review-reward-detail').textContent = reward
      ? reward.completionCredits + ' completion Credit + ' + reward.independentFirstResponseCredits + ' independent first-response Credit. No Celestium.'
      : '';
    if (complete) get('review-leave').textContent = 'Back to Build';
  }
  async function save(kind: 'submit' | 'hint' | 'retry', hint?: ReviewHintKind): Promise<void> {
    if (disposed || busy || kind !== 'retry' && app.hasPendingSave()) return;
    if (kind !== 'retry') pendingKind = kind;
    busy = true;
    get('review-error').hidden = true;
    get('review-error').textContent = '';
    get('review-saving').textContent = 'Saving Review...';
    render();
    try {
      if (kind === 'retry') await app.retry();
      else if (kind === 'hint') await app.hint(hint!);
      else await app.submit(answer.value);
      if (!disposed) {
        if (pendingKind === 'submit') answer.value = '';
        pendingKind = null;
        get('review-saving').textContent = 'Review saved.';
      }
    } catch (error) {
      if (!disposed) {
        get('review-saving').textContent = '';
        get('review-error').hidden = false;
        get('review-error').textContent = error instanceof Error ? error.message : String(error);
      }
    } finally {
      busy = false;
      if (!disposed) { render(); if (!answer.disabled) answer.focus(); }
    }
  }
  get<HTMLFormElement>('review-form').addEventListener('submit', event => { event.preventDefault(); if (!blocked()) void save('submit'); }, { signal: controller.signal });
  get('request-pronunciation').addEventListener('click', () => {
    // Q15 contains no audio asset. This presentation-only request never submits a hint or response.
    get('pronunciation-feedback').textContent = 'Pronunciation audio is unavailable for this word. You can continue Review using the meaning and text.';
  }, { signal: controller.signal });
  get('review-retry').addEventListener('click', () => void save('retry'), { signal: controller.signal });
  for (const hint of ['context', 'letter', 'reveal'] as const) get('review-hint-' + hint).addEventListener('click', () => {
    if (!blocked()) void save('hint', hint);
  }, { signal: controller.signal });
  get('review-leave').addEventListener('click', () => {
    if (blocked()) return;
    busy = true; render();
    void leave().catch(error => {
      if (!disposed) { busy = false; get('review-error').hidden = false; get('review-error').textContent = String(error); render(); }
    });
  }, { signal: controller.signal });
  render();
  if (!answer.disabled) answer.focus(); else get('review-leave').focus();
  return () => { disposed = true; controller.abort(); };
}
