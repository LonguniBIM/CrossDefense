# Vocabulary Ship Game — Pre-Harness Bootstrap

This repository is a **technology-neutral greenfield codebase shell** for the vocabulary ship-building web game discussed and approved through Product Design, Product Platform Design, and Technical Architecture.

The final product name is still **TBD**. `vocab-ship-game` is only a working repository slug.

## Current phase

Completed and captured here:

- product concept and MVP boundaries;
- Product Platform Design;
- Technical Architecture;
- canonical domain terminology;
- architecture decision records for the hardest-to-reverse choices;
- implementation/testing seams;
- Technology Selection + PoC backlog.

Not started intentionally:

- framework/library selection;
- package manager/build tooling;
- production code;
- harness/orchestration setup;
- implementation tickets;
- final UX/UI detailed design;
- production content authoring.

## Why there is no package.json / framework scaffold yet

Technology Selection has deliberately been deferred until after the engineering harness/orchestration is installed and the highest-risk architecture questions are validated through targeted PoCs. This avoids encoding React/Phaser/Pixi/IndexedDB/etc. into the repository before evidence exists.

## Intended next sequence

1. Initialize this directory as the working repository if needed.
2. Install/configure the user's preferred engineering harness and orchestration.
3. Preserve the architecture and glossary documents in this package as the source of truth.
4. Resume with **Technology Selection + targeted PoCs**.
5. Use PoC evidence to select the runtime/UI/persistence/tooling stack.
6. Run **UX/UI + Detailed Design** for the settled platform.
7. Update the implementation specification.
8. Re-run `to-tickets` against the actual repository and chosen stack.

See `docs/handoff/PRE_HARNESS_HANDOFF.md` for the exact continuation point.

## High-level architecture

```text
Presentation
    ↓ intents
Application / Use Cases
    ↓
Headless Deterministic Domain Core
    ↓
Transactional Local Persistence

Ruleset + immutable compiled Content Packs
                 ↓
            Domain Core
```

Core principles:

- offline-first after initial load;
- optional PWA installation;
- modular monolith;
- domain owns truth;
- UI emits intents and renders projections;
- deterministic fixed-step simulation;
- browser-local authoritative player state;
- transient Map Attempt simulation state;
- data-driven content;
- full runtime must not depend on live AI, remote dictionaries, or server authorization.

## Repository map

- `CONTEXT.md` — canonical product/domain vocabulary only.
- `docs/product/MVP_SPEC.md` — approved product/functional contract.
- `docs/architecture/PLATFORM_ARCHITECTURE.md` — Product Platform Design.
- `docs/architecture/TECHNICAL_ARCHITECTURE.md` — detailed architecture contract.
- `docs/architecture/TESTING_STRATEGY.md` — primary behavior and browser seams.
- `docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md` — next design phase.
- `docs/adr/` — consequential architecture decisions.
- `docs/handoff/PRE_HARNESS_HANDOFF.md` — exact resume point after harness setup.
- `src/` — intentionally framework-neutral module boundaries.
- `content/` — authoring/runtime content boundary.
- `tests/` — test seam guidance; framework selection pending.

## Important warning

Do not treat the empty `src/` folders as permission to start feature implementation. The next phase is **Technology Selection + PoC**, not full implementation.
