# Technology Selection + PoC Backlog

## Status

Completed on 2026-09-29. See `TECHNOLOGY_SELECTION_RESULT.md` and ADRs 0006–0011 for the accepted evidence-backed selections and deliberate deferrals.

## Purpose

This is the **next phase after harness/orchestration setup**. Do not select a framework only because it is familiar; use the architecture contract and targeted PoCs to answer high-risk questions first.

## Original technology decision frontier

This phase evaluated:

- primary application language/toolchain;
- UI framework;
- 2D rendering strategy (DOM/SVG/Canvas/WebGL/game renderer library);
- falling-block/combat render host;
- state management library, if any;
- browser durable storage implementation/wrapper;
- service-worker/PWA tooling;
- audio playback / offline pronunciation strategy;
- schema validation/serialization tooling;
- test runner and browser automation tooling;
- content authoring/compile pipeline tooling;
- whether simulation runs on main thread or Web Worker.

Accepted selections and deliberate deferrals are recorded in `TECHNOLOGY_SELECTION_RESULT.md`.

## Selection criteria

Every candidate stack should be evaluated against the approved architecture:

- can the Domain Core run headlessly without DOM/browser APIs?
- can deterministic fixed-step simulation be tested faster than realtime?
- can rendering be cleanly separated from simulation?
- can browser-local atomic transactions/idempotent operations be implemented safely?
- can offline resources and immutable Content Packs be managed reliably?
- can a Local Guardian Workspace survive reload/crash/migration?
- can a second tab be prevented from writing concurrently?
- can content/audio be packaged for offline use?
- is the stack maintainable by one developer using AI coding agents?
- does it support fast automated testing and reproducible diagnostics?

## Recommended PoCs before stack lock

### PoC-1 — Deterministic dual-system simulation

Build the smallest runnable experiment that proves:
- one fixed-step clock coordinates falling-block and auto-battle;
- piece lock can emit Threat events;
- rendering FPS does not change the simulation result;
- seeded replay produces the same terminal state.

Decision output:
- simulation host model;
- fixed tick candidate;
- whether Web Worker isolation is needed.

### PoC-2 — Ship crossword drag + live stat preview

Prove:
- grid drag/drop feels immediate;
- valid/invalid horizontal/vertical sequences recalculate correctly;
- Before/After stat preview is responsive;
- preview remains non-durable until commit.

Decision output:
- UI/rendering approach for Build Phase;
- whether full recomputation is cheap enough or incremental calculation is needed.

### PoC-3 — Browser durability / transaction / crash recovery

Prove:
- Blueprint collection + quota is atomic;
- OperationId retry is idempotent;
- durable write failure can trigger a safe barrier/pause;
- reload during Attempt returns to Build while committed loot survives;
- schema migration and recovery snapshot work.

Decision output:
- persistence technology/wrapper;
- transaction model;
- migration/backup primitives.

### PoC-4 — Offline application and content package

Prove after one successful load:
- application launches with network disabled;
- one minimal immutable Content Pack loads;
- target pronunciation audio works offline;
- bad candidate pack cannot replace Last Known Good;
- an old pinned pack can coexist with a newer default pack.

Decision output:
- PWA/service-worker tooling;
- content asset packaging strategy;
- cache/version registry design.

### PoC-5 — Single-tab Workspace Session Lock

Prove:
- Tab A acquires write ownership;
- Tab B is blocked from authoritative writes;
- stale owner recovery works after abnormal closure;
- loss of ownership is detectable.

Decision output:
- browser primitive/lock strategy;
- lease/liveness policy.

### PoC-6 — Headless scenario + browser acceptance toolchain

Prove one shared scenario can:
- run quickly headless through Application/Domain contracts;
- run browser acceptance around the real persistence/offline shell;
- emit a useful reproducible diagnostic artifact on failure.

Decision output:
- test runner;
- browser automation tool;
- diagnostic/reporting integration.

## Explicitly defer until after the PoCs

- production Map content authoring;
- final hull art;
- full 120–180-word library;
- detailed economy tuning;
- production-grade animation polish;
- implementation ticket publication.

## Codebase requirement for this phase

Once the user's harness/orchestration is installed, resume here with the actual repository available. At that point inspect:
- repository agent instructions;
- package/build conventions introduced by the harness;
- test/review workflow;
- ADR/CONTEXT conventions;
- branch/commit expectations.

Technology choices should then be captured as ADRs only after evidence exists.
