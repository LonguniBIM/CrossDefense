# Agent Instructions

> Current Ticket11 acceptance and publication authority — 2026-11-26 (Asia/Bangkok): The user explicitly accepted Ticket11 and requested commit, push, merge and deployment. Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted. Git publication and deployment of the accepted result are authorized; deployment awaits a concrete hosting destination. Earlier Ticket11 Pending/no-Git/no-deployment notices below are historical where superseded. Ticket12 implementation remains ON HOLD. Suspended provider/review-credential/orchestration, WFP/G-R/G-P and refused-snapshot restrictions are unchanged. See [the acceptance record](docs/product/TICKET11_ACCEPTANCE_20261126.md).

> Historical Ticket11 engineering closeout — 2026-11-26 (Asia/Bangkok): Ticket11 implementation is authorized development-only. The user approved Q16 on 2026-11-25: gameplay bindings are shared across all Pilots on the same local Workspace/device and persist across reload. Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS. The separate final full review and fresh complete ordered gate are recorded in the verification record. User acceptance is Pending; Ticket12 remains ON HOLD. The earlier Ticket10 Git authorization does not authorize Ticket11 staging, commits, pushes or merges. No publication, deployment, provider reviewers, credentials, suspended orchestration, WFP/G-R/G-P, source snapshots/bundles/exports, replacement on-disk source inventories or reconstruction of the refused snapshot operation is authorized. See [the Ticket11 contract](docs/product/TICKET11_SETTINGS_CONTRACT.md), [verification record](docs/product/TICKET11_DEVELOPMENT_VERIFICATION.md) and [completed plan](docs/plans/completed/ticket11-controls-focus-pause.md).

> Historical Ticket10 authority - 2026-11-25 (Asia/Ho_Chi_Minh): The user explicitly accepted Ticket10 and authorized staging, committing, pushing and merging the completed product work. Ticket10 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted, development-only; see [the acceptance record](docs/product/TICKET10_ACCEPTANCE_20261125.md), [verification record](docs/product/TICKET10_DEVELOPMENT_VERIFICATION.md) and [completed plan](docs/plans/completed/ticket10-review-occurrence.md). Q15 remains approved: the SHIP noun water-vessel Review fixture, 1 completion Credit + 1 independent-first-response bonus, event-triggered immediate-due occurrence policy, and immutable development-review-ship-v1 with old Run pins preserved. Ticket09 remains Implemented / Integrated verification PASS / User acceptance Accepted. Ticket11 is the next-session implementation target and has not started in this session; Ticket12 remains ON HOLD. No Ticket02/03 final acceptance is inferred. Earlier Pending, hold and no-Git notices are historical where superseded. Deployment, publication beyond the authorized Git actions, provider reviewers, credential setup, suspended orchestration and WFP/G-R/G-P operations remain unauthorized. The refused snapshot operation remains prohibited.

> Historical authority - 2026-10-11: Ticket08 is Approved / User accepted. Ticket09 outcome settlement and staged Salvage is authorized development-only with ChatGPT-only tri-axis review and isolated Chromium smoke. Existing Q13 rewards and Q14 content pins remain authoritative; no new content selection is required. Tickets10-12 remain ON HOLD. No stage, commit, push, deploy, provider/orchestration or WFP/G-R/G-P work is authorized. See docs/plans/active/ticket09-outcomes-salvage.md.

> Ticket08 engineering closeout: Q14 is Implemented / Locally verified / ChatGPT tri-axis PASS after the fault-footer correction and final full executable gate. See docs/product/TICKET08_DEVELOPMENT_VERIFICATION.md. User acceptance Pending; Tickets09-12 ON HOLD. Earlier Pending notes below are historical. No stage, commit, push or deployment is authorized.

> Q14 approved by the user on 2026-10-10: implement development-rendered-combat-ship-v1 with the exact audited 14 assets, schema 4 and unchanged development-combat-ruleset-v1. Old Runs retain their original pins and HUD/capability. Ticket08 authoring/implementation is now authorized; tri-axis and final executable verification remain Pending. Tickets09-12 ON HOLD; no stage, commit, push, deployment or provider/orchestration work. This latest notice supersedes the historical Q14 Pending wording below.

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
- **Phase**: Technology Selection + targeted PoCs and **UX/UI + Detailed Design** are complete. UX Shared Understanding was confirmed on 2026-09-29; see [UX_UI_DESIGN.md](docs/product/UX_UI_DESIGN.md) and [UX_UI_STATE_MATRIX.md](docs/product/UX_UI_STATE_MATRIX.md). Active follow-up: [UI components and fixed-camera 2.5D renderer experiment](docs/plans/completed/ui-components-fixed-camera-renderer.md), authorized by Q284-Q286 on 2026-09-30. The first durable slice specification, T1-T4 and all 12 tickets were approved on 2026-10-01. Ticket 01 is complete / verified locally; Ticket 02 development-only remediation is implemented / locally verified; ChatGPT-only engineering review applies, while the approved SHIP starter is authored, compiled and locally verified; final user acceptance remains governed by its own ticket record. The current frontier is Ticket09 accepted and Ticket10 implemented, verified and explicitly accepted on 2026-11-25. Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted as of 2026-11-26; the accepted development slice is authorized for Git publication and requested deployment. Ticket12 remains ON HOLD. See [the approved breakdown](docs/product/IMPLEMENTATION_BREAKDOWN.md). See [TECHNOLOGY_SELECTION_RESULT.md](docs/architecture/TECHNOLOGY_SELECTION_RESULT.md) for the accepted stack foundation and deliberate deferrals.
- **Domain Glossary**: [CONTEXT.md](CONTEXT.md) is the canonical product and domain vocabulary.
- **Product Specification**: [docs/product/MVP_SPEC.md](docs/product/MVP_SPEC.md).
- **Architecture Overview**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/architecture/PLATFORM_ARCHITECTURE.md](docs/architecture/PLATFORM_ARCHITECTURE.md), and [docs/architecture/TECHNICAL_ARCHITECTURE.md](docs/architecture/TECHNICAL_ARCHITECTURE.md).
- **Testing Seams**: [docs/architecture/TESTING_STRATEGY.md](docs/architecture/TESTING_STRATEGY.md).
- **Decision Frontier**: [docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md](docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md).
- **Architecture Decisions**: [docs/adr/](docs/adr/) and [docs/decisions/DECISION_LOG.md](docs/decisions/DECISION_LOG.md).

