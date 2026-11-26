import { expect, it } from 'vitest';
import { combatPack, combatBuild, startCommand } from '../combatFixture';
import { CombatApplication } from '../../src/application/combat/CombatApplication';
import { InMemoryAttemptRepository } from '../../src/infrastructure/persistence/InMemoryAttemptRepository';

async function openCombat(): Promise<CombatApplication> {
  const repository = new InMemoryAttemptRepository(), pack = combatPack(), run = combatBuild(pack);
  await repository.createPilot({ operationId: 'pilot', pilot: { pilotId: run.pilotId, nickname: 'Countdown test', avatarId: 'pilot-blue', createdAt: run.startedAt, lastUsedAt: run.startedAt } });
  await repository.createRun({ operationId: 'run', run }); await repository.startAttempt(startCommand(run), pack);
  const app = new CombatApplication(repository, () => 'pause-test-op');
  await app.open(run.pilotId, 'combat-attempt'); return app;
}

it('three requested seconds resume at fractional browser timestamps without advancing either clock', async () => {
  const app = await openCombat(); await app.advance();
  app.pause('Settings overlay'); const stopped = app.projection().simulation;
  app.requestResume();
  // Native RAF timestamps cross a binary exponent boundary after a fractional tick.
  // The caller requests exactly three seconds; subtraction must not add another frame.
  let timestamp = 15000 + 1000 / 60;
  for (let second = 1; second <= 3; second++) {
    const next = timestamp + 1000;
    await app.frame(next - timestamp); timestamp = next;
    expect(app.projection().simulation).toEqual(stopped);
    if (second < 3) expect(app.projection().status).toBe('paused');
  }
  expect(app.projection().status).toBe('playing');
  expect(app.projection().resumeRemaining).toBeNull();
  await app.frame(1000 / 60);
  expect(app.projection().simulation.battle.tick).toBe(stopped.battle.tick + 1);
  expect(app.projection().simulation.board.tick).toBe(stopped.board.tick + 1);
});

it('an unfinished countdown stays paused and a new pause cancels its elapsed progress', async () => {
  const app = await openCombat(); app.pause('Settings'); app.requestResume();
  await app.frame(2999.99);
  expect(app.projection().status).toBe('paused');
  expect(app.projection().simulation.battle.tick).toBe(0); expect(app.projection().simulation.board.tick).toBe(0);
  app.pause('Hidden'); await app.frame(60000);
  expect(app.projection().resumeRemaining).toBeNull(); expect(app.projection().status).toBe('paused');
  app.requestResume(); await app.frame(2999);
  expect(app.projection().status).toBe('paused');
  await app.frame(1); expect(app.projection().status).toBe('playing');
  expect(app.projection().simulation.battle.tick).toBe(0); expect(app.projection().simulation.board.tick).toBe(0);
});
