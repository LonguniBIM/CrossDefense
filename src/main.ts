import { BrowserOfflineRuntime } from './infrastructure/offline/BrowserOfflineRuntime';
import { OfflineStatusView } from './presentation/OfflineStatusView';
import { WorkspaceSettingsView } from './presentation/SettingsView';
import { applyPresentationSettings } from './presentation/PresentationPreferences';
import { SettingsApplication } from './application/workspace/SettingsApplication';
import { ResultsApplication } from './application/results/ResultsApplication';
import { ReviewApplication } from './application/review/ReviewApplication';
import { mountReview } from './presentation/ReviewView';
import { SalvageApplication } from './application/results/SalvageApplication';
import { mountResults } from './presentation/ResultsView';
import { mountSalvage } from './presentation/SalvageView';
import { retainedTiles } from './domain/run/cargo';
import { RENDERED_CONTENT_VERSION, REVIEW_CONTENT_VERSION, hasRenderAssets } from './domain/content/renderAssets';
import { CombatApplication } from './application/combat/CombatApplication';
import { mountCombat } from './presentation/CombatView';
import { COMBAT_RULESET_VERSION } from './domain/combat/rules';
import { AttemptApplication } from './application/attempt/AttemptApplication';
import { mountMapSelection, mountAttemptDiagnostic } from './presentation/AttemptView';
import { ATTEMPT_RULESET_VERSION } from './domain/attempt/rules';
import type { ActiveRun } from './domain/run/run';
import { BuildApplication } from './application/build/BuildApplication';
import { mountBuild } from './presentation/BuildView';
import { PreRunApplication } from './application/preRun/PreRunApplication';
import { mountPreRun } from './presentation/PreRunView';
import { collectedTiles } from './domain/preRun/salvage';
import { ContentStorageError } from './application/content/ContentPackRepository';
import './presentation/styles.css';
import { STOCK_AVATARS, type PilotProfile, type StockAvatarId } from './domain/workspace/pilot';
import { WorkspaceApplication, type PilotChooserProjection } from './application/workspace/WorkspaceApplication';
import { ContentPackApplication } from './application/content/ContentPackApplication';
import { RunApplication, type RunProjection, type StartRunRequest } from './application/run/RunApplication';
import { APP_VERSION, DEVELOPMENT_RULESET_VERSION } from './application/version';
import { BUILD_RULESET_VERSION } from './domain/build/rules';
import { DexieWorkspaceRepository } from './infrastructure/persistence/DexieWorkspaceRepository';
import { LocalStorageContentPackRepository } from './infrastructure/content/LocalStorageContentPackRepository';
import { WorkspaceWriteLock } from './infrastructure/workspace/WorkspaceWriteLock';

const DEVELOPMENT_PACK_URL = '/content/packs/development-review-ship-v1/manifest.json';
const PINNED_PACK_URLS = new Map([
  ['development-starter-ship-v1', '/content/packs/development/manifest.json'],
  ['development-build-ship-v1', '/content/packs/development-build-ship-v1/manifest.json'],
  ['development-attempt-ship-v1', '/content/packs/development-attempt-ship-v1/manifest.json'],
  ['development-combat-ship-v1', '/content/packs/development-combat-ship-v1/manifest.json'],
  [RENDERED_CONTENT_VERSION, '/content/packs/development-rendered-combat-ship-v1/manifest.json'],
  [REVIEW_CONTENT_VERSION, DEVELOPMENT_PACK_URL],
]);

const appRoot = document.querySelector<HTMLElement>('#app');
if (!appRoot) {
  throw new Error('Application root is missing.');
}
const root: HTMLElement = appRoot;
let settingsApplication: SettingsApplication | null = null;
const settingsView = new WorkspaceSettingsView(() => settingsApplication);

const lock = new WorkspaceWriteLock(crypto.randomUUID());
let ownsWorkspace = false;
let application: WorkspaceApplication | null = null;
let contentApplication: ContentPackApplication | null = null;
let runApplication: RunApplication | null = null;
let workspaceRepository: DexieWorkspaceRepository | null = null;
let stopPreRun: (() => void) | null = null;
let stopBuild: (() => void) | null = null;
let stopAttempt: (() => void) | null = null;
let stopResults: (() => void) | null = null;
let stopReview: (() => void) | null = null;
let screenEpoch = 0;
let contentCandidateMessage: string | null = null;
const pendingStartRequests = new Map<string, StartRunRequest>();
let updateBoundary: 'none' | 'entry' | 'build' = 'none';
let updateBuild: BuildApplication | null = null;
let entryOperations = 0;
let contentRetryPending = false;
let localContentReady = false;
let applyingUpdate = false;
const offlineRuntime = import.meta.env.PROD ? new BrowserOfflineRuntime() : null;
const offlineView = offlineRuntime ? new OfflineStatusView(root, offlineRuntime,
  () => localContentReady, canApplyUpdate, applyAppUpdate) : null;