### Operating Guardrails
- **Repository Language**: All repository documentation, user-facing design text, code comments, and docstrings must be written in English. Do not add Vietnamese text to repository files.
- **Implementation authority**: The refreshed specification, T1-T4 and all 12 tickets were approved on 2026-10-01 at 02:48 Asia/Bangkok. Ticket 01 was explicitly authorized to start on 2026-10-01. Ticket 02 was explicitly authorized for development-only execution on 2026-10-04 and is Implemented / Locally verified; ChatGPT-only engineering review applies; the approved SHIP starter is authored, compiled and locally verified; final user acceptance remains Pending. Ticket09 is Implemented / Integrated verification PASS / User acceptance Accepted as of 2026-11-25. Ticket10 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted, development-only, following explicit acceptance on 2026-11-25 (Asia/Ho_Chi_Minh). The Ticket10 instruction authorized staging, committing, pushing and merging the completed Ticket10 product work. Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted as of 2026-11-26; the accepted development slice is authorized for Git publication and requested deployment. Ticket12 remains ON HOLD. Ticket11 staging, commit, push and merge are now authorized; deployment awaits a concrete hosting target. Do not reopen settled approvals; preserve ticket-specific content/asset gates.
- **Architectural Tenets**:
  - Offline-first after initial load (optional PWA).
  - Headless deterministic Domain Core owns state and rules.
  - UI emits user intents and renders projections.
  - Deterministic fixed-step simulation with seeded, isolated RNG streams.
  - Transactional local snapshot persistence (Unit of Work).

- **Current review authority (Ticket 02 and explicitly designated ChatGPT-only work):** ChatGPT review is the engineering gate. Do not add an independent-provider or owned-status requirement. Provider reviewers, review credentials, blocked orchestration, WFP and G-R/G-P stay suspended until an official OpenAI Support response and a subsequent authorized action. Never retry, reconstruct or reroute a refused operation. Ticket10's Q15 fixture gate and user acceptance are satisfied. Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted as of 2026-11-26; the accepted development slice is authorized for Git publication and requested deployment. Ticket12 remains ON HOLD. The 2026-11-26 user instruction authorizes Ticket11 staging, commits, pushes, merges and deployment of the accepted result; no hosting target has yet been selected.

- **Ticket 03 historical authority:** The user approved Q3-A (one seeded shuffle of the finite SHIP pool) and Q4 (reward-free pieces once all remaining entries are reserved), following the instruction to proceed with Ticket 03. Ticket 03 is Implemented / Locally verified, development-only, using ChatGPT-only review. See docs/product/TICKET03_DEVELOPMENT_VERIFICATION.md for current review/verification evidence; final user acceptance remains Pending. Tickets 09-12 remain ON HOLD. Ticket 02 final user acceptance is not silently relabelled.

Tickets04-08 retain their existing Approved / User accepted status; Ticket09 is now also accepted after the 2026-11-25 checkpoint validation. Q13 combat/economy values and Q14's exact 14 assets and old-Run capability/pins remain authoritative. Ticket10 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS, development-only; Q15 and the engineering evidence are recorded in [the completed plan](docs/plans/completed/ticket10-review-occurrence.md) and [verification record](docs/product/TICKET10_DEVELOPMENT_VERIFICATION.md). Ticket10 user acceptance was explicitly granted on 2026-11-25 (Asia/Ho_Chi_Minh); see [the acceptance record](docs/product/TICKET10_ACCEPTANCE_20261125.md). Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted as of 2026-11-26; the accepted development slice is authorized for Git publication and requested deployment. Ticket12 remains ON HOLD. No Ticket02/03 final acceptance is inferred. Ticket11 Git publication and deployment of the accepted result were explicitly requested on 2026-11-26; deployment still needs a hosting target. Suspended operations remain outside this authority.
