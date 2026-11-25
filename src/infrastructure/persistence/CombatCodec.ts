import { z } from 'zod';
import { DIFFICULTIES } from '../../domain/attempt/rules';
import { CombatDefinitionSchema } from '../../application/content/CombatContentCodec';
const Id=z.string().min(1).refine(value=>value.trim().length>0);
const Timestamp=z.string().refine(value=>Number.isFinite(Date.parse(value)));
const Cause=z.enum(['Hull destroyed','Top-out','Timeout']);
const causeOrder=['Hull destroyed','Top-out','Timeout'];
export const CombatReceiptSchema=z.object({operationId:Id,pilotId:Id,runId:Id,attemptId:Id,kind:z.literal('combat-tick'),fingerprint:Id}).strict();
export const CombatOutcomeSchema=z.object({
  attemptId:Id,pilotId:Id,runId:Id,mapId:Id,difficulty:z.enum(DIFFICULTIES),contentVersion:Id,rulesetVersion:z.literal('development-combat-ruleset-v1'),
  contentDigest:z.string().regex(/^[a-f0-9]{64}$/),seed:Id,
  terminal:z.object({kind:z.enum(['victory','failed','interrupted','abandoned']),causes:z.array(Cause).max(3)}).strict(),
  tick:z.number().int().positive().nullable(),lastCommittedTick:z.number().int().nonnegative(),collectedIds:z.array(Id).max(24),
  rewards:CombatDefinitionSchema.shape.rewards,settlement:z.enum(['pending-ticket09','not-eligible']),recordedAt:Timestamp,
}).strict().refine(outcome=>{
  const {kind,causes}=outcome.terminal;
  return (kind==='victory')===(outcome.settlement==='pending-ticket09')&&
    JSON.stringify(causes)===JSON.stringify(causeOrder.filter(c=>causes.includes(c as typeof causes[number])))&&
    (kind==='failed')===(causes.length>0)&&new Set(outcome.collectedIds).size===outcome.collectedIds.length&&
    outcome.collectedIds.every(id=>id.startsWith(outcome.attemptId+':payload:'))&&
    ((kind==='victory'||kind==='failed')?outcome.tick!==null&&outcome.tick===outcome.lastCommittedTick:outcome.tick===null);
},'Combat outcome identity, terminal cause or unsettled reward status is inconsistent.');