function canApplyUpdate(): boolean {
  return ownsWorkspace && localContentReady && !applyingUpdate && entryOperations === 0 && pendingStartRequests.size === 0
    && !settingsApplication?.hasPendingSave() && !document.querySelector('dialog[open]')
    && (updateBoundary === 'entry' || (updateBoundary === 'build' && !!updateBuild?.canHoldForAppUpdate()));
}

async function applyAppUpdate(): Promise<void> {
  if (!offlineRuntime || !canApplyUpdate()) return;
  const release = updateBoundary === 'build' ? updateBuild!.holdForAppUpdate() : () => {};
  applyingUpdate = true;
  root.inert = true;
  let reloading = false;
  try {
    if (await offlineRuntime.activateWaiting()) {
      reloading = true;
      window.location.reload();
    }
  } finally {
    if (!reloading) { release(); applyingUpdate = false; root.inert = false; offlineView?.render(); }
  }
}

function page(content: string): void {
  updateBoundary = 'none'; updateBuild = null;
  settingsView.dismiss();
  stopReview?.(); stopReview = null;
  stopResults?.(); stopResults=null;
  stopAttempt?.(); stopAttempt=null;
  stopBuild?.();
  stopBuild = null;
  stopPreRun?.();
  stopPreRun = null;
  screenEpoch += 1;
  root.innerHTML = `<div class="shell"><section class="panel">${content}</section></div>`;
  settingsView.attach(root);
}

function renderLoading(message: string): void {
  page(`<h1>CrossDefense</h1><p class="muted" data-testid="loading">${escapeHtml(message)}</p>`);
}

function renderRecovery(message: string): void {
  localContentReady = false;
  page(`
    <h1>Workspace recovery</h1>
    <p class="error" data-testid="recovery-message">${escapeHtml(message)}</p>
    <p class="muted">Your existing local data has not been replaced with a new Workspace.</p>
    <div class="actions"><button class="primary" data-testid="retry-storage">Retry storage</button></div>
  `);
  root.querySelector<HTMLButtonElement>('[data-testid="retry-storage"]')?.addEventListener('click', () => {
    void bootstrap();
  });
}

function renderOwnershipBlocked(ownerId: string | null): void {
  page(`
    <h1>Workspace is active in another tab</h1>
    <p data-testid="ownership-blocked">Only one browser tab can write to this local Workspace at a time.</p>
    <p class="muted">${ownerId ? `Current owner: ${escapeHtml(ownerId)}` : 'Close the active tab, then retry.'}</p>
    <div class="actions"><button class="primary" data-testid="retry-ownership">Retry ownership</button></div>
  `);
  root.querySelector<HTMLButtonElement>('[data-testid="retry-ownership"]')?.addEventListener('click', () => {
    void bootstrap();
  });
}

function avatarLabel(avatarId: StockAvatarId): string {
  return avatarId.replace('pilot-', '').toUpperCase();
}

