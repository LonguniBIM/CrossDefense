# Execution Plan: Technology Selection + Targeted PoCs

Date: 2026-09-29

## Status

Active

## Outcome

Produce evidence-backed technology selections for the CrossDefense MVP and prove the highest-risk browser/runtime architecture decisions with targeted PoCs before production implementation begins.

## Context

Authority and constraints:
- `AGENTS.md`
- `docs/WORKFLOW.md`
- `docs/product/MVP_SPEC.md`
- `docs/architecture/PLATFORM_ARCHITECTURE.md`
- `docs/architecture/TECHNICAL_ARCHITECTURE.md`
- `docs/architecture/TESTING_STRATEGY.md`
- `docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md`
- `docs/handoff/PRE_HARNESS_HANDOFF.md`

Product Platform Design and Technical Architecture are settled through Q227. The repository intentionally has no production framework/toolchain yet.

## Scope

In scope:
- Research and shortlist the primary application language/toolchain, UI framework, 2D rendering approach, browser persistence, PWA/offline tooling, schema validation, test/browser automation, audio strategy, content compilation tooling, and simulation host.
- Run PoC-1 through PoC-6 from the approved backlog.
- Capture evidence, measurements, failures, and decision implications.
- Promote only evidence-backed, hard-to-reverse technology choices into ADRs.
- Keep PoC code isolated and explicitly non-production.

Out of scope:
- Production feature implementation.
- Final UX/UI detailed design.
- Production Map content and the full vocabulary library.
- Economy/balance tuning beyond what a PoC requires.
- Final implementation tickets.

## Approach

1. Establish a current technology candidate matrix from primary-source research.
2. Define pass/fail criteria for each PoC against the approved architecture.
3. Execute the highest-risk PoCs in this order unless evidence changes the sequence:
   - PoC-1 deterministic dual-system simulation;
   - PoC-3 browser durability / transaction / crash recovery;
   - PoC-6 headless scenario + browser acceptance toolchain;
   - PoC-2 ship crossword drag + live stat preview;
   - PoC-4 offline application and content package;
   - PoC-5 single-tab Workspace Session Lock.
4. Record evidence after each PoC and update the candidate matrix.
5. Make technology decisions only when evidence is sufficient; create ADRs only for consequential, hard-to-reverse choices.
6. Finish with a verified stack recommendation and explicit unresolved risks before moving to UX/UI + Detailed Design.

## Risks And Recovery

- Risk: Selecting familiar tools before the architecture is proven. Mitigation: require primary-source evidence plus targeted PoC results before stack lock.
- Risk: PoCs accidentally become production code. Mitigation: keep them isolated and label them throwaway; production implementation must deliberately rewrite or adopt only after decisions are accepted.
- Risk: Browser behavior differs from in-memory tests. Mitigation: require real-browser proof for persistence, offline, and session-lock behaviors.
- Risk: PoC branch becomes difficult to recover. Mitigation: keep work scoped to `tech-selection-poc`, record evidence in this plan, and keep production directories untouched.

## Progress

- [x] Harness and repository guidance inspected.
- [x] Product, Platform, and Technical Architecture authority located.
- [x] Technology Selection + PoC backlog confirmed as the current decision frontier.
- [x] Dedicated PoC branch created: `tech-selection-poc`.
- [x] Research and record candidate technology matrix.
- [x] Define and execute PoC-1; record evidence and verdict.
- [ ] Define and execute PoC-3; record evidence and verdict.
- [ ] Define and execute PoC-6; record evidence and verdict.
- [ ] Define and execute PoC-2; record evidence and verdict.
- [ ] Define and execute PoC-4; record evidence and verdict.
- [ ] Define and execute PoC-5; record evidence and verdict.
- [ ] Create or update technology ADRs from evidence.
- [ ] Produce final technology selection summary and move the plan to completed.

## Decisions

- 2026-09-29: Technology selection is evidence-first. Familiarity alone is not authority for framework or library selection.
- 2026-09-29: PoC artifacts remain isolated from production paths until an explicit decision promotes a validated approach.
- 2026-09-29: PoC-1 passed across 60 FPS, 144 FPS, 30 FPS, jittered frames, and a simulated three-second stall with identical terminal digest `88da6a92`; this supports fixed-step render-independent simulation and isolated seeded RNG streams.
- 2026-09-29: PoC-1 does not justify a Web Worker. Keep the simulation host-agnostic and defer main-thread versus Worker selection until browser/rendering evidence exists.

## Validation

- Focused proof: each PoC has observable pass/fail criteria and reproducible results.
- Integration or end-to-end proof: browser-dependent claims are validated in a real browser environment, not only with in-memory fakes.
- Repository-required checks: follow commands introduced by the selected toolchain after that toolchain is itself selected; do not invent production validation commands before then.

## Result

Pending. Record the verified stack decisions, remaining risks, and next phase before moving this plan to `docs/plans/completed/`.
