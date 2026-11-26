import { validatedSettingsCommand, type SettingsRepository, type SettingsState, type SaveSettingsCommand } from './SettingsRepository';
import { validateSettingsForSave, SettingsRejection, type WorkspaceSettings } from '../../domain/workspace/settings';

/** Workspace-scoped settings; presentation receives only acknowledged defensive copies. */
export class SettingsApplication {
  private state: SettingsState | null = null;
  private pending: SaveSettingsCommand | null = null;
  private busy = false;
  constructor(private readonly repository: SettingsRepository, private readonly generateId: () => string) {}

  async open(): Promise<WorkspaceSettings> {
    this.requireIdle();
    this.busy = true;
    try { this.state = structuredClone(await this.repository.getSettings()); return this.projection(); }
    finally { this.busy = false; }
  }
  projection(): WorkspaceSettings {
    if (!this.state) throw new SettingsRejection('NOT_OPEN', 'Open Workspace settings first.');
    return structuredClone(this.state.settings);
  }
  hasPendingSave(): boolean { return this.pending !== null; }
  async save(settings: WorkspaceSettings): Promise<WorkspaceSettings> {
    this.requireIdle();
    if (!this.state) throw new SettingsRejection('NOT_OPEN', 'Open Workspace settings first.');
    const candidate = validateSettingsForSave(settings);
    this.pending = validatedSettingsCommand({ operationId: this.generateId(), expectedRevision: this.state.revision, settings: candidate });
    return this.persist();
  }
  async retry(): Promise<WorkspaceSettings> {
    if (this.busy) throw new SettingsRejection('SAVE_PENDING', 'A Settings operation is still running.');
    if (!this.pending) throw new SettingsRejection('NO_PENDING_SAVE', 'There is no Settings save to retry.');
    return this.persist();
  }
  private requireIdle(): void {
    if (this.pending || this.busy) throw new SettingsRejection('SAVE_PENDING', 'Finish the pending Settings save before another change.');
  }
  private async persist(): Promise<WorkspaceSettings> {
    this.busy = true;
    try {
      const saved = await this.repository.saveSettings(structuredClone(this.pending!));
      this.state = structuredClone(saved); this.pending = null;
      return this.projection();
    } catch (error) {
      // Domain rejection means no uncertain write remains. Reopen to load current settings.
      if (error instanceof SettingsRejection) this.pending = null;
      throw error;
    } finally { this.busy = false; }
  }
}