function renderChooser(projection: PilotChooserProjection): void {
  const pilots = projection.pilots
    .map(
      (pilot) => `
        <article class="pilot-card" data-testid="pilot-card" data-pilot-id="${pilot.pilotId}">
          <div class="avatar" aria-hidden="true">${avatarLabel(pilot.avatarId)}</div>
          <div>
            <strong>${escapeHtml(pilot.nickname)}</strong>
            <div class="muted">${pilot.avatarId}</div>
          </div>
          <button class="secondary" data-action="continue" data-pilot-id="${pilot.pilotId}">Continue</button>
        </article>
      `,
    )
    .join('');

  const avatarOptions = STOCK_AVATARS.map(
    (avatar) => `<option value="${avatar}">${avatarLabel(avatar)}</option>`,
  ).join('');

  page(`
    <h1>Pilot chooser</h1>
    <p class="muted">Create a local Pilot or explicitly continue an existing one.</p>
    <div class="pilot-list" data-testid="pilot-list">${pilots || '<p class="muted">No Pilots yet.</p>'}</div>
    <form class="form-grid" data-testid="create-pilot-form">
      <label>Nickname<input name="nickname" autocomplete="off" required /></label>
      <label>Stock avatar<select name="avatarId">${avatarOptions}</select></label>
      <button class="primary" type="submit" data-testid="create-pilot">Create Pilot</button>
      <div class="status" data-testid="command-status"></div>
    </form>
  `);

  updateBoundary = 'entry';
  const form = root.querySelector<HTMLFormElement>('[data-testid="create-pilot-form"]');
  let pending = false;
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !application) return;
    pending = true;
    entryOperations += 1;
    const button = root.querySelector<HTMLButtonElement>('[data-testid="create-pilot"]');
    const status = root.querySelector<HTMLElement>('[data-testid="command-status"]');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Saving Pilot...';

    const data = new FormData(form);
    try {
      const result = await application.createPilot({
        operationId: crypto.randomUUID(),
        nickname: String(data.get('nickname') ?? ''),
        avatarId: String(data.get('avatarId')) as StockAvatarId,
      });
      renderChooser(result.chooser);
    } catch (error) {
      pending = false;
      if (button) button.disabled = false;
      if (status) status.textContent = error instanceof Error ? error.message : String(error);
    } finally { entryOperations -= 1; }
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="continue"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!application) return;
      const pilotId = button.dataset.pilotId;
      if (!pilotId || applyingUpdate) return;
      entryOperations += 1; updateBoundary = 'none';
      try {
        const next = await application.continuePilot(pilotId);
        if (!next.activePilot) throw new Error('No active Pilot was selected.');
        await renderPilotRun(next.activePilot);
      } catch (error) {
        renderRecovery(error instanceof Error ? error.message : String(error));
      } finally { entryOperations -= 1; }
    });
  });
}

async function renderPilotRun(pilot: PilotProfile): Promise<void> {
  const epoch = screenEpoch;
  if (!runApplication || !contentApplication) {
    renderContentUnavailable(pilot, 'Content runtime is unavailable.');
    return;
  }

  try {
    const projection = await runApplication.getRunProjection(pilot.pilotId);
    if (epoch !== screenEpoch) return;
    if (projection.kind === 'no-run') {
      const pack = await contentApplication.getActivePack();
      if (epoch !== screenEpoch) return;
      if (!pack) {
        renderContentUnavailable(
          pilot,
          contentCandidateMessage ?? 'No validated development Content Pack is active.',
        );
        return;
      }
      renderNewRun(pilot, pack.contentVersion, pack.compatibleRuleset, pack.preRun.collectionQuota, pack.preRun.starterObjective.targetWord);
      return;
    }

    await renderRunProjection(pilot, projection);
  } catch (error) {
    if (epoch === screenEpoch) renderRecovery(error instanceof Error ? error.message : String(error));
  }
}

function renderNewRun(
  pilot: PilotProfile,
  contentVersion: string,
  rulesetVersion: string,
  quota: number,
  targetWord: string,
): void {
  page(`
    <h1>New Run</h1>
    <p><strong>${escapeHtml(pilot.nickname)}</strong> can start a Run using the validated development Content Pack.</p>
    <p class="identity" data-testid="active-pilot-id">${escapeHtml(pilot.pilotId)}</p>
    ${contentCandidateMessage ? `<p class="muted" data-testid="content-candidate-warning">${escapeHtml(contentCandidateMessage)}</p>` : ''}
    <dl class="facts">
      <div><dt>Content</dt><dd data-testid="start-content-version">${escapeHtml(contentVersion)}</dd></div>
      <div><dt>Ruleset</dt><dd data-testid="start-ruleset-version">${escapeHtml(rulesetVersion)}</dd></div>
      <div><dt>Collection quota</dt><dd data-testid="start-quota">${quota}</dd></div>
      <div><dt>Starter objective</dt><dd data-testid="start-objective">${escapeHtml(targetWord)} with a Weapon Tile</dd></div>
    </dl>
    <div class="actions">
      <button class="primary" data-testid="start-run">Start Run</button>
      <button class="secondary" data-testid="back-to-pilots">Back to Pilots</button>
    </div>
    <div class="status" data-testid="run-command-status"></div>
  `);

  updateBoundary = 'entry';
  const request = pendingStartRequests.get(pilot.pilotId) ?? { operationId: crypto.randomUUID(), pilotId: pilot.pilotId };
  let pending = false;
  root.querySelector<HTMLButtonElement>('[data-testid="start-run"]')?.addEventListener('click', async () => {
    if (pending || !runApplication || applyingUpdate) return;
    pending = true; entryOperations += 1; updateBoundary = 'none';
    const button = root.querySelector<HTMLButtonElement>('[data-testid="start-run"]');
    const status = root.querySelector<HTMLElement>('[data-testid="run-command-status"]');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Starting Run...';
    const back = root.querySelector<HTMLButtonElement>('[data-testid="back-to-pilots"]');
    if (back) back.disabled = true;
    pendingStartRequests.set(pilot.pilotId, request);

    try {
      const projection = await runApplication.startRun(request);
      pendingStartRequests.delete(pilot.pilotId);
      if (projection.kind === 'no-run') {
        throw new Error('Start Run returned no active Run.');
      }
      await renderRunProjection(pilot, projection);
    } catch (error) {
      if (back) back.disabled = false;
      pending = false;
      if (button) button.disabled = false;
      if (status) status.textContent = error instanceof Error ? error.message : String(error);
      updateBoundary = 'entry';
    } finally { entryOperations -= 1; }
  });

  bindBackToPilots();
}

