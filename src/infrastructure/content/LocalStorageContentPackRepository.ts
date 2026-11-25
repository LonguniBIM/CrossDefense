import { ContentStorageError, ContentVersionConflictError, type ContentPackRepository, type ContentPackState } from '../../application/content/ContentPackRepository';
import { RenderPackBodyStore } from './RenderPackBodyStore';
import { hasRenderAssets } from '../../domain/content/renderAssets';
import { canonicalStringify } from '../../application/content/ContentPackCodec';
import type { ContentPackManifest } from '../../domain/content/contentPack';

const STATE_KEY = 'crossdefense-content-pack-state';
const PACK_PREFIX = 'crossdefense-content-pack:';
interface StoredState extends ContentPackState { digests: Record<string, string>; }

export class LocalStorageContentPackRepository implements ContentPackRepository {
  private readonly bodies = new RenderPackBodyStore();
  constructor(private readonly storage: Storage = globalThis.localStorage) {}

  async initialize(): Promise<void> { this.readState(); }
  async getState(): Promise<ContentPackState> {
    const state = this.readState();
    return { activeVersion: state.activeVersion, lastKnownGoodVersion: state.lastKnownGoodVersion };
  }
  async getExpectedDigest(version: string): Promise<string | undefined> {
    const { digests } = this.readState();
    return Object.hasOwn(digests, version) ? digests[version] : undefined;
  }
  async getPack(version: string): Promise<unknown> {
    const raw = storageOperation(() => this.storage.getItem(PACK_PREFIX + version));
    if (raw === null) {
      if(!hasRenderAssets(version))return undefined;
      try{return await this.bodies.get(version);}catch(error){throw new ContentStorageError('Render content cache could not be read. Retry storage without replacing Player Data.',{cause:error});}
    }
    try { return JSON.parse(raw) as unknown; }
    catch (error) {
      if (error instanceof SyntaxError) return raw; // Invalid content, not unreadable Player Data.
      throw error;
    }
  }

  async activate(pack: ContentPackManifest): Promise<ContentPackState> { return this.publish(pack, true); }
  async retain(pack: ContentPackManifest): Promise<ContentPackState> { return this.publish(pack, false); }

  private async publish(pack: ContentPackManifest, makeActive: boolean): Promise<ContentPackState> {
    const encoded = canonicalStringify(pack);
    const externalBody=hasRenderAssets(pack.contentVersion);
    if(externalBody){
      const state=this.readState(),known=Object.hasOwn(state.digests,pack.contentVersion)?state.digests[pack.contentVersion]:undefined;
      if(known&&known!==pack.integrity.manifestSha256)throw new ContentVersionConflictError('Content version already identifies different bytes.');
      try{await this.bodies.stage(pack,encoded,known);}catch(error){if(error instanceof ContentVersionConflictError)throw error;throw new ContentStorageError('Render content cache could not be staged. Previous content and Player Data are unchanged.',{cause:error});}
    }
    return storageOperation(() => {
      // The Workspace's single writable tab owns activation. There is no await
      // between comparison, candidate staging, and publishing the state pointer.
      const previous = this.readState();
      const known = Object.hasOwn(previous.digests, pack.contentVersion) ? previous.digests[pack.contentVersion] : undefined;
      const raw = this.storage.getItem(PACK_PREFIX + pack.contentVersion);
      if (known && known !== pack.integrity.manifestSha256) throw new ContentVersionConflictError('Content version already identifies different bytes.');
      if (!known && raw !== null) {
        let identical = false;
        try { identical = canonicalStringify(JSON.parse(raw)) === encoded; } catch { /* Unknown identity must not be overwritten. */ }
        if (!identical) throw new ContentVersionConflictError('Stored content has a conflicting or unverifiable version identity.');
      }
      if(!externalBody)this.storage.setItem(PACK_PREFIX + pack.contentVersion, encoded);
      // Approved render body staging completed first. This remains the only active/LKG/digest registry.
      const state: StoredState = {
        activeVersion: makeActive ? pack.contentVersion : previous.activeVersion,
        lastKnownGoodVersion: makeActive ? pack.contentVersion : previous.lastKnownGoodVersion,
        digests: { ...previous.digests, [pack.contentVersion]: pack.integrity.manifestSha256 },
      };
      // A failed publication leaves the prior pointer/identity registry intact.
      // An unreferenced staged candidate can be reused by an identical retry.
      this.storage.setItem(STATE_KEY, JSON.stringify(state));
      return { activeVersion: state.activeVersion, lastKnownGoodVersion: state.lastKnownGoodVersion };
    });
  }

  private readState(): StoredState {
    return storageOperation(() => {
      const raw = this.storage.getItem(STATE_KEY);
      if (raw === null) return { activeVersion: null, lastKnownGoodVersion: null, digests: {} };
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ContentStorageError('Content storage metadata is invalid.');
      const state = value as Record<string, unknown>;
      const isVersion = (entry: unknown) => entry === null || (typeof entry === 'string' && entry.length > 0);
      if (!isVersion(state.activeVersion) || !isVersion(state.lastKnownGoodVersion)) throw new ContentStorageError('Content storage version pointers are invalid.');
      // Older replaceable cache metadata has no identity registry; it is not
      // promoted to trusted content and does not alter authoritative Player Data.
      const digests = state.digests ?? {};
      if (!digests || typeof digests !== 'object' || Array.isArray(digests) || Object.values(digests).some(digest => typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest))) {
        throw new ContentStorageError('Content identity metadata is invalid.');
      }
      return { activeVersion: state.activeVersion as string | null, lastKnownGoodVersion: state.lastKnownGoodVersion as string | null, digests: digests as Record<string, string> };
    });
  }
}

function storageOperation<T>(action: () => T): T {
  try { return action(); }
  catch (error) {
    if (error instanceof ContentStorageError || error instanceof ContentVersionConflictError) throw error;
    throw new ContentStorageError('Content storage could not be read or written. Retry storage without replacing Player Data.', { cause: error });
  }
}

export const CONTENT_PACK_STORAGE_KEYS = { state: STATE_KEY, packPrefix: PACK_PREFIX } as const;
