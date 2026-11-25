import { z } from 'zod';
import { assertRenderAssets } from '../../domain/content/renderAssets';
import { CombatDefinitionSchema } from './CombatContentCodec';
import { assertCombatDefinition, type CombatDefinition } from '../../domain/combat/content';
import { COMBAT_RULESET_VERSION } from '../../domain/combat/rules';
import { assertReviewDefinition, type ReviewDefinition } from '../../domain/review/content';
import type { BuildContent, LaunchContent } from '../../domain/content/contentPack';
import { ATTEMPT_RULESET_VERSION } from '../../domain/attempt/rules';
import { MODULE_SUBTYPES, validateStarterViability, type ContentPackManifest, type ContentPackIssue } from '../../domain/content/contentPack';

const VersionSchema = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const AssetPathSchema = z.string().min(1).refine(isSafeAssetPath, 'Expected a normalized relative asset path.');
const ProvenanceSchema = z.string().refine(value => value.trim().length > 0, 'Authored provenance is required.');
const BuildSchema = z.object({
  hull: z.object({
    id: z.string().min(1), width: z.literal(5), height: z.literal(5),
    cells: z.array(z.object({ x: z.number().int().min(0).max(4), y: z.number().int().min(0).max(4) }).strict()).length(13),
  }).strict().refine(hull => new Set(hull.cells.map(cell => cell.x + ':' + cell.y)).size === hull.cells.length, 'Hull cells must be unique.'),
  supportedSpellings: z.array(z.object({ spelling: z.string().regex(/^[A-Z]{3,}$/), cefr: z.literal('Unknown') }).strict()).min(1),
}).strict().refine(build => new Set(build.supportedSpellings.map(word => word.spelling)).size === build.supportedSpellings.length, 'Supported spellings must be unique.');
const LaunchSchema = z.object({
  capability: z.enum(['launch-recovery-only','combat']),
  maps: z.array(z.object({ mapId: z.string().regex(/^[a-z0-9-]+$/), name: z.string().trim().min(1).max(100), initiallyAvailable: z.literal(true) }).strict()).length(1),
}).strict();
export const ReviewDefinitionSchema = z.object({
  version: z.string().min(1),
  occurrencePolicy: z.literal('settled-outcome-immediate-due'),
  rewards: z.object({ completionCredits: z.number().int().nonnegative(), independentFirstResponseCredits: z.number().int().nonnegative() }).strict(),
  entries: z.array(z.object({
    id: z.string().min(1), spelling: z.string().regex(/^[A-Z]{3,}$/), partOfSpeech: z.literal('noun'),
    targetSense: z.string().min(1), prompt: z.string().min(1), acceptedAnswers: z.array(z.string()).min(1),
    hints: z.object({ context: z.string().min(1), letter: z.string().min(1), reveal: z.string().min(1) }).strict(),
  }).strict()).min(1).max(3),
}).strict().superRefine((value, context) => {
  try { assertReviewDefinition(value); }
  catch (error) { context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : String(error) }); }
});
const DefinitionSchema = z.object({
  contentVersion: z.string().min(1),
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  review: ReviewDefinitionSchema.optional(),
  combat: CombatDefinitionSchema.optional(),
  launch: LaunchSchema.optional(),
  build: BuildSchema.optional(),
  compatibleRuleset: z.string().min(1),
  minimumAppVersion: VersionSchema,
  preRun: z.object({
    collectionQuota: z.number().int().positive(),
    starterObjective: z.object({ targetWord: z.string().regex(/^[A-Z]{3,}$/), requiresWeaponTile: z.literal(true) }).strict(),
    viabilityTiles: z.array(z.object({ letter: z.string().regex(/^[A-Z]$/), subtype: z.enum(MODULE_SUBTYPES) }).strict()).min(1),
  }).strict(),
}).strict();
function validBuildDefinition(value: { schemaVersion:number; compatibleRuleset:string; launch?:LaunchContent|undefined; combat?:CombatDefinition|undefined; review?:ReviewDefinition|undefined; build?:BuildContent|undefined; preRun:{starterObjective:{targetWord:string}} }): boolean {
  if((value.schemaVersion===5)!==(value.review!==undefined))return false;
  if(value.schemaVersion<4&&value.combat!==undefined)return false;
  if(value.schemaVersion===1)return value.build===undefined&&value.launch===undefined;
  if(!value.build?.supportedSpellings.some(word=>word.spelling===value.preRun.starterObjective.targetWord))return false;
  if(value.schemaVersion===2)return value.launch===undefined;
  if(value.schemaVersion===3)return value.launch?.capability==='launch-recovery-only'&&value.compatibleRuleset===ATTEMPT_RULESET_VERSION;
  if(value.compatibleRuleset!==COMBAT_RULESET_VERSION||value.launch?.capability!=='combat'||!value.combat||value.combat.mapId!==value.launch.maps[0]?.mapId)return false;
  try {
    assertCombatDefinition(value.combat,value.build);
    if(value.review)assertReviewDefinition(value.review,value.build);
    return true;
  } catch {return false;}
}
const AuthoringSchema = DefinitionSchema.extend({
  assets: z.array(z.object({ path: AssetPathSchema, provenance: ProvenanceSchema }).strict()),
}).refine(validBuildDefinition, 'Content schema must match its starter, Build definitions and explicit launch capability.');
const ManifestSchema = DefinitionSchema.extend({
  assetManifest: z.array(z.object({
    path: AssetPathSchema, provenance: ProvenanceSchema,
    bytes: z.number().int().nonnegative(), sha256: DigestSchema, dataBase64: z.string(),
  }).strict()),
  integrity: z.object({ algorithm: z.literal('SHA-256'), manifestSha256: DigestSchema }).strict(),
}).refine(validBuildDefinition, 'Build definitions do not match the content schema or starter.');