async function enterSalvage(pilot: PilotProfile): Promise<void> {
  if (!workspaceRepository || !contentApplication) throw new Error('Pre-Run storage is not ready.');
  renderLoading('Opening the saved Pre-Run pool...');
  const epoch = screenEpoch;
  try {
    const preRun = new PreRunApplication(workspaceRepository, contentApplication, () => crypto.randomUUID());
    await preRun.open(pilot.pilotId);
    if (epoch !== screenEpoch) return;
    stopPreRun = mountPreRun(root, preRun,
      async () => { if (application) renderChooser(await application.getPilotChooser()); },
      async () => { await renderPilotRun(pilot); }, settingsView);
  } catch (error) {
    if (epoch === screenEpoch) renderRecovery(error instanceof Error ? error.message : String(error));
  }
}

async function enterBuild(pilot: PilotProfile): Promise<void> {
  if (!workspaceRepository || !contentApplication) { renderRecovery('Build storage is not ready.'); return; }
  renderLoading('Opening the saved Build and its pinned content...');
  const epoch = screenEpoch;
  try {
    const build = new BuildApplication(workspaceRepository, contentApplication);
    const result = await build.open(pilot.pilotId);
    if (epoch !== screenEpoch) return;
    if (result.kind === 'build-content-required') {
      const tiles = retainedTiles(result.run);
      page(`<h1>Build Phase</h1><p data-testid="build-content-required">${escapeHtml(result.message)}</p>
        <p data-testid="starter-complete">Pre-Run is complete. All retained tiles remain saved.</p>
        <p class="identity" data-testid="active-pilot-id">${escapeHtml(pilot.pilotId)}</p>
        <p class="identity" data-testid="run-id">${escapeHtml(result.run.runId)}</p>
        <p data-testid="build-content-version">${escapeHtml(result.run.contentVersion)}</p><p data-testid="build-ruleset-version">${escapeHtml(result.run.rulesetVersion)}</p>
        <p data-testid="build-collected-tiles">${tiles.map(tile => escapeHtml(tile.letter + ' / ' + tile.subtype)).join(', ')}</p>
        <p>Retained tiles: <strong data-testid="build-collected-count">${tiles.length}</strong></p>
        <p class="muted">Use a new Pilot/Run for the development Build pack. Existing Runs are never silently migrated.</p>
        <button class="secondary" data-testid="back-to-pilots">Back to Pilots</button>`);
      bindBackToPilots();
      return;
    }
    await showBuild(pilot, build);
  } catch (error) {
    if (epoch === screenEpoch) renderRecovery(error instanceof Error ? error.message : String(error));
  }
}

