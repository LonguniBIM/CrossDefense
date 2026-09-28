/**
 * CrossDefense Technology Selection PoC-1.
 *
 * Question: Can one fixed-step simulation coordinate falling-block lock events,
 * Threat, payload RNG, and deterministic auto-battle while producing the same
 * terminal result across different render frame schedules and a long browser stall?
 *
 * This is throwaway prototype code. It is not production implementation.
 */

const FIXED_STEP_MS = 1000 / 60;
const MAX_CATCH_UP_STEPS = 8;
const SAFE_PAUSE_THRESHOLD_MS = 250;
const MAX_SIM_TICKS = 20_000;

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function deriveSeed(baseSeed, streamName) {
  return fnv1a(`${baseSeed}:${streamName}`) || 1;
}

function createXorShift32(seed) {
  let state = seed >>> 0 || 1;
  return {
    nextUint32() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state;
    },
    nextInt(maxExclusive) {
      return this.nextUint32() % maxExclusive;
    },
  };
}

function stableDigest(value) {
  const json = JSON.stringify(value);
  return fnv1a(json).toString(16).padStart(8, '0');
}

function createAttempt(seed) {
  return {
    tick: 0,
    pieceLocks: 0,
    threat: 0,
    encounterIndex: -1,
    enemyHp: 0,
    hullHp: 140,
    collectedLetters: [],
    terminal: false,
    result: null,
    eventLog: [],
    pieceRng: createXorShift32(deriveSeed(seed, 'piece')),
    payloadRng: createXorShift32(deriveSeed(seed, 'payload')),
  };
}

const ENCOUNTERS = [
  { hp: 44, damageEvery: 30, damage: 3 },
  { hp: 58, damageEvery: 24, damage: 4 },
  { hp: 82, damageEvery: 20, damage: 5 },
];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function startNextEncounter(state) {
  state.encounterIndex += 1;
  if (state.encounterIndex >= ENCOUNTERS.length) {
    state.terminal = true;
    state.result = 'victory';
    state.eventLog.push(['victory', state.tick]);
    return;
  }
  state.enemyHp = ENCOUNTERS[state.encounterIndex].hp;
  state.threat = 0;
  state.eventLog.push(['encounter-start', state.tick, state.encounterIndex]);
}

function lockPiece(state) {
  const pieceKind = state.pieceRng.nextInt(7);
  const letter = LETTERS[state.payloadRng.nextInt(LETTERS.length)];
  state.pieceLocks += 1;
  state.threat += 25;
  state.collectedLetters.push(letter);
  state.eventLog.push(['piece-lock', state.tick, pieceKind, letter]);

  if (state.encounterIndex < 0 && state.threat >= 100) {
    startNextEncounter(state);
  }
}

function applyScheduledInputs(state) {
  // Model deterministic player input normalized to simulation ticks.
  // Every 36 ticks, the current piece locks through a hard-drop-equivalent action.
  if (state.tick > 0 && state.tick % 36 === 0) {
    lockPiece(state);
  }
}

function simulateOneTick(state) {
  if (state.terminal) return;

  state.tick += 1;
  applyScheduledInputs(state);

  if (state.encounterIndex >= 0 && state.encounterIndex < ENCOUNTERS.length) {
    const encounter = ENCOUNTERS[state.encounterIndex];

    // Deterministic ship attack cadence.
    if (state.tick % 6 === 0) {
      state.enemyHp -= 7;
      state.eventLog.push(['ship-hit', state.tick, 7]);
    }

    // Deterministic enemy attack cadence.
    if (state.tick % encounter.damageEvery === 0 && state.enemyHp > 0) {
      state.hullHp -= encounter.damage;
      state.eventLog.push(['enemy-hit', state.tick, encounter.damage]);
      if (state.hullHp <= 0) {
        state.terminal = true;
        state.result = 'failure';
        state.eventLog.push(['failure', state.tick]);
        return;
      }
    }

    if (state.enemyHp <= 0) {
      state.eventLog.push(['encounter-end', state.tick, state.encounterIndex]);
      startNextEncounter(state);
    }
  }
}

function projectTerminalState(state) {
  return {
    tick: state.tick,
    pieceLocks: state.pieceLocks,
    threat: state.threat,
    encounterIndex: state.encounterIndex,
    enemyHp: state.enemyHp,
    hullHp: state.hullHp,
    collectedLetters: state.collectedLetters,
    result: state.result,
    eventLog: state.eventLog,
  };
}

function runWithFrameSchedule({ name, seed, frameDeltas }) {
  const state = createAttempt(seed);
  let accumulator = 0;
  let frameIndex = 0;
  let safePauseCount = 0;
  let droppedBacklogMs = 0;

  while (!state.terminal && state.tick < MAX_SIM_TICKS) {
    const delta = frameIndex < frameDeltas.length
      ? frameDeltas[frameIndex]
      : frameDeltas[frameDeltas.length - 1];
    frameIndex += 1;

    if (delta > SAFE_PAUSE_THRESHOLD_MS) {
      safePauseCount += 1;
      droppedBacklogMs += delta;
      accumulator = 0;
      continue;
    }

    accumulator += delta;
    let steps = 0;
    while (accumulator >= FIXED_STEP_MS && steps < MAX_CATCH_UP_STEPS) {
      simulateOneTick(state);
      accumulator -= FIXED_STEP_MS;
      steps += 1;
      if (state.terminal) break;
    }

    if (steps === MAX_CATCH_UP_STEPS && accumulator >= FIXED_STEP_MS) {
      // Architecture decision: do not spiral trying to replay an unbounded backlog.
      droppedBacklogMs += accumulator;
      accumulator = 0;
      safePauseCount += 1;
    }
  }

  if (!state.terminal) {
    throw new Error(`${name}: simulation did not reach a terminal state`);
  }

  const terminal = projectTerminalState(state);
  return {
    name,
    digest: stableDigest(terminal),
    terminal,
    frameCount: frameIndex,
    safePauseCount,
    droppedBacklogMs: Math.round(droppedBacklogMs),
  };
}

const seed = 0xC0DEFACE;
const schedules = [
  { name: '60-fps', frameDeltas: [1000 / 60] },
  { name: '144-fps', frameDeltas: [1000 / 144] },
  { name: '30-fps', frameDeltas: [1000 / 30] },
  { name: 'jittered', frameDeltas: [7, 11, 22, 17, 9, 31, 14, 16, 8, 19] },
  { name: 'three-second-stall', frameDeltas: [16, 17, 15, 16, 3000, 16, 17, 16, 15] },
];

const results = schedules.map((schedule) => runWithFrameSchedule({
  name: schedule.name,
  seed,
  frameDeltas: schedule.frameDeltas,
}));

const baseline = results[0];
const mismatches = results.filter((result) => result.digest !== baseline.digest);

console.log('CrossDefense PoC-1: Deterministic dual-system simulation');
console.log(`Attempt seed: 0x${seed.toString(16)}`);
for (const result of results) {
  console.log(
    `${result.name.padEnd(20)} digest=${result.digest} result=${result.terminal.result} ` +
    `tick=${result.terminal.tick} locks=${result.terminal.pieceLocks} ` +
    `hullHp=${result.terminal.hullHp} pauses=${result.safePauseCount}`,
  );
}

if (mismatches.length > 0) {
  console.error('FAIL: render schedules changed deterministic terminal state.');
  process.exitCode = 1;
} else {
  console.log(`PASS: all schedules produced identical terminal state digest ${baseline.digest}.`);
}
