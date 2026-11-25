import type { CombatDefinition } from './content';
import type { StarterTile } from '../preRun/salvage';
import { shuffled } from '../preRun/seeded';

export function combatPayloadEntries(attemptId:string,definition:CombatDefinition):StarterTile[] {
  return definition.payloads.map((tile,index)=>({...tile,id:attemptId+':payload:'+index}));
}
/** Separate from shape and payload-cell randomness; definition order establishes stable identities. */
export function combatPayloadPool(attemptId:string,seed:string,definition:CombatDefinition):StarterTile[] {
  return shuffled(combatPayloadEntries(attemptId,definition),seed+':combat-payload-order');
}