async function showBuild(pilot:PilotProfile,build:BuildApplication): Promise<void> {
  if(!workspaceRepository || !contentApplication) throw Error('Results storage is not ready.');
  const epoch=screenEpoch;
  const review = new ReviewApplication(workspaceRepository, contentApplication, ()=>crypto.randomUUID());
  try { await review.recover(pilot.pilotId); }
  catch (error) {
    if (epoch === screenEpoch) renderReviewRecovery(pilot, build, review, error);
    return;
  }
  const results = await workspaceRepository.getResults(pilot.pilotId);
  const pack = await contentApplication.getPack(results.run.contentVersion, results.run.rulesetVersion);
  const dueCount = review.dueCount();
  if(epoch!==screenEpoch)return;
  page('');
  stopBuild=mountBuild(root,build,async()=>{if(application)renderChooser(await application.getPilotChooser());},async()=>{
    if(!workspaceRepository||!contentApplication) throw Error('Map storage is not ready.');
    renderLoading('Loading saved Map selection...'); const epoch=screenEpoch;
    try {
      const attempts=new AttemptApplication(workspaceRepository,contentApplication,()=>crypto.randomUUID(),undefined,build,workspaceRepository);
      const selection=await attempts.selection(pilot.pilotId);
      if(epoch!==screenEpoch) return;
      stopAttempt=mountMapSelection(root,attempts,selection,{back:async()=>showBuild(pilot,build),started:async run=>{
        if(run.phase==='attempt') showDiagnostic(pilot,run,attempts); else await enterBuild(pilot);
      }});
      settingsView.attach(root);
    } catch(error) {
      // The previous Build view is already disposed; the new screen owns this failure.
      if(epoch===screenEpoch) renderRecovery(error instanceof Error?error.message:String(error));
    }
  },{open:async()=>enterResults(pilot),salvage:async()=>enterPostSalvage(pilot),credits:results.economy.credits,celestium:results.economy.celestium,unsettled:results.outcomes.filter(row=>!row.settlement).length,lastSettled:results.outcomes.some(row=>row.outcome.attemptId===results.run.attempt?.attemptId&&!!row.settlement)}, pack?.review ? { dueCount, open: async()=>enterReview(pilot) } : undefined);
  updateBuild = build; updateBoundary = 'build';
  settingsView.attach(root);
}
function renderReviewRecovery(pilot: PilotProfile, build: BuildApplication, review: ReviewApplication, error: unknown): void {
  page(`<h1>Review recovery</h1><p class="error" data-testid="review-recovery-error">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
    <p>Your settled results and saved learning evidence are preserved. Finish preparing due Review before returning to Build.</p>
    <button class="primary" data-testid="retry-review-recovery">Retry Review preparation</button>`);
  const epoch = screenEpoch;
  const retry = root.querySelector<HTMLButtonElement>('[data-testid="retry-review-recovery"]')!;
  retry.addEventListener('click', () => {
    if (retry.disabled) return;
    retry.disabled = true;
    void (async () => {
      try {
        if (review.hasPendingSave()) await review.retry();
        else await review.recover(pilot.pilotId);
        if (epoch === screenEpoch) await showBuild(pilot, build);
      } catch (next) {
        if (epoch === screenEpoch) renderReviewRecovery(pilot, build, review, next);
      }
    })();
  });
  retry.focus();
}
async function enterCombat(pilot:PilotProfile,run:ActiveRun):Promise<void>{
  if(!workspaceRepository||!run.attempt){renderRecovery('Combat storage is not ready.');return;}
  renderLoading('Opening the acknowledged combat Attempt...');const epoch=screenEpoch;
  try{
    const combat=new CombatApplication(workspaceRepository,()=>crypto.randomUUID());
    await combat.open(pilot.pilotId,run.attempt.attemptId);
    if(epoch!==screenEpoch)return;
    const pack=hasRenderAssets(run.contentVersion)?await contentApplication?.getPack(run.contentVersion,run.rulesetVersion):undefined;
    if(epoch!==screenEpoch)return;
    if(hasRenderAssets(run.contentVersion)&&(!pack||pack.integrity.manifestSha256!==run.attempt.startup.contentDigest))throw Error('The acknowledged Attempt requires its exact pinned render pack.');
    stopAttempt=mountCombat(root,combat,async()=>enterBuild(pilot),pack??undefined,async()=>enterResults(pilot,run.attempt!.attemptId),settingsView);
  }catch(error){if(epoch===screenEpoch)renderRecovery(error instanceof Error?error.message:String(error));}
}
function showDiagnostic(pilot:PilotProfile,run:ActiveRun,attempts?:AttemptApplication): void {
  if(run.attempt?.startup.capability==='combat'){void enterCombat(pilot,run);return;}
  if(!workspaceRepository||!contentApplication) throw Error('Attempt storage is not ready.');
  page('');
  const app=attempts??new AttemptApplication(workspaceRepository,contentApplication,()=>crypto.randomUUID());
  stopAttempt=mountAttemptDiagnostic(root,app,run,async()=>enterBuild(pilot));
  settingsView.attach(root);
}


