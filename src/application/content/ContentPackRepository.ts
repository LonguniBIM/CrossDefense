import type { ContentPackManifest } from '../../domain/content/contentPack';

export interface ContentPackState { activeVersion: string | null; lastKnownGoodVersion: string | null; }

/** Replaceable content storage; raw reads must cross runtime validation before use. */
export interface ContentPackRepository {
  initialize(): Promise<void>;
  getState(): Promise<ContentPackState>;
  getPack(contentVersion: string): Promise<unknown>;
  getExpectedDigest(contentVersion: string): Promise<string | undefined>;
  /** Atomically compare immutable identity and publish; preserve previous state on failure. */
  activate(pack: ContentPackManifest): Promise<ContentPackState>;
  /** Restore a validated pinned artifact without changing active/default or Last Known Good pointers. */
  retain(pack: ContentPackManifest): Promise<ContentPackState>;
}

export class ContentVersionConflictError extends Error {}
export class ContentStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = 'ContentStorageError'; }
}
