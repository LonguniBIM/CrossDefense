import './presentation/styles.css';
import { STOCK_AVATARS, type StockAvatarId } from './domain/workspace/pilot';
import { WorkspaceApplication, type PilotChooserProjection } from './application/workspace/WorkspaceApplication';
import { DexieWorkspaceRepository } from './infrastructure/persistence/DexieWorkspaceRepository';
import { WorkspaceWriteLock } from './infrastructure/workspace/WorkspaceWriteLock';

const appRoot = document.querySelector<HTMLElement>('#app');
if (!appRoot) {
  throw new Error('Application root is missing.');
}
const root: HTMLElement = appRoot;

const lock = new WorkspaceWriteLock(crypto.randomUUID());
let ownsWorkspace = false;
let application: WorkspaceApplication | null = null;

function page(content: string): void {
  root.innerHTML = `<div class="shell"><section class="panel">${content}</section></div>`;
}

function renderLoading(message: string): void {
  page(`<h1>CrossDefense</h1><p class="muted" data-testid="loading">${message}</p>`);
}

function renderRecovery(message: string): void {
  page(`
    <h1>Workspace recovery</h1>
    <p class="error" data-testid="recovery-message">${message}</p>
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
    <p class="muted">${ownerId ? `Current owner: ${ownerId}` : 'Close the active tab, then retry.'}</p>
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

  const form = root.querySelector<HTMLFormElement>('[data-testid="create-pilot-form"]');
  let pending = false;
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !application) return;
    pending = true;
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
    }
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="continue"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!application) return;
      const pilotId = button.dataset.pilotId;
      if (!pilotId) return;
      try {
        const next = await application.continuePilot(pilotId);
        if (!next.activePilot) throw new Error('No active Pilot was selected.');
        renderReady(next.activePilot.pilotId, next.activePilot.nickname, next.activePilot.avatarId);
      } catch (error) {
        renderRecovery(error instanceof Error ? error.message : String(error));
      }
    });
  });
}

function renderReady(pilotId: string, nickname: string, avatarId: StockAvatarId): void {
  page(`
    <h1>Pilot ready</h1>
    <p data-testid="active-pilot"><strong>${escapeHtml(nickname)}</strong> is ready to continue.</p>
    <p class="muted">Avatar: ${avatarId}</p>
    <p class="identity" data-testid="active-pilot-id">${pilotId}</p>
    <div class="actions"><button class="secondary" data-testid="back-to-pilots">Back to Pilots</button></div>
  `);
  root.querySelector<HTMLButtonElement>('[data-testid="back-to-pilots"]')?.addEventListener('click', async () => {
    if (application) renderChooser(await application.getPilotChooser());
  });
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

    const repository = new DexieWorkspaceRepository();
    application = new WorkspaceApplication(repository, () => crypto.randomUUID());
    const projection = await application.bootstrap();
    renderChooser(projection);
  } catch (error) {
    renderRecovery(error instanceof Error ? error.message : String(error));
  }
}

window.addEventListener('pagehide', () => lock.release());
void bootstrap();