async function enterResults(pilot:PilotProfile,attemptId?:string):Promise<void>{
  if(!workspaceRepository||!contentApplication){renderRecovery('Results storage is not ready.');return;}
  renderLoading('Opening saved outcomes and acknowledged balances...');const epoch=screenEpoch;
  try{
    const results=new ResultsApplication(workspaceRepository,()=>crypto.randomUUID());
    const state=await results.open(pilot.pilotId);
    const pack=await contentApplication.getPack(state.run.contentVersion,state.run.rulesetVersion);
    if(epoch!==screenEpoch)return;
    const review = pack?.review ? new ReviewApplication(workspaceRepository, contentApplication, ()=>crypto.randomUUID()) : null;
    stopResults=mountResults(root,results,{back:async()=>enterBuild(pilot),salvage:async()=>enterPostSalvage(pilot),
      ...(review ? { review: { app: review, open: async()=>showReview(pilot, review) } } : {})},attemptId,pack??undefined);
    settingsView.attach(root);
  }catch(error){if(epoch===screenEpoch)renderRecovery(error instanceof Error?error.message:String(error));}
}
function showReview(pilot: PilotProfile, review: ReviewApplication): void {
  page('');
  stopReview = mountReview(root, review, async()=>enterBuild(pilot));
  settingsView.attach(root);
}
async function enterReview(pilot: PilotProfile): Promise<void> {
  if (!workspaceRepository || !contentApplication) { renderRecovery('Review storage is not ready.'); return; }
  renderLoading('Opening saved due Review...'); const epoch = screenEpoch;
  try {
    const review = new ReviewApplication(workspaceRepository, contentApplication, ()=>crypto.randomUUID());
    await review.open(pilot.pilotId);
    if (epoch === screenEpoch) showReview(pilot, review);
  } catch (error) { if (epoch === screenEpoch) renderRecovery(error instanceof Error ? error.message : String(error)); }
}
async function enterPostSalvage(pilot:PilotProfile):Promise<void>{
  if(!workspaceRepository||!contentApplication){renderRecovery('Salvage storage is not ready.');return;}
  renderLoading('Opening current Cargo and unresolved Salvage...');const epoch=screenEpoch;
  try{
    const salvage=new SalvageApplication(workspaceRepository,contentApplication,()=>crypto.randomUUID());
    await salvage.open(pilot.pilotId);if(epoch!==screenEpoch)return;
    stopResults=mountSalvage(root,salvage,{back:async()=>enterBuild(pilot),applied:async()=>enterBuild(pilot)});
    settingsView.attach(root);
  }catch(error){if(epoch===screenEpoch)renderRecovery(error instanceof Error?error.message:String(error));}
}

async function renderRunProjection(pilot: PilotProfile, projection: Exclude<RunProjection, { kind: 'no-run' }>): Promise<void> {
  if (projection.kind === 'build') { await enterBuild(pilot); return; }
  if (projection.kind === 'attempt') { showDiagnostic(pilot,projection.run); return; }
  if (projection.kind === 'content-required') {
    page(`
      <h1>Content Required</h1>
      <p data-testid="content-required">This Run is preserved, but its pinned Content Pack is unavailable.</p>
      <p class="identity" data-testid="active-pilot-id">${escapeHtml(pilot.pilotId)}</p>
      <dl class="facts">
        <div><dt>Run</dt><dd data-testid="run-id">${escapeHtml(projection.run.runId)}</dd></div>
        <div><dt>Required content</dt><dd data-testid="missing-content-version">${escapeHtml(projection.missingContentVersion)}</dd></div>
        <div><dt>Ruleset</dt><dd>${escapeHtml(projection.run.rulesetVersion)}</dd></div>
      </dl>
      <div class="actions">
        <button class="primary" data-testid="retry-content">Retry content</button>
        <button class="secondary" data-testid="back-to-pilots">Back to Pilots</button>
      </div>
    `);
    bindContentRetry(pilot);
    bindBackToPilots();
    return;
  }

  page(`
    <h1>Pre-Run Salvage</h1>
    <p data-testid="pre-run-objective">Collect a viable starter for <strong>${escapeHtml(projection.run.starterObjective.targetWord)}</strong> including a Weapon Tile.</p>
    <p class="identity" data-testid="active-pilot-id">${escapeHtml(pilot.pilotId)}</p>
    <dl class="facts">
      <div><dt>Run</dt><dd data-testid="run-id">${escapeHtml(projection.run.runId)}</dd></div>
      <div><dt>Content</dt><dd data-testid="run-content-version">${escapeHtml(projection.run.contentVersion)}</dd></div>
      <div><dt>Ruleset</dt><dd data-testid="run-ruleset-version">${escapeHtml(projection.run.rulesetVersion)}</dd></div>
      <div><dt>Remaining quota</dt><dd data-testid="quota-remaining">${projection.run.quota.remaining} / ${projection.run.quota.total}</dd></div>
    </dl>
    <p class="muted">Collect Letter Tiles by clearing their payload cells. Previously committed tiles and quota are preserved.</p>
    <div class="actions"><button class="primary" data-testid="begin-salvage">Continue Salvage</button><button class="secondary" data-testid="back-to-pilots">Back to Pilots</button></div>
  `);
  root.querySelector<HTMLButtonElement>('[data-testid="begin-salvage"]')?.addEventListener('click', () => { void enterSalvage(pilot); });
  bindBackToPilots();
}

