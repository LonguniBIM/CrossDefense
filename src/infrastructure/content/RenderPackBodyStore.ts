import Dexie from 'dexie';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import { ContentVersionConflictError } from '../../application/content/ContentPackRepository';
import { canonicalStringify } from '../../application/content/ContentPackCodec';

interface Body { version: string; encoded: string; }
/** Replaceable large-body backing only. Active/LKG and immutable identity still have one existing owner. */
export class RenderPackBodyStore {
  private database(): Dexie {
    const db = new Dexie('crossdefense-render-content-bodies');
    db.version(1).stores({bodies:'version'});
    return db;
  }
  async get(version: string): Promise<unknown> {
    const db = this.database();
    try {
      const row = await db.table<Body>('bodies').get(version);
      if (!row) return undefined;
      try { return JSON.parse(row.encoded) as unknown; } catch { return row.encoded; }
    } finally { db.close(); }
  }
  async stage(pack: ContentPackManifest, encoded: string, knownDigest?: string): Promise<void> {
    const db = this.database();
    try {
      const table = db.table<Body>('bodies');
      await db.transaction('rw', table, async () => {
        const current = await table.get(pack.contentVersion);
        if (current && !knownDigest) {
          let same = false;
          try { same = canonicalStringify(JSON.parse(current.encoded)) === encoded; } catch { /* Preserve ambiguous identities. */ }
          if (!same) throw new ContentVersionConflictError('Staged render content has a conflicting immutable identity.');
        }
        await table.put({version:pack.contentVersion, encoded});
      });
    } finally { db.close(); }
  }
}
