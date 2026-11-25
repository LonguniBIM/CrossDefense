import {it,expect} from 'vitest';
import {resultFixture,keepAllCommand} from '../resultsFixture';
import {applyCargoResolution} from '../../src/domain/results/salvageResolution';

it('SEC09-01 ended-Attempt buffer values must still match the actual committed payload definition',()=>{
  const {run,pack}=resultFixture();const corrupted=structuredClone(run);corrupted.salvageBuffer![0]!.letter='X';
  expect(()=>applyCargoResolution(corrupted,pack.build!,keepAllCommand(corrupted))).toThrow(/committed|payload|buffer/i);
  expect(applyCargoResolution(run,pack.build!,keepAllCommand(run)).cargo!.tiles).toHaveLength(10);
});
it('SEC09-01 a shape-valid forged payload identity cannot become retained Cargo after an Attempt ends',()=>{
  const {run,pack}=resultFixture();const corrupted=structuredClone(run);corrupted.salvageBuffer![0]!.id='unearned-payload';
  expect(()=>applyCargoResolution(corrupted,pack.build!,keepAllCommand(corrupted))).toThrow(/committed|payload|buffer/i);
});
