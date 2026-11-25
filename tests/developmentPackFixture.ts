import { createHash } from 'node:crypto';
import type { ContentPackManifest } from '../src/domain/content/contentPack';

// Synthetic fixtures only. These values are never shipped as development content.
// The test encoder uses Node crypto independently of the runtime Web Crypto code.
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, ordered(item)]));
  return value;
}
export function sealFixture(value: Record<string, unknown>): ContentPackManifest {
  const { integrity: _ignored, ...payload } = value;
  return { ...payload, integrity: { algorithm: 'SHA-256', manifestSha256: createHash('sha256').update(JSON.stringify(ordered(payload))).digest('hex') } } as ContentPackManifest;
}
export function syntheticPack(overrides: Record<string, unknown> = {}): ContentPackManifest {
  return sealFixture({
    contentVersion: 'test-content-v1', schemaVersion: 1,
    compatibleRuleset: 'development-ruleset-2026-09-30', minimumAppVersion: '0.1.0',
    preRun: { collectionQuota: 4, starterObjective: { targetWord: 'TEST', requiresWeaponTile: true },
      viabilityTiles: [{ letter: 'T', subtype: 'Ballistic' }, { letter: 'E', subtype: 'Armor' }, { letter: 'S', subtype: 'Power' }, { letter: 'T', subtype: 'Shield' }] },
    assetManifest: [], ...overrides,
  });
}

export class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}
