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

## Technology Selection

- TypeScript + Vite selected for the application toolchain.
- IndexedDB + Dexie selected for authoritative browser-local persistence.
- Zod selected for runtime boundary validation.
- Vitest + Playwright selected for headless and real-browser testing.
- vite-plugin-pwa + Workbox selected for offline runtime delivery.
- Web Locks selected for Workspace write ownership.
- Build Phase selected as DOM-first with full deterministic recomputation.
- Simulation remains host-agnostic and starts on the main thread unless profiling later justifies a Worker.

## UX/UI + Detailed Design

- Q228-Q233: approved stylized 2D science fiction, contextual first-Run guidance, contextual Build information, player-requested hints, falling-block attention priority, and desktop viewport targets. See [UX_UI_DESIGN.md](../product/UX_UI_DESIGN.md).

- Q234-Q243: approved three-region Build layout, equivalent pointer/keyboard placement, contextual hint panel, paused instructional overlays, explicit Pilot entry, restrained Combat HUD, navy accessible styling, small-viewport pause, victory/Review/Salvage flow, and Build-based upgrade panels. See [UX_UI_DESIGN.md](../product/UX_UI_DESIGN.md).

- Q244-Q255: approved capacity counting across placed/unplaced tiles, occupied-cell rejection, bounded layout Undo/Redo, Build previews, Learning Entry detail, per-Pilot tutorial progress, minimal Pilot creation, factual results, retryable optional Review, Map cards, pause/input rules, and differentiated fault screens. Cargo semantics are also recorded in CONTEXT.md and MVP_SPEC.md.

- Q256-Q270: approved Cargo views/return, previewed hull switching, atomic staged Salvage resolution, explicit discard, owned-tile hint candidates, Review access, per-Pilot difficulty, confirmed Pilot switching, Workspace backup controls, destructive-action summaries, readiness/update indicators, default keys, separate audio controls, and warning priority. See UX_UI_DESIGN.md for details.
- Prior product context recovered 2026-09-29: auto-battle left / falling-block right; finite enemy-free Pre-Run Salvage with a viable minimum target word including a Weapon Tile. Recovery behavior was subsequently settled by Q271.

- Q271-Q283: approved finite Pre-Run recovery, exact normalized Review matching, same-occurrence resume, first-correct completion Credits, sense-specific exposure, Build keyboard/focus, settings ownership, learning evidence summary, resume countdown, side-view Combat, key remapping, final-Map continuation, and a no-offense launch advisory. See UX_UI_DESIGN.md and MVP_SPEC.md. Review Occurrence is defined in CONTEXT.md.

- 2026-09-29: the user explicitly confirmed Shared Understanding for UX/UI + Detailed Design: Q228-Q283, the consolidated screen/state matrix, and visual direction. The UX behavioral frontier is closed. See [UX_UI_STATE_MATRIX.md](../product/UX_UI_STATE_MATRIX.md) and the [completed plan](../plans/completed/ux-ui-detailed-design.md). Technology deferrals and the refreshed-specification/final-ticket gates remain in force.

- 2026-09-30, Q284-Q286: user accepted lightly beveled sci-fi components and the proposed nine outline subtype icons with text labels, and explicitly expanded Combat to fixed-camera 2.5D with a renderer experiment. Q286 supersedes the flat-2D portion of Q228/Q280; screen orientation, DOM-first Build, and domain-owned gameplay remain. See [active refinement plan](../plans/completed/ui-components-fixed-camera-renderer.md).

- 2026-09-30, Q287-Q289: user accepted shared equipped-layout representation between Build and 2.5D Combat, preview/commit-aware equipment feedback, and restrained factual subtype-specific Combat effects. See [UX_UI_DESIGN.md](../product/UX_UI_DESIGN.md). The user additionally requested detailed subtype cooldowns; this is an open gameplay timing refinement, not approval of unspecified cooldown values or new active abilities.

- 2026-09-30, Q290-Q293: user approved subtype cooldown categories and initial experiment intervals, per-tile Weapon/Support timers, shared Shield recharge, Simulation Clock timing, magnitude-only bonuses, and contextual cooldown UI. See [COMBAT_TIMING.md](../product/COMBAT_TIMING.md). Initial readiness, damage/target-loss boundaries, regeneration boundaries, same-tick resolution, and per-activation effect magnitudes remain open; production implementation is not authorized by this approval.

- 2026-09-30, Q294-Q298: user accepted all proposed timing boundaries and experimental magnitudes. Ready weapons, injury-triggered Support, fixed Ballistic/Missile flight delays, distributed Laser damage/no target-loss reset, precise Shield recharge, same-tick damage/terminal/repair ordering, and mutual-destruction failure are settled. See [COMBAT_TIMING.md](../product/COMBAT_TIMING.md). Cooldown frontier closed; visual validation and balance tuning remain.

## Deferred decision sets

- overall UI framework;
- Combat renderer / 2D engine;
- dedicated state-management library;
- production audio abstraction/library;
- detailed content-authoring/compiler implementation;
- final product name and final production art assets;
- balance tuning values listed as configuration hypotheses.
