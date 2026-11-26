import { test, expect } from '@playwright/test';
import { startedCombat } from '../combatFixture';

interface StaticCue {
  id: string;
  kind: string;
  texture: string;
  position: number[];
  size: number;
  opacity: number;
}
interface Effects {
  activeBeams: number;
  activeMissiles: number;
  particles: string[];
  staticCues?: StaticCue[];
}

test('reduced motion replaces projectile travel and animated impact or repair with static factual cues', async ({ page }, info) => {
  test.setTimeout(60000);
  // This controls a browser preference, not Domain state or the renderer's implementation.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/ticket11-motion-fixture', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><body><p>All-nine-subtype reduced-motion presentation fixture. No saved Run or rewards.</p><div id="scene" style="width:1100px;height:580px"></div></body></html>',
  }));
  await page.goto('/ticket11-motion-fixture');
  const result = await page.evaluate(async run => {
    const load = (path: string) => import(path);
    const { FixedCameraRenderer } = await load('/src/presentation/renderer/FixedCameraRenderer.ts');
    const { createCombatSimulation } = await load('/src/domain/combat/simulation.ts');
    const { createCombatShip, stepBattle } = await load('/src/domain/combat/battle.ts');
    const pack = await (await fetch('/content/packs/development-rendered-combat-ship-v1/manifest.json')).json();
    const host = document.getElementById('scene')!;
    const renderer = new FixedCameraRenderer(host, pack, { lost() {}, restored() {}, failed() {} });
    await renderer.ready;
    try {
      const simulation = createCombatSimulation(run);
      const subtypes = ['Ballistic', 'Missile', 'Laser', 'Armor', 'Shield', 'System', 'Engine', 'Power', 'Support'];
      const equipment = subtypes.map((subtype, index) => ({
        id: 'motion-fixture-' + subtype, letter: 'S', subtype,
        x: pack.build.hull.cells[index].x, y: pack.build.hull.cells[index].y, multiplier: 100,
      }));
      simulation.battle.player = createCombatShip('player', 1200, equipment);
      const recent: Array<{ id: string; tick: number; event: { kind: string; source?: string; target?: string } }> = [];
      const view = {
        run, simulation, recentEvents: recent, collected: [], lastCollected: [], outcome: null,
        status: 'playing', pauseReason: null, resumeRemaining: null, error: null,
      };
      const step = () => {
        simulation.battle = stepBattle(simulation.battle, 0);
        const tick = simulation.battle.tick;
        recent.splice(0, recent.length, ...recent.filter(event => tick - event.tick <= 60));
        recent.push(...simulation.battle.events.map((event: { kind: string }, index: number) => ({
          id: tick + ':' + index, tick, event,
        })));
      };
      const capture = () => {
        const before = JSON.stringify(view);
        renderer.render(view);
        return {
          tick: simulation.battle.tick,
          sourceUnchanged: JSON.stringify(view) === before,
          reducedMotion: host.dataset.reducedMotion,
          effects: JSON.parse(host.dataset.renderedEffects ?? '{}') as Effects,
          equipment: JSON.parse(host.dataset.renderedEquipment ?? '[]') as Array<{ id: string; subtype: string }>,
        };
      };

      step();
      const firstFire = capture();
      step();
      const secondFire = capture();

      while (simulation.battle.tick < 37) step();
      // Prepared external injury goes through the real next-tick hit/repair rules.
      simulation.battle.projectiles.push({
        id: 'motion-fixture-injury', source: 'fixture-boundary', target: 'player',
        type: 'Ballistic', amount: 3000000, due: 38,
      });
      step();
      const hitId = recent.find(event => event.tick === 38 && event.event.kind === 'hit' && event.event.source === 'fixture-boundary')?.id;
      const firstHit = capture();
      step();
      const secondHit = capture();

      let repairId: string | undefined;
      for (let count = 0; count < 250 && !repairId; count += 1) {
        step();
        repairId = recent.find(event => event.tick === simulation.battle.tick && event.event.kind === 'repair')?.id;
      }
      const firstRepair = capture();
      step();
      const secondRepair = capture();
      return { firstFire, secondFire, firstHit, secondHit, firstRepair, secondRepair, hitId, repairId };
    } finally {
      renderer.dispose();
    }
  }, startedCombat());

  // Each assertion describes visible allocated effects from real public simulation events.
  expect(result.firstFire.effects.activeMissiles).toBe(0);
  expect(result.secondFire.effects.activeMissiles).toBe(0);
  const fires = result.firstFire.effects.staticCues?.filter(cue => cue.kind === 'fire') ?? [];
  expect(fires.length).toBeGreaterThan(0);
  for (const cue of fires) {
    expect(cue.opacity).toBeGreaterThan(0);
    expect(cue.size).toBeGreaterThan(0);
    expect(result.secondFire.effects.staticCues?.find(next => next.id === cue.id)).toEqual(cue);
  }

  expect(result.hitId).toBeTruthy();
  const hit = result.firstHit.effects.staticCues?.find(cue => cue.id === result.hitId);
  expect(hit?.kind).toBe('hit');
  expect(result.secondHit.effects.staticCues?.find(cue => cue.id === result.hitId)).toEqual(hit);
  expect(result.repairId).toBeTruthy();
  const repair = result.firstRepair.effects.staticCues?.find(cue => cue.id === result.repairId);
  expect(repair?.kind).toBe('repair');
  expect(result.secondRepair.effects.staticCues?.find(cue => cue.id === result.repairId)).toEqual(repair);

  for (const sample of [result.firstFire, result.secondFire, result.firstHit, result.secondHit, result.firstRepair, result.secondRepair]) {
    expect(sample.sourceUnchanged).toBe(true);
    expect(sample.reducedMotion).toBe('true');
    expect(sample.effects.activeMissiles).toBe(0);
    expect(sample.equipment.filter(module => module.id.startsWith('motion-fixture-'))).toHaveLength(9);
  }
  await info.attach('reduced-motion-observations.json', {
    body: JSON.stringify(result, null, 2), contentType: 'application/json',
  });
});
