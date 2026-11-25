import { z } from 'zod';
import { MODULE_SUBTYPES } from '../../domain/content/contentPack';
import { PLAYER_SHIP_ID } from '../../domain/combat/rules';

const Id=z.string().regex(/^[a-z0-9-]+$/).max(100);
const Tile=z.object({letter:z.string().regex(/^[A-Z]$/),subtype:z.enum(MODULE_SUBTYPES)}).strict();
const Money=z.object({credits:z.number().int().min(0).max(1000000),celestium:z.number().int().min(0).max(1000000)}).strict();
export const CombatDefinitionSchema=z.object({
  mapId:Id,playerHull:z.number().int().positive().max(1000000),gapTicks:z.number().int().positive().max(3600),
  encounters:z.array(z.object({
    id:Id.refine(value=>value!==PLAYER_SHIP_ID,'Enemy id player is reserved for the player actor.'),name:z.string().trim().min(1).max(100),boss:z.boolean(),hull:z.number().int().positive().max(1000000),limitTicks:z.number().int().positive().max(36000),
    equipment:z.array(Tile.extend({id:Id,x:z.number().int().min(0).max(4),y:z.number().int().min(0).max(4)})).min(1).max(13),
  }).strict()).length(2),
  payloads:z.array(Tile).length(24),
  rewards:z.object({repeatable:Money,firstClear:Money,firstClearScope:z.literal('pilot-map'),settlement:z.literal('ticket09-only')}).strict(),
}).strict();
