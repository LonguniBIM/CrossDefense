import type { Difficulty } from '../attempt/rules';
import type { ModuleSubtype } from '../content/contentPack';

export const COMBAT_RULESET_VERSION='development-combat-ruleset-v1';
/** Reserved actor identity shared by content admission and combat routing. */
export const PLAYER_SHIP_ID='player';
export const COMBAT_HZ=60;
export const RESOURCE_SCALE=10000;
export const MITIGATION_K=100*RESOURCE_SCALE;
export const DIFFICULTY_FACTORS: Readonly<Record<Difficulty, Readonly<{hull:number;damage:number;reward:number}>>> = Object.freeze({
  Easy:Object.freeze({hull:75,damage:75,reward:75}), Normal:Object.freeze({hull:100,damage:100,reward:100}),
  Hard:Object.freeze({hull:140,damage:125,reward:150}), Insane:Object.freeze({hull:180,damage:150,reward:225}),
});
export type WeaponKind='Ballistic'|'Missile'|'Laser';
export function isWeapon(type:ModuleSubtype): type is WeaponKind {return type==='Ballistic'||type==='Missile'||type==='Laser';}
export function weaponRule(type:WeaponKind): {cycle:number;flight:number;active:number;damage:number} {
  if(type==='Ballistic') return {cycle:48,flight:6,active:0,damage:8*RESOURCE_SCALE};
  if(type==='Missile') return {cycle:180,flight:24,active:0,damage:36*RESOURCE_SCALE};
  return {cycle:144,flight:0,active:36,damage:216000};
}
export function threatFactor(locks:number): number {
  if(!Number.isSafeInteger(locks)||locks<0)throw Error('Threat needs a nonnegative integer lock count.');
  return 100+10*Math.min(5,Math.floor(locks/20));
}
/** Exact intermediates, positive half-up at a resource boundary. No clamping of overflow. */
export function roundRatio(numerator:bigint,denominator:bigint): number {
  if(numerator<0n||denominator<=0n)throw Error('Invalid positive resource ratio.');
  const value=(2n*numerator+denominator)/(2n*denominator);
  if(value>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Combat resource exceeds safe integer storage.');
  return Number(value);
}
export function scaleAmount(value:number,...hundredths:number[]):number {
  if(!Number.isSafeInteger(value)||value<0||hundredths.some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Combat amounts must be safe nonnegative integers.');
  return roundRatio(hundredths.reduce((n,f)=>n*BigInt(f),BigInt(value)),100n**BigInt(hundredths.length));
}
