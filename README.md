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

Current implementation status (2026-11-25):

- Ticket09 is **Implemented / Integrated verification PASS / User acceptance Accepted**, following exact checkpoint validation and reuse of the complete 19 November gate. See [the acceptance record](docs/product/TICKET09_ACCEPTANCE_20261125.md).
- Ticket10 is **Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted**, development-only, under approved Q15. The user explicitly accepted it on **2026-11-25 (Asia/Ho_Chi_Minh)**; see [the acceptance record](docs/product/TICKET10_ACCEPTANCE_20261125.md). The approved Learning Entry, exact answer, 1+1 Credit policy and immediate-due occurrence contract remain in [the completed plan](docs/plans/completed/ticket10-review-occurrence.md); actual execution, review findings and limits are in [the verification record](docs/product/TICKET10_DEVELOPMENT_VERIFICATION.md).
- Ticket11 is the next-session implementation target and has not started in this session; Ticket12 remains **ON HOLD**. Earlier ticket-specific evidence and acceptance remain governed by their own records; Ticket02/03 acceptance is not inferred.
- The user's current instruction authorizes staging, committing, pushing and merging the completed product work. Content authoring retains its approved ticket-specific gates. Deployment, publication beyond the authorized Git actions, provider reviewers, credential setup, suspended orchestration and WFP/G-R/G-P operations remain unauthorized; the refused snapshot operation remains prohibited.

## Production application scaffold

Ticket 01 established the root production TypeScript + Vite package using the approved Dexie, Zod, Vitest, Playwright, and Web Locks foundation. The executable packages under `prototypes/` remain evidence-producing prototype infrastructure and are not production modules.

See `docs/architecture/TECHNOLOGY_SELECTION_RESULT.md` and `docs/product/IMPLEMENTATION_BREAKDOWN.md` for the accepted foundation and remaining ticket gates.

## Intended next sequence

1. Record the authorized Git publication outcome for the completed product work.
2. Continue with Ticket11 in a new session using the English implementation prompt.
3. Keep Ticket12 ON HOLD.

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

Feature work follows the current ticket-specific authorization and content gates recorded above. Ticket10 user acceptance is Accepted. The completed product work is authorized for stage, commit, push and merge. Ticket11 is the next-session implementation target and has not started in this session; Ticket12 remains ON HOLD. Deployment and suspended operations remain unauthorized.
