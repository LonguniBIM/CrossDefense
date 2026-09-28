# Pre-Harness Handoff

## Current state

Product Design, Product Platform Design, and Technical Architecture are settled enough to stop discovery and prepare the engineering environment.

No production framework or library has been selected intentionally.

## User-requested boundary

The next human step is to set up the preferred **engineering harness and orchestration** on top of this repository package before any further Technology Selection / PoC work begins.

Do not start feature implementation before that setup is complete.

## What this package already contains

- approved MVP product specification;
- canonical domain glossary;
- Product Platform Architecture;
- Technical Architecture;
- primary testing seams;
- consequential ADRs;
- Technology Selection + PoC backlog;
- framework-neutral module directories.

## What the harness/orchestration setup may add

Examples, depending on the user's tooling:
- agent instructions (`AGENTS.md`, `CLAUDE.md`, etc.);
- review/delegation workflows;
- issue/ticket conventions;
- session handoff conventions;
- budget/token guardrails;
- branch/commit conventions;
- CI/local verification commands;
- tracker integration;
- repository-specific ADR/CONTEXT pointers.

Do not overwrite the settled product/architecture decisions while adding harness files. If the harness requires different document locations, move/link them deliberately and preserve source-of-truth clarity.

## Exact continuation point after harness setup

Resume with:

**Technology Selection + targeted PoCs**

Use `docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md` as the decision frontier.

At that point, inspect the actual repository and harness conventions before choosing tools.

## First repository facts to inspect after setup

1. root agent instructions and precedence;
2. package/build tooling introduced by the harness, if any;
3. test runner and review commands, if preconfigured;
4. branch/commit requirements;
5. ADR/CONTEXT conventions;
6. issue tracker/ticket publishing conventions;
7. supported browser/dev-server constraints.

## Expected next evidence-producing work

Prioritize PoCs for:
- deterministic dual simulation;
- crossword drag/stat preview;
- durable browser transactions and crash recovery;
- offline app/content package;
- single-tab session lock;
- headless + browser test toolchain.

The output of those PoCs should drive Technology Selection ADRs. Only then should the implementation SPEC be refreshed and `to-tickets` be run again against the real repository.
