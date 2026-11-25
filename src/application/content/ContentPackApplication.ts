import type { ContentPackManifest, ContentPackIssue } from '../../domain/content/contentPack';
import { ContentVersionConflictError, type ContentPackRepository, type ContentPackState } from './ContentPackRepository';
import { validateContentPack, type ContentCompatibility } from './ContentPackCodec';
export type { ContentCompatibility } from './ContentPackCodec';

export interface ContentActivationResult { activated: boolean; state: ContentPackState; issues: ContentPackIssue[]; }

export class ContentPackApplication {
  constructor(private readonly repository: ContentPackRepository, private readonly compatibility: ContentCompatibility) {}

  async bootstrap(): Promise<ContentPackState> {
    await this.repository.initialize();
    return this.repository.getState();
  }

  async activateCandidate(candidate: unknown): Promise<ContentActivationResult> {
    const validation = await validateContentPack(candidate, this.compatibility);
    if (!validation.pack) return { activated: false, state: await this.repository.getState(), issues: validation.issues };
    try {
      return { activated: true, state: await this.repository.activate(validation.pack), issues: [] };
    } catch (error) {
      if (!(error instanceof ContentVersionConflictError)) throw error;
      return { activated: false, state: await this.repository.getState(), issues: [{ code: 'VERSION_CONTENT_CONFLICT', message: error.message }] };
    }
  }

  async restorePinned(candidate: unknown, contentVersion: string, rulesetVersion: string): Promise<{ restored: boolean; issues: ContentPackIssue[] }> {
    const validation = await validateContentPack(candidate, this.compatibility, rulesetVersion);
    if (!validation.pack) return { restored: false, issues: validation.issues };
    if (validation.pack.contentVersion !== contentVersion) return { restored: false, issues: [{ code: 'CONTENT_VERSION_MISMATCH', message: 'The downloaded artifact does not match the pinned version.' }] };
    try { await this.repository.retain(validation.pack); return { restored: true, issues: [] }; }
    catch (error) {
      if (!(error instanceof ContentVersionConflictError)) throw error;
      return { restored: false, issues: [{ code: 'VERSION_CONTENT_CONFLICT', message: error.message }] };
    }
  }

  async getActivePack(): Promise<ContentPackManifest | null> {
    const state = await this.repository.getState();
    return state.activeVersion ? this.getPack(state.activeVersion) : null;
  }

  async getPack(contentVersion: string, pinnedRuleset?: string): Promise<ContentPackManifest | null> {
    const raw = await this.repository.getPack(contentVersion);
    if (raw === undefined) return null;
    const validation = await validateContentPack(raw, this.compatibility, pinnedRuleset);
    const pack = validation.pack;
    if (!pack || pack.contentVersion !== contentVersion) return null;
    const expectedDigest = await this.repository.getExpectedDigest(contentVersion);
    if (expectedDigest !== pack.integrity.manifestSha256) return null;
    return pack;
  }
}
