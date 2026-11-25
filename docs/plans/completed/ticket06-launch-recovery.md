# Execution Plan: Ticket 06 - Launch and Recover a Map Attempt

Date: 2026-10-07

## Status

Completed implementation and engineering validation. Q9 is explicitly approved; final full tri-axis and executable verification PASS within development-only scope. User acceptance remains Pending. Ticket05 is Approved / User accepted; Tickets07-12 remain ON HOLD.
Original fixed point and HEAD: `fd945fae4916b8500245e74d75d65e331fb6ba43`; branch `tech-selection-poc`.

## Outcome and contract

Deliver the unchanged Ticket06 acceptance criteria: current-Power/unresolved-Salvage launch blockers, no extra supported-word blocker, explicit no-offense confirmation, Normal default and per-Pilot explicit difficulty, immutable startup inputs, idempotent Start, and interrupted recovery preserving Build/tiles without victory rewards.
Authority: `.scratch/first-durable-playable-slice/issues/06-launch-and-recover-a-map-attempt.md`, implementation specification, MVP/UX contracts, transactional-snapshot ADR0004, technical architecture, and user Q9 approval. The approved concrete pack and compatibility boundary are recorded in `docs/product/DEVELOPMENT_ATTEMPT_SHIP_V1.md`.

## Approved scope

New schema3 pack `development-attempt-ship-v1`, Ruleset `development-attempt-ruleset-v1`, and one initially available Map `development-map-01` named `Map 1 - Development`. Explicit `launch-recovery-only` capability inherits the exact approved starter, Build arithmetic, hull/spellings and empty assets. Schema1/2 packs and their immutable bytes remain valid. Old Runs stay pinned and editable but never borrow the new Map. No automatic Run conversion is authorized.

Runtime scope: Domain launch/end invariants, serialized Application admission/retry, successful-Start Build history boundary, Pilot difficulty, additive save contract v6, actual IndexedDB rollback/migration, factual Map/paused-diagnostic screens and bootstrap recovery.
Out of scope: combat, encounters, HP/damage/time/Threat/boss/mitigation constants, rewards, learning content, full Salvage producers/Apply, public release and Tickets07-12. No provider, credentials, blocked orchestration, WFP/G-R/G-P, stage, commit, push or deploy.

## Implementation and proof completed

The actual shared content CLI compiled the approved source. Public Domain/Application tests exercise Power, unresolved Salvage, invalid identities/pins, unsupported SHI, no-offense confirmation, cloned startup values, no writable Build during admitted Start, duplicates, failed/lost acknowledgment, preference ownership and content-independent interruption.
Real browser tests exercise schema5-to6 preservation and rollback, Start/interrupt/abandon/preference write-receipt atomicity, UI controls and Retry, old Run compatibility, minimum viewport, new-Pilot real Pre-Run collection, launch and reload. Corrupted startup data enters recovery without replacing original Player Data.
Baseline before implementation: typecheck and74 prior headless tests PASS. Initial implementation regression: typecheck,102 headless and70 headed browser tests PASS. These counts precede review fixes; final totals must come from final-verification.log.

## Review and remediation record

All review rounds preserve the same original fixed point. Baseline captures earlier uncommitted work, not a replacement comparison base. ChatGPT runs separate logical axes sequentially; no provider or isolated dual pass is claimed. Frozen inventories include new/untracked files.

| Unit | Findings | Disposition and proof |
| --- | --- | --- |
| R1 | CS06-01 | Fixed: explicit allowlisted pinned-artifact recovery validates exact pins/digest and retains without default/LKG downgrade; actual old-cache eviction/HTTP Retry and negative content tests pass |
| R2 | CS06-02, AR06-01 | Fixed: compositor owns asynchronous Map-read recovery under its screen epoch; corrected pre-Dexie fault fixture proves the fault occurred and Retry restores Build |
| R3 | CS06-03 | Fixed: scoped Map/diagnostic layout and actual remaining-space Build layout fit1280x720/1366x768; document-bound tests and screenshots verify it |
| R4 | CS06-04 | Fixed: valid wall-clock timestamps are diagnostic, not lifecycle ordering; earlier-clock recovery test preserves Build/tiles and reaches interrupted |
| R5 | CS06-05, AR06-02 | Fixed: completed Start replay resolves its exact receipt and current Run instead of returning obsolete running state; public end/replay regression now passes |

Initial tri-axis: Standards PASS; Spec FAIL; Architecture FAIL; Security PASS. All initial axes were completed before review remediation. Interim reran all axes because content/persistence and lifecycle boundaries changed; it resolved R1-R4 and identified R5. No blocker was waived or acceptance criterion rewritten.

Evidence limitation: the first Map-read test patched the browser transaction method after Dexie captured it, so that failure did not establish the intended injected read fault. The corrected init script is installed before Dexie, armed only for Map selection and asserts the observed fault. A Windows grep argument containing a pipe also failed at command invocation; a character-class filter corrected the command. These were recorded, not treated as product passes.

## Risks and recovery

Attempt startup and its receipt publish atomically. Failed writes retain the original operation/seed/time and previous acknowledgment; exact Retry neither grants tiles nor creates duplicate Attempts. Recovery uses validated Player Data independently of content-cache availability and never restores exact combat state. End diagnostic is explicit abandonment with no victory reward.
Save v6 validates old ownership/receipts before its additive metadata/table publication. Historical migrations retain their literal versions. Tests and fault injection run only in separate Chromium contexts on strict loopback4201/4202, never personal saves.
Known old content can be restored through a static version-to-URL allowlist without making an old pack the new active default. The latest Attempt envelope is not a full historical archive. Future combat/Salvage/economy integrations require later approvals and their own evidence.

## Progress

- [x] Record Ticket05 acceptance and Ticket06/Q9 authorization.
- [x] Capture baseline and preserve earlier work and immutable content.
- [x] Implement Q9 content and Ticket06 in behavior-tested slices.
- [x] Complete initial full tri-axis, remediation and all-axis interim review.
- [x] Fix R5 and pass typecheck plus31 focused Ticket06 tests.
- [x] Final full tri-axis on a fresh frozen payload.
- [x] Final safe headless suite, headed development browser suite, production build/browser suite and screenshot inspection.
- [x] Final integrity/status report and archive this implementation plan after validation.

## Evidence and result

Evidence root: `.scratch/ticket06-development/`; immutable snapshots: baseline, review-initial, review-interim, and the final round when created. Logs retain real red/green proof and the initial regression. The final report is `docs/product/TICKET06_DEVELOPMENT_VERIFICATION.md`.
Current result is an implemented candidate with focused verification, not final user acceptance. Final engineering gate must be based on a fresh full tri-axis plus actual final executable results. Tickets07-12 remain ON HOLD regardless of the result.

## Final validation closeout

Typecheck PASS; 105 headless PASS; 75 headed development browser PASS; production build PASS; 40 headed production browser PASS. All five remediation units are resolved; final Standards, Spec, Architecture and Security assessments PASS within scope. Source/content/test payload remains unchanged after the final freeze. See docs/product/TICKET06_DEVELOPMENT_VERIFICATION.md and the final execution/integrity logs. User acceptance remains Pending; Tickets07-12 stay ON HOLD. No stage, commit, push or deploy.
