import { z } from 'zod';
import { CombatDefinitionSchema } from '../../application/content/CombatContentCodec';
import { DIFFICULTIES } from '../../domain/attempt/rules';
import { MODULE_SUBTYPES } from '../../domain/content/contentPack';

const Id=z.string().min(1).refine(value=>value.trim().length>0,'Nonempty identity required.');
const Timestamp=z.string().refine(value=>Number.isFinite(Date.parse(value)),'Valid timestamp required.');
const Cell=z.object({x:z.number().int().min(0).max(4),y:z.number().int().min(0).max(4)}).strict();
export const RetainedTileSchema=z.object({id:Id,letter:z.string().regex(/^[A-Z]$/),subtype:z.enum(MODULE_SUBTYPES)}).strict();
export const AttemptEnvelopeSchema=z.object({
  attemptId:Id,pilotId:Id,runId:Id,mapId:Id,difficulty:z.enum(DIFFICULTIES),seed:Id,appVersion:z.string().regex(/^\d+\.\d+\.\d+$/),
  rulesetVersion:Id,contentVersion:Id,startedAt:Timestamp,status:z.enum(['running','interrupted','abandoned','victory','failed']),endedAt:Timestamp.optional(),
  combatProgress:z.object({revision:z.number().int().min(0).max(25),lastCommittedTick:z.number().int().nonnegative(),collectedIds:z.array(Id).max(24)}).strict().optional(),
  startup:z.object({
    capability:z.enum(['launch-recovery-only','combat']),
    combat:CombatDefinitionSchema.optional(),supportedSpellings:z.array(z.object({spelling:z.string().regex(/^[A-Z]{3,}$/),cefr:z.literal('Unknown')}).strict()).min(1).optional(),contentDigest:z.string().regex(/^[a-f0-9]{64}$/),technologyLevel:z.literal(1),
    hull:z.object({id:Id,width:z.literal(5),height:z.literal(5),cells:z.array(Cell).length(13)}).strict(),
    placements:z.array(z.object({tileId:Id,x:z.number().int().min(0).max(4),y:z.number().int().min(0).max(4)}).strict()).max(13),
    buildRevision:z.number().int().nonnegative(),retainedTiles:z.array(RetainedTileSchema).max(24),
    map:z.object({mapId:Id,name:Id,initiallyAvailable:z.literal(true)}).strict(),
  }).strict(),
}).strict();
export const AttemptReceiptSchema=z.object({
  operationId:Id,pilotId:Id,kind:z.enum(['start-attempt','interrupt-attempt','abandon-attempt','set-difficulty']),fingerprint:Id,
  requestFingerprint:Id.optional(),runId:Id.optional(),attemptId:Id.optional(),
}).strict().refine(value=>value.kind==='set-difficulty' ? value.runId===undefined&&value.attemptId===undefined&&value.requestFingerprint===undefined :
  !!value.runId&&!!value.attemptId&&(value.kind!=='start-attempt'||!!value.requestFingerprint),'Attempt receipt is incomplete.');
