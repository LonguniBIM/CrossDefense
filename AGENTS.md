# Agent Instructions

<!-- HARNESS:BEGIN -->
## Harness

Start with the requested outcome and use the repository as the system of record.
Read `docs/WORKFLOW.md` and only relevant product, design, plan, code, and
validation material.

- Answers, explanations, reviews, diagnoses, plans, and status reports are
  read-only. Inspect only what is needed; change nothing.
- For a bounded change, inspect affected behavior and proof, implement, and
  validate. No control-plane operation is required.
- Use one `docs/plans/active/` file when work spans sessions, coordinates
  contributors, has dependencies, or needs recovery. Move it to
  `docs/plans/completed/` only after validation.
- Before editing, identify repository authority for each new externally
  observable policy. If materially different choices remain open, stop before
  edits; configurable defaults are not authority.
- For architecture, reliability, security, or quality invariant work, read
  `docs/patterns/encoding-invariants.md` and enforce only accepted rules.
- Report reusable agent friction. Change guidance, tools, runbooks, or validation
  for that purpose only when explicitly asked to use `$improve-harness`.
- Also pause when product intent remains ambiguous, recovery is difficult,
  validation is weakened, or authority is insufficient.
- Claim completion only with executable or observable evidence. Report outcome,
  changes, validation, and unresolved risks.

Harness has no task database or orchestration lifecycle. Use repository plans
and behavior-level proof; do not create parallel control-plane state.
<!-- HARNESS:END -->

## Project-specific Instructions

### Product & Domain Context
- **Project**: Vocabulary Ship Game (working slug: `CrossDefense`).
- **Phase**: Technology Selection + targeted PoCs are complete. Active milestone is **UX/UI + Detailed Design**. See [TECHNOLOGY_SELECTION_RESULT.md](docs/architecture/TECHNOLOGY_SELECTION_RESULT.md) for the accepted stack foundation and deliberate deferrals.
- **Domain Glossary**: [CONTEXT.md](CONTEXT.md) is the canonical product and domain vocabulary.
- **Product Specification**: [docs/product/MVP_SPEC.md](docs/product/MVP_SPEC.md).
- **Architecture Overview**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/architecture/PLATFORM_ARCHITECTURE.md](docs/architecture/PLATFORM_ARCHITECTURE.md), and [docs/architecture/TECHNICAL_ARCHITECTURE.md](docs/architecture/TECHNICAL_ARCHITECTURE.md).
- **Testing Seams**: [docs/architecture/TESTING_STRATEGY.md](docs/architecture/TESTING_STRATEGY.md).
- **Decision Frontier**: [docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md](docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md).
- **Architecture Decisions**: [docs/adr/](docs/adr/) and [docs/decisions/DECISION_LOG.md](docs/decisions/DECISION_LOG.md).

### Operating Guardrails
- **Repository Language**: All repository documentation, user-facing design text, code comments, and docstrings must be written in English. Do not add Vietnamese text to repository files.
- **No Early Implementation**: Technology foundation ADRs are accepted, but production implementation remains blocked until UX/UI + Detailed Design is complete, the implementation specification is refreshed, and final implementation tickets are approved.
- **Architectural Tenets**:
  - Offline-first after initial load (optional PWA).
  - Headless deterministic Domain Core owns state and rules.
  - UI emits user intents and renders projections.
  - Deterministic fixed-step simulation with seeded, isolated RNG streams.
  - Transactional local snapshot persistence (Unit of Work).
