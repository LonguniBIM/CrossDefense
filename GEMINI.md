# Gemini Agent Instructions

<!-- HARNESS:BEGIN -->
## Harness

This codebase is operated under the **Repository Harness**.
The canonical instructions, workflow authority, and operating guardrails are defined in:

👉 [`AGENTS.md`](AGENTS.md)
<!-- HARNESS:END -->

## Operating Rules for Gemini

- **Workflow & System of Record**: Follow [`docs/WORKFLOW.md`](docs/WORKFLOW.md). All changes must be backed by repository authority and observable evidence.
- **Skills Available**: Use the native skills located in `.agents/skills/` (`encode-invariant`, `improve-harness`, `audit-onboarding-proposal`, `onboard-repository`, `engineering-wisdom`).
- **Product & Architecture Authority**: Refer to [`docs/product/MVP_SPEC.md`](docs/product/MVP_SPEC.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and [`CONTEXT.md`](CONTEXT.md).
- **Execution Plans**: For tasks spanning multiple sessions or complex implementations, use [`docs/plans/active/`](docs/plans/active/) based on [`docs/templates/exec-plan.md`](docs/templates/exec-plan.md).
- **Current Milestone**: Pre-harness bootstrap is complete. The active milestone is **Technology Selection + targeted PoCs** ([`docs/handoff/PRE_HARNESS_HANDOFF.md`](docs/handoff/PRE_HARNESS_HANDOFF.md)). Do not begin production implementation until PoC evidence is validated.
