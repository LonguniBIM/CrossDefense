import type { ModuleSubtype } from '../content/contentPack';
import { ATTEMPT_RULESET_VERSION } from '../attempt/rules';
import { COMBAT_RULESET_VERSION } from '../combat/rules';

/** Q7: versioned development Build policy, not Combat rounding or final balance. */
export const BUILD_RULESET_VERSION = 'development-build-ruleset-v1';
export const BUILD_TECHNOLOGY_LEVEL = 1;
export const INITIAL_CARGO_CAPACITY = 24;
const DEMAND: Readonly<Record<ModuleSubtype, number>> = Object.freeze({
  Ballistic: 100, Missile: 200, Laser: 200, Armor: 0, Shield: 200,
  System: 100, Engine: 100, Power: 0, Support: 100,
});
export function supportsBuildRules(version: string): boolean { return version === BUILD_RULESET_VERSION || version === ATTEMPT_RULESET_VERSION || version === COMBAT_RULESET_VERSION; }
export function requireBuildRules(version: string): void {
  if (!supportsBuildRules(version)) throw new Error('The pinned Ruleset does not supply Build numeric policy.');
}
export function wordMultiplier(length: number): number {
  if (length < 3) return 100;
  if (length >= 8) return 240;
  return [120, 135, 155, 180, 210][length - 3]!;
}
export function crossingMultiplier(horizontal: number, vertical: number): number {
  return Math.min(260, Math.max(horizontal, vertical) + 15);
}
/** All results are exact integer hundredths. Consumer demand is never scaled. */
export function tilePower(subtype: ModuleSubtype, multiplier: number): { available: number; required: number } {
  return { available: subtype === 'Power' ? 3 * multiplier : 0, required: DEMAND[subtype] };
}
