# PoC-1 — Deterministic Dual-System Simulation

## Prototype question

Can one fixed-step simulation coordinate falling-block lock events, Threat, payload RNG, and deterministic auto-battle while producing the same terminal result across different render frame schedules and a long browser stall?

## Scope

This is throwaway prototype code for technology selection. It is not production implementation.

The prototype intentionally does not include:
- browser rendering;
- persistent storage;
- audio;
- UI framework integration;
- production combat formulas;
- production falling-block rules.

It isolates only the simulation-timing and deterministic-replay question.

## Architecture being tested

The prototype models the approved architecture:

- one fixed-step Simulation Clock;
- render schedule independent from simulation truth;
- isolated deterministic RNG streams for pieces and payloads;
- player actions normalized to simulation ticks;
- bounded catch-up;
- long stalls treated as safe pause boundaries instead of unbounded backlog replay.

## Run

From this directory:

```bash
node poc-1.mjs
```

No package installation is required.

## Validation environment

Observed on 2026-09-29 with Node.js v22.16.0.

## Scenarios

The same Attempt seed is executed under:

- nominal 60 FPS frame cadence;
- 144 FPS frame cadence;
- 30 FPS frame cadence;
- jittered frame cadence;
- one simulated three-second browser stall.

## Observed result

All scenarios produced the same terminal state:

```text
Attempt seed: 0xc0deface

60-fps               digest=88da6a92 result=victory tick=306 locks=8 hullHp=109 pauses=0
144-fps              digest=88da6a92 result=victory tick=306 locks=8 hullHp=109 pauses=0
30-fps               digest=88da6a92 result=victory tick=306 locks=8 hullHp=109 pauses=0
jittered             digest=88da6a92 result=victory tick=306 locks=8 hullHp=109 pauses=0
three-second-stall   digest=88da6a92 result=victory tick=306 locks=8 hullHp=109 pauses=1

PASS: all schedules produced identical terminal state digest 88da6a92.
```

## Decision

The architecture assumption is supported:

- fixed-step simulation can remain independent from render FPS;
- seeded isolated RNG streams are sufficient for deterministic replay in this prototype;
- a long browser stall can be treated as a safe pause boundary without changing terminal simulation truth.

This PoC does **not** justify moving simulation to a Web Worker.

The simulation host should remain host-agnostic, and main thread versus Web Worker should be decided only after a browser/rendering performance PoC shows actual contention.

## Remaining uncertainty

- The prototype does not measure real browser scheduling or requestAnimationFrame behavior.
- It does not prove production performance.
- It does not test real user input events or browser visibility events.
- The 60 Hz fixed-step candidate is not yet a final Ruleset/runtime decision.
- The simple RNG implementation is a prototype mechanism, not a selected production RNG algorithm.

## Next validation

Proceed to PoC-3 for browser durability and transaction semantics, then PoC-6 for the shared headless/browser testing toolchain. Browser rendering performance evidence can later decide whether the simulation host remains on the main thread or moves to a Web Worker.
