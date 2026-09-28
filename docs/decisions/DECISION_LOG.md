# Decision Log

This is a compact index of settled decision ranges from the design interview. Detailed behavior is in the Product Spec and architecture documents.

## Product design

- Q1–Q150: product goals, learner scope, vocabulary rules, falling-block mechanics, ship building, combat, difficulty, progression, learning/review, offline MVP boundary, local Workspace model, backup, accessibility, and prototype gate.

## Product Platform Design

- Q151–Q156: optional-install PWA-capable web app, Modular Monolith, headless deterministic Domain Core, domain-owned authoritative state, data-driven Ruleset/Content/Player State split, one authoritative Map Attempt clock.
- Q157–Q166: modules by domain responsibility, explicit lifecycle state machine, snapshot persistence + transactional events rather than full Event Sourcing, atomic Unit of Work, aggregate boundaries, transient Attempt state, fixed-step simulation, separate combat spelling vs Learning Entry models, Content Pack validation, headless scenario test seam.
- Q167–Q179: explicit Application use cases, UI projections, persist after durable commands, sequential save migrations, Run version pinning, authoring source → compiled Content Pack pipeline, stable IDs/manifests, fail-closed durability, Last Known Good content, post-commit events as observers, telemetry isolation, internal debug surface.

## Technical Architecture

- Q180–Q194: strict inward dependencies, explicit module contracts, explicit state transitions, injected nondeterminism, seeded separated RNG streams, derived-state recomputation, immutable Attempt snapshots, serialized commands, typed rejections, domain invariant enforcement, integer permanent economy, explicit combat rounding, simulation-driven presentation.
- Q195–Q210: separate player-data/content durability domains, cross-aggregate Unit of Work, idempotent durable operations, Attempt Envelope, durable payload commit semantics, root save schema + staged migrations, state-only backups, staged restore, corruption isolation, immutable deterministic Content Packs, reference-aware pack cleanup, separate Simulation/Wall clocks, infrastructure session lock, two-tier persistence tests.
- Q211–Q227: bounded simulation catch-up, no background catch-up, tick-boundary input ordering, read-only render projections, host-agnostic simulation, durability barriers, runtime health states, bootstrap state machine, coherent App Version per session, performance targets, preview vs committed build, audio isolation, reproducible Diagnostic Bundle, no anti-cheat requirement, bounded debug retention, immutable typed RuntimeRules, defense-in-depth validation.

## Deferred decision sets

- exact framework/tool/library selections;
- main thread vs Web Worker final choice;
- persistence library/wrapper;
- rendering engine;
- PWA/service-worker implementation;
- final UX/UI detailed design;
- final product name and art direction;
- balance tuning values listed as configuration hypotheses.
