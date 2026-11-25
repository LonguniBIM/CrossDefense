import { ContentVersionConflictError, type ContentPackRepository, type ContentPackState } from '../../application/content/ContentPackRepository';
import { canonicalStringify } from '../../application/content/ContentPackCodec';
import type { ContentPackManifest } from '../../domain/content/contentPack';

export class InMemoryContentPackRepository implements ContentPackRepository {
  private readonly packs = new Map<string, ContentPackManifest>();
  private readonly digests = new Map<string, string>();
  private state: ContentPackState = { activeVersion: null, lastKnownGoodVersion: null };

  async initialize(): Promise<void> {}
  async getState(): Promise<ContentPackState> { return { ...this.state }; }
  async getPack(version: string): Promise<unknown> { return structuredClone(this.packs.get(version)); }
  async getExpectedDigest(version: string): Promise<string | undefined> { return this.digests.get(version); }

  async activate(pack: ContentPackManifest): Promise<ContentPackState> { return this.publish(pack, true); }
  async retain(pack: ContentPackManifest): Promise<ContentPackState> { return this.publish(pack, false); }

  private async publish(pack: ContentPackManifest, makeActive: boolean): Promise<ContentPackState> {
    // No awaits in compare-and-publish: multiple Application instances share this guard.
    const digest = this.digests.get(pack.contentVersion);
    const existing = this.packs.get(pack.contentVersion);
    if ((digest && digest !== pack.integrity.manifestSha256) || (!digest && existing && canonicalStringify(existing) !== canonicalStringify(pack))) {
      throw new ContentVersionConflictError('Content version already identifies different bytes.');
    }
    this.packs.set(pack.contentVersion, structuredClone(pack));
    this.digests.set(pack.contentVersion, pack.integrity.manifestSha256);
    if (makeActive) this.state = { activeVersion: pack.contentVersion, lastKnownGoodVersion: pack.contentVersion };
    return { ...this.state };
  }

  /** Simulates cache eviction; immutable identity survives while Player Data is untouched. */
  removePack(version: string): void { this.packs.delete(version); }
}
