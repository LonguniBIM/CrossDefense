# Deterministic fixed-step Map Attempt simulation

**Status:** accepted

Falling-block play, Threat, encounter timers, regeneration, and combat share one deterministic fixed-step Simulation Clock. Rendering runs independently and cannot determine gameplay timing.

## Considered Options

- independent puzzle/combat timers;
- frame-delta-driven gameplay;
- one fixed-step simulation with seeded explicit randomness.

## Consequences

Map Attempts use reproducible seeds and separate gameplay RNG streams. Inputs are ordered and applied at tick boundaries. Background/throttled tabs pause rather than catching up elapsed combat time. The simulation remains host-agnostic so main-thread versus Web Worker placement can be decided by PoC evidence.
