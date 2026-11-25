import type { CombatDefinition } from '../combat/content';
import type { ReviewDefinition } from '../review/content';

export const MODULE_SUBTYPES = [
  'Ballistic', 'Missile', 'Laser', 'Armor', 'Shield', 'System', 'Engine', 'Power', 'Support',
] as const;
export type ModuleSubtype = (typeof MODULE_SUBTYPES)[number];
const WEAPON_SUBTYPES = new Set<ModuleSubtype>(['Ballistic', 'Missile', 'Laser']);

export interface ViabilityTile { letter: string; subtype: ModuleSubtype; }
export interface StarterObjective { targetWord: string; requiresWeaponTile: true; }
export interface PreRunContent {
  collectionQuota: number;
  starterObjective: StarterObjective;
  viabilityTiles: ViabilityTile[];
}

/** Self-contained assets for the small development pack, not the final art delivery strategy. */
export interface ContentAsset {
  path: string;
  provenance: string;
  bytes: number;
  sha256: string;
  dataBase64: string;
}

export interface HullCell { x: number; y: number; }
export interface BuildContent {
  hull: { id: string; width: 5; height: 5; cells: HullCell[] };
  supportedSpellings: Array<{ spelling: string; cefr: 'Unknown' }>;
}

export interface LaunchMap { mapId: string; name: string; initiallyAvailable: true; }
export interface LaunchContent { capability: 'launch-recovery-only' | 'combat'; maps: LaunchMap[]; }

export interface ContentPackManifest {
  contentVersion: string;
  schemaVersion: 1 | 2 | 3 | 4 | 5;
  review?: ReviewDefinition | undefined;
  combat?: CombatDefinition | undefined;
  launch?: LaunchContent | undefined;
  build?: BuildContent | undefined;
  compatibleRuleset: string;
  minimumAppVersion: string;
  preRun: PreRunContent;
  assetManifest: ContentAsset[];
  integrity: { algorithm: 'SHA-256'; manifestSha256: string };
}

export type ContentPackIssueCode =
  | 'INVALID_MANIFEST' | 'INCOMPATIBLE_RULESET' | 'MINIMUM_APP_VERSION'
  | 'VERSION_CONTENT_CONFLICT' | 'CONTENT_VERSION_MISMATCH'
  | 'INTEGRITY_MISMATCH' | 'INVALID_ASSET'
  | 'STARTER_QUOTA_TOO_SMALL' | 'STARTER_WORD_UNAVAILABLE' | 'STARTER_WEAPON_MISSING';
export interface ContentPackIssue { code: ContentPackIssueCode; message: string; }

export function validateStarterViability(preRun: PreRunContent): ContentPackIssue[] {
  const issues: ContentPackIssue[] = [];
  const required = countLetters(preRun.starterObjective.targetWord);
  const available = countLetters(preRun.viabilityTiles.map(tile => tile.letter).join(''));
  if (preRun.collectionQuota < preRun.starterObjective.targetWord.length) {
    issues.push({ code: 'STARTER_QUOTA_TOO_SMALL', message: 'Pre-Run collection quota cannot contain the authored starter target word.' });
  }
  if ([...required].some(([letter, count]) => (available.get(letter) ?? 0) < count)) {
    issues.push({ code: 'STARTER_WORD_UNAVAILABLE', message: 'Pre-Run viability tiles cannot construct the authored starter target word.' });
  }
  if (!preRun.viabilityTiles.some(tile => WEAPON_SUBTYPES.has(tile.subtype) && required.has(tile.letter))) {
    issues.push({ code: 'STARTER_WEAPON_MISSING', message: 'The authored starter target word cannot include a Weapon Tile.' });
  }
  return issues;
}

function countLetters(value: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const letter of value) counts.set(letter, (counts.get(letter) ?? 0) + 1);
  return counts;
}
