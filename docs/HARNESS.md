# Harness Product Model

Harness makes repository truth easier to retrieve and maintain.

## Principles

1. **Repository truth wins.** Product documents, decisions, plans, code, tests,
   CI, runtime evidence, and Git history are authoritative.
2. **Load the smallest useful context.** `AGENTS.md` is an entrypoint, not an
   encyclopedia.
3. **Process follows work shape.** Bounded work stays bounded; coordinated or
   recoverable work gets one durable plan.
4. **Material choices stay human-owned.** Missing product policy stops mutation.
5. **Behavior proves completion.** Workflow records and self-reports do not
   replace executable or observable evidence.
6. **Consumer applications own application operation.** Generic Harness files
   cannot supply stack-specific runtimes, credentials, logs, or fixtures.
7. **Harness maintains only its core.** `harness` safely installs and updates
   managed guidance without becoming a task control plane.

## Installed Core

The core provides:

- a small agent entrypoint (`AGENTS.md`, `CLAUDE.md`);
- workflow and documentation maps (`docs/WORKFLOW.md`, `docs/README.md`);
- product, decision, and execution-plan locations (`docs/product/`, `docs/decisions/`, `docs/plans/`);
- templates for durable work and application operation (`docs/templates/`);
- an invariant-encoding pattern and request-triggered skill (`docs/patterns/encoding-invariants.md`); and
- explicit-only onboarding, proposal-audit, and improvement skills (`.agents/skills/`).

It provides no fabricated product domains or validation commands.

## Setup Guide

For bootstrapping this harness on a new or existing repository, see [HARNESS_SETUP_GUIDE.md](HARNESS_SETUP_GUIDE.md).
