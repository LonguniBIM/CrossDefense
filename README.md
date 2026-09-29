# Vocabulary Ship Game — CrossDefense

This repository contains the approved product, platform, technical architecture, engineering harness, and evidence-backed technology foundation for the CrossDefense vocabulary ship-building web game.

The final product name is still **TBD**. `vocab-ship-game` is only a working repository slug.

## Current phase

Completed and captured here:

- product concept and MVP boundaries;
- Product Platform Design;
- Technical Architecture;
- canonical domain terminology;
- engineering harness/orchestration;
- Technology Selection + targeted PoCs;
- evidence-backed technology ADRs and testing seams.

Not started intentionally:

- production application implementation;
- final UX/UI detailed design;
- final implementation tickets;
- production content authoring.

## Why there is still no production root package.json / framework scaffold

The Technology Selection phase is complete, but the repository deliberately keeps production paths unscaffolded until UX/UI + Detailed Design is settled. The executable package under `prototypes/technology-selection/browser-harness/` is evidence-producing prototype infrastructure, not the production application.

See `docs/architecture/TECHNOLOGY_SELECTION_RESULT.md` for accepted technology selections and deliberate deferrals.

## Intended next sequence

1. Run **UX/UI + Detailed Design** against the approved product, architecture, and technology foundation.
2. Resolve the overall UI framework and Combat renderer only when concrete screen/render requirements justify the choice.
3. Refresh the implementation specification with the settled UX and remaining technology decisions.
4. Re-run `to-tickets` against the actual repository and chosen stack.
5. Begin production implementation only from approved tickets.

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
