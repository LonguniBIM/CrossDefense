import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {compileDevelopmentPack} from '../../src/application/content/ContentPackCodec';
import {assertAttemptState} from '../../src/domain/attempt/attempt';
import {createBattle} from '../../src/domain/combat/battle';
import {combatPack,startedCombat} from '../combatFixture';

it('AR07-01 authored enemies cannot use the reserved Player actor identity',async()=>{
  const source=JSON.parse(readFileSync('content/authoring/development-combat-ship-v1.json','utf8'));
  source.combat.encounters[0].id='player';
  await expect(compileDevelopmentPack(source,async()=>new Uint8Array())).rejects.toThrow();
});
it('AR07-01 saved startup rejects an enemy alias of the player before simulation or recovery',()=>{
  const run=startedCombat();run.attempt!.startup.combat!.encounters[0]!.id='player';
  expect(()=>assertAttemptState(run)).toThrow(/player/i);
});
it('AR07-01 direct battle construction cannot create two actors with the player identity',()=>{
  const definition=combatPack().combat;definition.encounters[0]!.id='player';
  expect(()=>createBattle(definition,[],'Normal')).toThrow(/player/i);
});
