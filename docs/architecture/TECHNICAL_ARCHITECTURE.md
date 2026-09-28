# Technical Architecture

## Status

Approved through Technical Architecture Q180–Q227. Technology/library choices remain intentionally unresolved.

## Architecture invariants

1. Dependency direction is inward: `Presentation → Application → Domain Core`.
2. Domain Core never imports UI, storage, audio, network, or rendering infrastructure.
3. Infrastructure implements ports needed by Application/Domain.
4. Business logic crosses module boundaries through explicit typed contracts, not a global event bus.
5. Observable domain mutation occurs only through explicit operation boundaries.
6. Domain invariants are enforced in Domain, even when UI pre-validates.
7. Simulation drives presentation; presentation never drives simulation truth.

## Nondeterminism

Inject explicit abstractions for:
- `RandomSource`;
- `WallClock`;
- `IdGenerator`.

Simulation time is a separate deterministic `SimulationClock`.

Each Map Attempt receives a reproducible Attempt Seed. Gameplay randomness is split into independent streams, at least:
- Piece RNG;
- Payload RNG;
- other gameplay-variation RNG only if needed.

Visual-only randomness must never consume gameplay RNG streams.

## Simulation

Use fixed-step domain simulation independent of render FPS.

```text
real elapsed time
→ bounded accumulator
→ N fixed simulation ticks
```

Use bounded catch-up. If lag/throttling exceeds a safe threshold, do not run a huge backlog; pause and require safe resume.

A hidden/frozen tab does not simulate elapsed combat time. `SimulationClock` pauses while `WallClock` continues for review scheduling.

Gameplay input is normalized into ordered commands and applied at deterministic tick boundaries.

Renderer consumes read-only simulation projections/snapshots and may interpolate visually without changing domain truth.

The simulation host is technology-agnostic. It may run on the main thread initially or in a Web Worker if PoC evidence justifies it.

## Attempt startup snapshots

Starting a Map creates immutable inputs:

```text
Build State
  ↓ resolve
ShipCombatSnapshot
  +
MapAttemptDefinitionSnapshot
  +
Attempt Seed / RNG stream setup
  ↓
Fixed-Step Simulation
```

A running Attempt never reads mutable live Build state or hot-reloaded Content Pack values.

## Attempt Envelope

Persist lightweight Attempt metadata for recovery/diagnostics, not exact combat state.

Recommended fields:
- attemptId;
- pilotId;
- runId;
- mapId;
- difficulty;
- seed;
- rulesetVersion;
- contentVersion;
- startedAt;
- status.

If startup finds `status = running`, convert to `interrupted`, keep already committed loot, and return the Run to Build.

## Command execution

Authoritative state-changing commands run through one serialized execution gate.

Expected invalid actions return typed rejections, for example:
- InsufficientCredits;
- InsufficientPower;
- CargoFull;
- UnresolvedSalvage;
- AlreadyCollected.

Unexpected invariant violations, corruption, and persistence faults are exceptional infrastructure/integrity failures.

## Transactions and idempotency

One business outcome that must be all-or-nothing is one Application Unit of Work, even when several aggregates change.

Retryable durable operations use stable `OperationId` values so duplicate retries cannot duplicate progression.

Examples:
- Blueprint collection;
- Map victory / First-Clear;
- Cargo slot purchase;
- technology upgrade;
- scheduled Review reward.

## Durability barrier

Durable gameplay events pause authoritative simulation at a safe boundary until the atomic write completes.

```text
simulation outcome
→ commit request
→ safe simulation pause
→ atomic persistence
→ commit succeeds
→ publish authoritative result
→ resume
```

A line clear containing multiple durable payloads commits them as one transaction when they belong to the same gameplay outcome.

## Persistence domains

Separate:

### Authoritative Player Data
- Workspace;
- Pilots;
- progression;
- Active Run;
- learning/history;
- settings.

### Replaceable Runtime Material
- Content Packs;
- pronunciation/audio assets;
- art/assets;
- offline application resources.

Deleting/replacing a cache must never be equivalent to deleting Player Data.

## Persist canonical inputs, derive outputs

Persist authoritative inputs such as:
- tile identities/positions;
- hull and expansion layout;
- technology levels;
- currencies;
- versions.

Recompute derived values such as:
- active words;
- multipliers;
- Power margin;
- DPS;
- defense ratings.

Caches may exist for performance but are never authoritative truth.

## Numeric policy

Permanent economy/count values are integers.

Derived combat values may be decimal, but Ruleset defines explicit precision/rounding boundaries so results are reproducible.