function renderContentUnavailable(pilot: PilotProfile, message: string): void {
  page(`
    <h1>Development content required</h1>
    <p class="error" data-testid="development-content-required">${escapeHtml(message)}</p>
    <p class="identity" data-testid="active-pilot-id">${escapeHtml(pilot.pilotId)}</p>
    <p class="muted">No starter quota, target word, or payload values are invented when the development pack is missing or invalid.</p>
    <div class="actions">
      <button class="primary" data-testid="retry-content">Retry content</button>
      <button class="secondary" data-testid="back-to-pilots">Back to Pilots</button>
    </div>
  `);
  bindContentRetry(pilot);
  bindBackToPilots();
}

function bindContentRetry(pilot: PilotProfile): void {
  const button = root.querySelector<HTMLButtonElement>('[data-testid="retry-content"]');
  if (!button) return;
  button.disabled = contentRetryPending;
  button.addEventListener('click', () => { void retryContent(pilot); });
}

async function retryContent(pilot: PilotProfile): Promise<void> {
  if (contentRetryPending || applyingUpdate) return;
  contentRetryPending = true;
  entryOperations += 1;
  const epoch = screenEpoch;
  const contentOwner = contentApplication;
  const isCurrent = () => epoch === screenEpoch && contentOwner === contentApplication;
  const button = root.querySelector<HTMLButtonElement>('[data-testid="retry-content"]');
  if (button) button.disabled = true;
  try {
    try {
      let recoveredDefaultCandidate: unknown;
      const run = await workspaceRepository?.getActiveRun(pilot.pilotId);
      if (!isCurrent()) return;
      if (run && contentOwner) {
        const pinned = await contentOwner.getPack(run.contentVersion, run.rulesetVersion);
        if (!isCurrent()) return;
        if (!pinned) {
          const url = PINNED_PACK_URLS.get(run.contentVersion);
          if (url) {
            try {
              const response = await fetch(url, { cache: 'no-store' });
              if (!isCurrent()) return;
              if (response.ok) {
                const recovered = await response.json();
                if (!isCurrent()) return;
                const restored = await contentOwner.restorePinned(recovered, run.contentVersion, run.rulesetVersion);
                if (!isCurrent()) return;
                if (!restored.restored) contentCandidateMessage = restored.issues.map(issue => issue.message).join(' ');
                else if (url === DEVELOPMENT_PACK_URL) recoveredDefaultCandidate = recovered;
              }
            } catch (error) {
              if (error instanceof ContentStorageError) throw error;
              if (!isCurrent()) return;
              contentCandidateMessage = error instanceof Error ? error.message : String(error);
            }
          }
        }
      }
      await refreshDevelopmentCandidate(recoveredDefaultCandidate, isCurrent);
    } finally {
      // Navigation cancels later work, but an admitted content write must settle.
      // Reconcile shared readiness even if its originating screen was replaced.
      if (contentOwner === contentApplication) {
        localContentReady = false;
        const ready = !!(await contentOwner?.getActivePack());
        if (contentOwner === contentApplication) localContentReady = ready;
      }
    }
    if (!isCurrent()) return;
    await renderPilotRun(pilot);
  } catch (error) {
    if (isCurrent()) renderRecovery(error instanceof Error ? error.message : String(error));
  } finally {
    contentRetryPending = false;
    entryOperations -= 1;
    const currentRetry = root.querySelector<HTMLButtonElement>('[data-testid="retry-content"]');
    if (currentRetry) currentRetry.disabled = false;
    offlineView?.render();
  }
}

