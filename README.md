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
- evidence-backed technology ADRs and testing seams;
- UX/UI + Detailed Design, with Shared Understanding confirmed on 2026-09-29.

Current implementation status (2026-11-26):

- Ticket09 is **Implemented / Integrated verification PASS / User acceptance Accepted**; see [the acceptance record](docs/product/TICKET09_ACCEPTANCE_20261125.md).
- Ticket10 is **Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted** under approved Q15; see [the acceptance record](docs/product/TICKET10_ACCEPTANCE_20261125.md).
- Ticket11 is **Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted** under approved Q16. Its Git publication was merged in [PR #3](https://github.com/LonguniBIM/CrossDefense/pull/3); see [the acceptance record](docs/product/TICKET11_ACCEPTANCE_20261126.md).
- The user selected **Cloudflare Workers Static Assets Free** and authorized deployment of the accepted application. Configuration and verification are tracked in [the deployment plan](docs/plans/active/cloudflare-static-deployment.md); provider account connection and live deployment must be observed before claiming publication.
- Ticket12 remains **ON HOLD**. Ticket02/03 acceptance is not inferred. Suspended provider review/orchestration, WFP/G-R/G-P and refused-snapshot restrictions remain unchanged.

## Production application scaffold

Ticket 01 established the root production TypeScript + Vite package using the approved Dexie, Zod, Vitest, Playwright, and Web Locks foundation. The executable packages under `prototypes/` remain evidence-producing prototype infrastructure and are not production modules.

See `docs/architecture/TECHNOLOGY_SELECTION_RESULT.md` and `docs/product/IMPLEMENTATION_BREAKDOWN.md` for the accepted foundation and remaining ticket gates.

## Intended next sequence

1. Publish and verify the accepted Ticket11 application on Cloudflare Workers Static Assets Free.
2. Follow the [deployment guide](docs/deployment/CLOUDFLARE_WORKERS.md) for build settings, account connection, live checks and recovery.
3. Keep Ticket12 ON HOLD; production offline reload and safe updates are not implemented by this hosting change.

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
- `docs/product/UX_UI_DESIGN.md` — approved UX decisions and Shared Understanding.
- `docs/product/UX_UI_STATE_MATRIX.md` — accepted screen/state contracts and preview verification limits.
- `docs/plans/completed/ux-ui-detailed-design.md` — UX/UI milestone closure.
- `docs/architecture/PLATFORM_ARCHITECTURE.md` — Product Platform Design.
- `docs/architecture/TECHNICAL_ARCHITECTURE.md` — detailed architecture contract.
- `docs/architecture/TESTING_STRATEGY.md` — primary behavior and browser seams.
- `docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md` — next design phase.
- `docs/adr/` — consequential architecture decisions.
- `docs/handoff/PRE_HARNESS_HANDOFF.md` — exact resume point after harness setup.
- `src/` — intentionally framework-neutral module boundaries.
- `content/` — authoring/runtime content boundary.
- `tests/` — headless behavior and browser verification seams.

## Implementation authority

Feature work follows the current ticket-specific authorization and content gates recorded above. Ticket11 user acceptance is Accepted. The user authorized commit, push, merge and deployment, and selected Cloudflare Workers Static Assets Free on 2026-11-26. The bounded hosting configuration and main-branch deployment are within that authority. Ticket12 remains ON HOLD, and suspended operations remain outside scope.
