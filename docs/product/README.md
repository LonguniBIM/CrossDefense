# Product Docs

This directory contains current consumer-product behavior derived from real
accepted intent. Harness deliberately ships no fake product domains.

When a user provides a product specification, derive smaller living documents
here instead of keeping one growing specification as the operating manual. Name
files after actual product domains, such as `overview.md`, `billing.md`,
`permissions.md`, or `api-conventions.md`.

## Current Product Contract

- [MVP_SPEC.md](MVP_SPEC.md): Approved Product Specification and MVP boundaries for the Vocabulary Ship Game. Covers gameplay loops, falling-block spelling mechanics, crossword ship construction, combat resolution, progression economy, and local-first boundaries.

- [UX_UI_DESIGN.md](UX_UI_DESIGN.md): Approved UX/UI foundations and interaction direction from Q228-Q283; Shared Understanding for the consolidated design confirmed on 2026-09-29.

- [UX_UI_STATE_MATRIX.md](UX_UI_STATE_MATRIX.md): Consolidated screen/action/persistence and recovery contracts, verification evidence, and explicit deferrals.
- [UX_UI_PREVIEW.html](UX_UI_PREVIEW.html): Interactive illustrative design review; no production gameplay or saved data.

- [UI_COMPONENTS_AND_RENDERER.md](UI_COMPONENTS_AND_RENDERER.md): Q284-Q286 component/icon contract and fixed-camera 2.5D experiment.

## Implementation Handoff

- [TICKET11_ACCEPTANCE_20261126.md](TICKET11_ACCEPTANCE_20261126.md): Explicit Ticket11 user acceptance and authority for commit, push, merge and deployment of the accepted slice. Deployment awaits a concrete hosting target; Ticket12 implementation remains ON HOLD.
- [TICKET11_SETTINGS_CONTRACT.md](TICKET11_SETTINGS_CONTRACT.md): Approved Q16 shared bindings and accepted settings/pause/focus behavior. The [completed plan](../plans/completed/ticket11-controls-focus-pause.md) preserves engineering history; subsequent user acceptance is recorded above.
- [TICKET11_DEVELOPMENT_VERIFICATION.md](TICKET11_DEVELOPMENT_VERIFICATION.md): Ticket11 implementation, preserved review/remediation history, final full review and fresh complete ordered executable evidence. Integrated verification PASS and ChatGPT tri-axis PASS; later user acceptance is recorded separately. Engineering-time Pending/publication restrictions are historical.
- [IMPLEMENTATION_SPEC.md](IMPLEMENTATION_SPEC.md): Approved first durable playable slice contract; current ticket authority is recorded in its dated opening notice.
- [IMPLEMENTATION_BREAKDOWN.md](IMPLEMENTATION_BREAKDOWN.md): Approved vertical tickets, acceptance proof, dependencies and remaining full-MVP scope; no external tracker issues published.
- [TICKET09_ACCEPTANCE_20261125.md](TICKET09_ACCEPTANCE_20261125.md): Ticket09 accepted after exact checkpoint validation; complete 19 November technical evidence remains applicable.
- [DEVELOPMENT_REVIEW_SHIP_V1.md](DEVELOPMENT_REVIEW_SHIP_V1.md): Approved Q15 Learning Entry, exact hints/answer, reward policy and immutable pack identity.
- [TICKET10_DEVELOPMENT_VERIFICATION.md](TICKET10_DEVELOPMENT_VERIFICATION.md): Ticket10 engineering implementation, separate review axes, executed verification and explicit limits. Integrated verification and ChatGPT tri-axis PASS; explicit user acceptance is recorded separately below.
- [TICKET10_ACCEPTANCE_20261125.md](TICKET10_ACCEPTANCE_20261125.md): Historical Ticket10 user acceptance and Git publication authority on 2026-11-25 (Asia/Ho_Chi_Minh). Ticket11 now has its separate [acceptance and publication authority](TICKET11_ACCEPTANCE_20261126.md). Ticket12 implementation remains ON HOLD; suspended operations remain outside the current task.
- [Ticket10 completed plan](../plans/completed/ticket10-review-occurrence.md): Approved Q15 contract, implementation decisions, finding closure and preserved engineering history.

## Update Rule

When behavior changes:

1. Update the affected product document when the expected behavior changed.
2. Update the active execution plan when complex work uses one.
3. Add a lasting decision only when future work must inherit a consequential
   product, architecture, data, security, compatibility, or validation choice.
4. Add or update executable proof that exercises the behavior.

Bounded changes do not require a parallel lifecycle record.