function bindBackToPilots(): void {
  root.querySelector<HTMLButtonElement>('[data-testid="back-to-pilots"]')?.addEventListener('click', async () => {
    if (!application || applyingUpdate) return;
    // Cancel the originating screen before the chooser read can yield.
    renderLoading('Opening the Pilot chooser...');
    const epoch = screenEpoch;
    try {
      const chooser = await application.getPilotChooser();
      if (epoch === screenEpoch) renderChooser(chooser);
    } catch (error) {
      if (epoch === screenEpoch) renderRecovery(error instanceof Error ? error.message : String(error));
    }
  });
}

async function refreshDevelopmentCandidate(
  recoveredDefaultCandidate?: unknown,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  const contentOwner = contentApplication;
  if (!contentOwner || !isCurrent()) return;

  try {
    // A same-default Retry already fetched this body. Revalidate it through the
    // normal activation owner without downloading an identical body a second time.
    let candidate = recoveredDefaultCandidate;
    if (candidate === undefined) {
      const response = await fetch(DEVELOPMENT_PACK_URL, { cache: 'no-store' });
      if (!isCurrent()) return;
      if (!response.ok) {
        contentCandidateMessage = `Development Content Pack request failed: ${response.status}.`;
        return;
      }
      candidate = await response.json();
    }
    if (!isCurrent()) return;
    const result = await contentOwner.activateCandidate(candidate);
    if (!isCurrent()) return;
    contentCandidateMessage = result.activated
      ? null
      : result.issues.map((issue) => `${issue.code}: ${issue.message}`).join(' ');
  } catch (error) {
    if (error instanceof ContentStorageError) throw error;
    if (isCurrent()) contentCandidateMessage = error instanceof Error ? error.message : String(error);
  }
}

function escapeHtml(value: string): string {
  const span = document.createElement('span');
  span.textContent = value;
  return span.innerHTML;
}

async function bootstrap(): Promise<void> {
  renderLoading('Checking local Workspace ownership and storage...');

  try {
    if (!ownsWorkspace) {
      const ownership = await lock.acquire();
      if (ownership.status === 'unsupported') {
        renderRecovery('This browser does not support the required Workspace ownership API.');
        return;
      }
      if (ownership.status === 'blocked') {
        renderOwnershipBlocked(ownership.ownerId);
        return;
      }
      ownsWorkspace = true;
    }

    const repository = workspaceRepository ?? new DexieWorkspaceRepository();
    workspaceRepository = repository;
    application = new WorkspaceApplication(repository, () => crypto.randomUUID());
    const chooser = await application.bootstrap();
    // A Settings modal may outlive asynchronous recovery; retain its operation owner.
    settingsApplication ??= new SettingsApplication(repository, () => crypto.randomUUID());
    applyPresentationSettings(settingsApplication.hasPendingSave()
      ? settingsApplication.projection()
      : await settingsApplication.open());

    const contentRepository = new LocalStorageContentPackRepository();
    contentApplication = new ContentPackApplication(contentRepository, {
      appVersion: APP_VERSION,
      rulesetVersion: COMBAT_RULESET_VERSION,
      supportedRulesetVersions: [DEVELOPMENT_RULESET_VERSION, BUILD_RULESET_VERSION, ATTEMPT_RULESET_VERSION, COMBAT_RULESET_VERSION],
    });
    runApplication = new RunApplication(repository, contentApplication, () => crypto.randomUUID());

    try {
      await contentApplication.bootstrap();
      await refreshDevelopmentCandidate();
      localContentReady = !!(await contentApplication.getActivePack());
    } catch (error) {
      if (error instanceof ContentStorageError) throw error;
      contentCandidateMessage = error instanceof Error ? error.message : String(error);
    }

    // Bootstrap recovery is independent of content-cache availability and grants nothing.
    await new AttemptApplication(repository,contentApplication,()=>crypto.randomUUID()).recoverAtStartup();
    renderChooser(chooser);
  } catch (error) {
    renderRecovery(error instanceof Error ? error.message : String(error));
  }
}

window.addEventListener('pagehide', () => { stopReview?.();stopReview=null;stopResults?.();stopResults=null;stopAttempt?.();stopAttempt=null;stopBuild?.(); stopBuild = null; stopPreRun?.(); stopPreRun = null; lock.release(); offlineView?.dispose(); offlineRuntime?.dispose(); });
void offlineRuntime?.start();
void bootstrap();