Do not let arbitrary UI/services choose rounding independently.

## Save schema and migration

Use a root Save Schema Version.

Migration is explicit and sequential:

```text
v1 → v2 → v3 → current
```

Do not infer schema versions from field presence.

Risky migrations use staging:

```text
Current Save
→ recovery snapshot
→ migrate candidate
→ validate invariants
→ activate on PASS
→ preserve original on FAIL
```

## Backup / restore

Workspace backup contains authoritative save state and version references, not full application binaries/audio/content packages.

Restore flow:

```text
select backup
→ parse
→ integrity check
→ schema validation/migration
→ domain invariant validation
→ show summary
→ explicit confirm
→ pre-import recovery snapshot
→ atomic Workspace replacement
```

Do not merge two Workspace economies.

If an imported Active Run references unavailable pinned content, preserve the Profile but suspend that Run as **Content Required** rather than silently restarting or discarding it.

## Corruption isolation

Quarantine the smallest safely identifiable scope. One corrupt Pilot should not automatically destroy access to other valid Pilots. Root-level uncertainty may require Workspace Recovery Mode.

Never silently reset currencies, delete a Pilot, or replace a corrupt Workspace with a blank save.

## Content runtime

Runtime Content Packs are immutable versioned packages. Compilation from authoring sources is deterministic.

A pack manifest records at least:
- contentVersion;
- schemaVersion;
- compatible Ruleset;
- minimum App Version;
- asset manifest;
- integrity metadata.

Old packs are eligible for cleanup only when they are not:
- active default;
- Last Known Good;
- referenced by an Active Run;
- required for supported migration/inspection.

## Startup bootstrap state machine

```text
Boot
→ Acquire Workspace Session Lock
→ Open Durable Store
→ Read Save Schema
→ Migrate if needed
→ Validate Workspace
→ Load/Validate Ruleset + Content
→ Recover interrupted Attempt
→ Ready
```

Failures enter explicit recovery/degraded states rather than rendering normal gameplay and failing later.

## Health model

At least four runtime categories:

1. **Healthy** — normal operation.
2. **Domain Rejection** — expected invalid user action; game remains healthy.
3. **Degraded / Recoverable Infrastructure Fault** — e.g. storage write failed; durable gameplay pauses until recovery.
4. **Fatal Integrity Fault** — invariant/corruption issue requiring Recovery Mode.

## Workspace Session Lock

Single-tab ownership is infrastructure, not domain.

The lock contract should support:
- unique owner/session ID;
- liveness/lease semantics;
- stale recovery;
- explicit release;
- ownership-loss notification.

Domain Core never knows what a browser tab is.

## App updates

Do not hot-swap application code into a running session. One running session uses one coherent App Version. New code may be staged and activated on safe reload/restart.

## Preview versus committed build

Dragging a tile uses a non-durable candidate preview. The committed Build State changes only when an authoritative build command succeeds.

A fast preview may recompute all derived stats if PoC proves that cheap enough, but the contract remains preview vs commit.

## Audio and telemetry

Audio and telemetry are observers.

- Audio failure/mute never changes gameplay or learning correctness.
- Telemetry failure/disable never blocks gameplay or rewards.
- Pronunciation playback never changes combat validity.

## Diagnostic bundle

Internal/debug tooling should be able to capture enough information to reproduce an Attempt, including:
- App/Ruleset/Content versions;
- Attempt ID;
- seed/RNG metadata;
- Map/difficulty;
- initial ShipCombatSnapshot;
- relevant initial Run state;
- ordered gameplay inputs;
- terminal outcome;
- recent diagnostics.

Raw debug/input history uses bounded retention. Permanent progression and required learning history remain durable.

## Runtime Rules

Resolve the versioned Ruleset into an immutable session/Run runtime representation, with typed subsets such as:
- CombatRules;
- WordRules;
- ThreatRules;
- EconomyRules;
- ReviewRules.

Avoid a global mutable configuration dictionary.

## Validation strategy

Use defense in depth:
- authoring compile validation;
- pack load/compatibility validation;
- save/import validation;
- Domain invariant enforcement.

No anti-cheat is required for deliberate local save editing beyond corruption/invariant detection.

## Initial performance targets

Targets, not final SLAs:
- aim for visually smooth ~60 FPS on target desktop/laptop hardware;
- input/build interactions should feel immediate;
- tile drag preview must not visibly hitch;
- simulation outcome must be independent of render FPS;
- headless simulation should be capable of faster-than-realtime execution in tests;
- normal storage commits must not cause multi-second stalls.

Exact budgets and target hardware belong to Technology Selection/PoC.
