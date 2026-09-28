# Testing Strategy

## Primary seam

The primary behavior seam is **headless scenario testing through public Application/Domain use cases**, not browser pixels and not implementation-private functions.

Representative scenario:

```text
Given Pilot P and Run R
When PlaceLetterTile(...)
And StartMapAttempt(...)
And submit ordered gameplay inputs
And advance deterministic simulation
Then the terminal Map result is X
And committed progression is Y
And Retry returns to Build with invariant Z
```

This seam should exercise the same rules used by the browser application.

## Browser integration seam

Use real-browser tests for behavior that depends on browser/platform integration:
- offline launch after initial successful load;
- keyboard input routing;
- page-visibility pause/resume;
- single-tab Workspace Session Lock and stale recovery;
- real durable storage transaction semantics;
- migration/reload recovery;
- browser close/reload during Map Attempt;
- backup export/import;
- cached audio/content availability.

## Persistence testing

Use two tiers:

1. **Fast contract/scenario adapter** for domain/application tests.
2. **Real browser persistence integration** proving atomicity, reload, migration, idempotency, durability barriers, and failure recovery.

Do not treat an in-memory fake as proof that browser persistence is safe.

## Deterministic simulation testing

A reproducibility test should hold constant:
- App/Ruleset/Content versions;
- initial Build/Run state;
- Attempt Seed and RNG streams;
- ordered player inputs.

The terminal outcome and relevant intermediate domain events must match across runs.

## Required regression groups

### Word / Build
- full contiguous sequence only;
- min 3 letters;
- horizontal/vertical only;
- flexible invalid side-sequence behavior;
- duplicate words valid for combat;
- crossing max +0.15, hard cap ×2.60;
- insufficient Power rejects Start Map without mutating the build;
- preview does not mutate durable state.

### Falling-block / Threat
- payload rotates with its cell;
- payload awards only when that cell clears;
- simultaneous payloads award exactly once;
- Hold/Next/Ghost never duplicate payloads;
- piece lock raises Threat;
- line clear does not lower Threat;
- top-out fails the Attempt.

### Combat
- deterministic output from same inputs;
- damage order Engine → System(Missile) → Shield → Armor → Hull;
- Laser counter vs Shield;
- Missile Armor penetration;
- soft counters remain non-exclusive;
- timer prevents stalemate.

### Progression / transactions
- Blueprint + quota atomicity;
- purchase + currency atomicity;
- Map clear + First-Clear + unlock atomicity;
- Review occurrence + reward atomicity;
- OperationId retry does not duplicate progression.

### Lifecycle
- Retry keeps committed eligible loot and resets Attempt state;
- Restart Run resets Run state while preserving Profile progression;
- Abandon keeps committed loot but gives no victory reward;
- browser interruption returns to Build and marks Attempt interrupted.

### Offline / recovery
- all core gameplay remains usable offline after initial load;
- invalid Content Pack cannot replace Last Known Good;
- risky save migration preserves original on failure;
- one corrupt Pilot does not automatically corrupt other valid Pilots;
- secondary tab cannot write.

## Prototype gate

Before production content scale-up, one vertical slice must prove:

```text
Pilot
→ Pre-Run Salvage
→ Build
→ word construction
→ Power validation
→ Falling-block + auto-battle
→ Boss
→ loot
→ optional Review
→ Retry/Replay/Restart
→ save/reload
```

The slice must demonstrate that:
- the learner deliberately forms words;
- word strategy has understandable combat impact;
- failure suggests a meaningful rebuild;
- bad RNG has a recovery path;
- permanent loot is not duplicated or lost;
- spelling use and meaning recall are separate evidence.