export interface ContentCompatibility {
  appVersion: string;
  rulesetVersion: string;
  /** Only runtime Rulesets actually supported by this host may be listed. */
  supportedRulesetVersions?: readonly string[];
}
export interface ContentValidation {
  pack: ContentPackManifest | null;
  issues: ContentPackIssue[];
}

/** Content paths are data, never URLs, absolute paths, traversal, or executable locations. */
export function isSafeAssetPath(value: string): boolean {
  return value.split('/').every(segment => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== '.' && segment !== '..');
}

/** Stable JSON: code-unit key order, original array order, and no platform/time inputs. */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalStringify).join(',') + ']';
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return '{' + Object.keys(object).sort().map(key => JSON.stringify(key) + ':' + canonicalStringify(object[key])).join(',') + '}';
  }
  throw new Error('Content contains a non-JSON value.');
}

export async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = Uint8Array.from(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  }
  return btoa(binary);
}

function hasDuplicatePaths(assets: readonly { path: string }[]): boolean {
  // Case aliases are duplicates on the supported Windows authoring host.
  return new Set(assets.map(asset => asset.path.toLowerCase())).size !== assets.length;
}

export async function compileDevelopmentPack(source: unknown, readAsset: (path: string) => Promise<Uint8Array>): Promise<ContentPackManifest> {
  const { assets, ...definition } = AuthoringSchema.parse(source);
  const viability = validateStarterViability(definition.preRun);
  if (viability.length) throw new Error(viability.map(issue => issue.code + ': ' + issue.message).join('; '));
  if (hasDuplicatePaths(assets)) throw new Error('Duplicate asset paths are not allowed.');
  const assetManifest: ContentPackManifest['assetManifest'] = [];
  for (const asset of [...assets].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)) {
    const bytes = Uint8Array.from(await readAsset(asset.path));
    assetManifest.push({ ...asset, bytes: bytes.length, sha256: await sha256(bytes), dataBase64: encodeBase64(bytes) });
  }
  const payload = { ...definition, assetManifest };
  assertRenderAssets(payload);
  return { ...payload, integrity: { algorithm: 'SHA-256', manifestSha256: await sha256(new TextEncoder().encode(canonicalStringify(payload))) } };
}

export async function validateContentPack(candidate: unknown, compatibility?: ContentCompatibility, expectedRuleset?: string): Promise<ContentValidation> {
  const parsed = ManifestSchema.safeParse(candidate);
  if (!parsed.success) {
    return { pack: null, issues: [{ code: 'INVALID_MANIFEST', message: parsed.error.issues.map(issue => `${issue.path.join('.') || 'manifest'}: ${issue.message}`).join('; ') }] };
  }
  const pack = parsed.data;
  try { assertRenderAssets(pack); } catch (error) { return {pack:null,issues:[{code:'INVALID_ASSET',message:error instanceof Error?error.message:String(error)}]}; }
  const issues = validateStarterViability(pack.preRun);
  if (compatibility) {
    const supported = compatibility.supportedRulesetVersions ?? [compatibility.rulesetVersion];
    const required = expectedRuleset ?? pack.compatibleRuleset;
    if (pack.compatibleRuleset !== required || !supported.includes(required)) {
      issues.push({ code: 'INCOMPATIBLE_RULESET', message: `Ruleset ${required} is unavailable or does not match Content ${pack.contentVersion}.` });
    }
    if (compareVersions(pack.minimumAppVersion, VersionSchema.parse(compatibility.appVersion)) > 0) {
      issues.push({ code: 'MINIMUM_APP_VERSION', message: `Content requires App ${pack.minimumAppVersion}; current App is ${compatibility.appVersion}.` });
    }
  }
  const { integrity, ...payload } = pack;
  if (await sha256(new TextEncoder().encode(canonicalStringify(payload))) !== integrity.manifestSha256) {
    issues.push({ code: 'INTEGRITY_MISMATCH', message: 'Compiled manifest bytes do not match their SHA-256 metadata.' });
  }
  if (hasDuplicatePaths(pack.assetManifest)) issues.push({ code: 'INVALID_ASSET', message: 'Duplicate asset paths are not allowed.' });
  for (const asset of pack.assetManifest) {
    try {
      const decoded = atob(asset.dataBase64);
      // atob returns binary characters. Preallocate instead of materializing a string iterator.
      const bytes = new Uint8Array(decoded.length);
      for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
      if (btoa(decoded) !== asset.dataBase64 || bytes.length !== asset.bytes || await sha256(bytes) !== asset.sha256) {
        issues.push({ code: 'INVALID_ASSET', message: `Asset ${asset.path} has invalid bytes, length, or digest.` });
      }
    } catch {
      issues.push({ code: 'INVALID_ASSET', message: `Asset ${asset.path} is not valid base64 data.` });
    }
  }
  return { pack: issues.length ? null : pack, issues };
}

function compareVersions(left: string, right: string): number {
  const a = left.split('.').map(BigInt);
  const b = right.split('.').map(BigInt);
  for (let index = 0; index < 3; index += 1) {
    if (a[index]! < b[index]!) return -1;
    if (a[index]! > b[index]!) return 1;
  }
  return 0;
}
