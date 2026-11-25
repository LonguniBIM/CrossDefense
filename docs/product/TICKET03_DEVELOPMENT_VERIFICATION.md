# Ticket 03 - Development Verification and ChatGPT Tri-Axis Review

Date: 2026-10-06, Asia/Ho_Chi_Minh.
Repository: D:\01_DCMvn\Workspace\CrossDefense.
Branch: tech-selection-poc.
Original fixed point and unchanged HEAD: fd945fae4916b8500245e74d75d65e331fb6ba43.

## Outcome

**Implemented / Locally verified / ChatGPT tri-axis PASS.** Final engineering gate: GREEN within the authorized Ticket 03 development-only scope. Final user acceptance is Pending. Tickets 04-12 remain ON HOLD. No staging, commit, push, deployment, provider reviewer, review credentials, blocked orchestration, WFP/G-R/G-P or provider round 6 was performed.

The user approved Q3-A and Q4 after requesting the next Ticket 03 step. This approves one stable seeded shuffle of the eight SHIP entries and reward-free pieces after all remaining payloads are reserved. No further gameplay-content default was invented and the SHIP artifact bytes are unchanged.

## Delivered behavior

| Area | Implemented behavior |
| --- | --- |
| Pool | Eight distinct entry identities; one saved deterministic order; no starting Cargo grants |
| Q4 reservation | Entries are issued once per transient board; when all remaining entries are on the board, in Hold or Next, new pieces contain no reward |
| Board | Seven-shape shuffled groups, three Next previews, Hold, Ghost, stable rotating payload cells, visible-row clear/collapse and post-clear top-out |
| Timing | Fixed 60 Hz domain ticks; 48-tick gravity, 3-tick Soft Drop, 9/3-tick horizontal repeat, 30-tick lock and maximum 15 grounded resets |
| Collection | Only cleared payload cells create collection operations; collected IDs, quota and receipt commit atomically |
| Failure/retry | Stop before the next tick; preserve the same pending operation and last committed UI data; Retry commits once |
| Recovery | Reload/top-out rebuilds only transient state, preserving original order and identities and excluding committed entries |
| Finish | Requires committed letters for the pinned starter plus Weapon; four arbitrary letters are insufficient; collection stops at quota exhaustion |
| Handoff | Explicit Finish saves phase=build and retained tiles; Build screen is a factual summary, not Ticket 04 placement |
| Presentation | Keyboard controls, equal board/Hold/Next cell sizes, all nine subtype counters, pause/focus/viewport guards and explicit countdown resume |

## Architecture and persistence

Domain rules are in src/domain/preRun/{seeded,salvage,board}.ts. PreRunApplication owns the live board, the durable barrier and retry/finish coordination. The renderer consumes copied projections and emits piece-targeted inputs. No mutable test hook, prototype runtime import, framework or dependency was added.

RunRepository and both adapters now expose atomic Pre-Run operations with fully bound receipts. Save schema v3 is an additive extension: it adds salvageOperations and optional Run salvage data without rewriting existing pinned Run versions, quota or Start receipts. Validation runs inside the version-change transaction before publishing the root schema. Tests cover v1 and v2 upgrades, corrupt legacy data and injected metadata-write failure.

The approved SHIP source and compiled manifest are unchanged. Whole-file SHA-256 remains:
99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe
The production-build copy has the same SHA-256.

## Review cadence and remediation

All rounds retain the same original fixed point. A separate pre-Ticket-03 worktree snapshot protects earlier uncommitted work. Each review round has an immutable file inventory and copies; tracked and untracked in-scope files are included. ChatGPT evaluated the axes separately and sequentially; no isolated dual-pass or external reviewer independence is claimed.

| Stage | Code/Spec | Architecture | Security |
| --- | --- | --- | --- |
| Initial full tri-axis | FAIL: one Standards and one Spec finding | PASS | PASS |
| Remediation | Two bounded units, with negative evidence | No contract expansion | No new trust boundary |
| Impact-selected re-review | PASS | PASS; public-entry validation/test seam changed | PASS; input validation changed |
| Mandatory final full tri-axis | PASS for Standards and Spec separately | PASS | PASS |
| Final executable verification | PASS, separate from reviewer verdicts | Not a substitute for tests | Not a security certification |

CS-01, Medium, FIXED: PreRunApplication.open did not itself compare the Run starter objective with pinned content. The new guard checks quota, targetWord and requiresWeaponTile before initialization. A public-entry regression first reproduced acceptance of a mismatched BOAT objective, then proved rejection without changing stored progress.

CS-02, Medium, FIXED: the minimum viewport scrolled vertically. Removing margins alone was insufficient. Targeted DOM measurement found 298px of fixed layout/header/harvest overhead; reserving 320px lets the board fit while preserving equal cells and readable controls. The same 1280x720 dimension/pause/countdown test now passes. Temporary diagnostics were removed and their evidence retained in the scratch directory.

No blocking finding was waived, no acceptance criterion was weakened, and no risk acceptance was inferred. During initial development, real IndexedDB tests also caught object-key-order-dependent pool comparison; that was replaced by fieldwise ordered identity comparison before the first tri-axis candidate.

## Verification actually executed

| Check | Final result |
| --- | --- |
| Baseline existing headless suite and typecheck | PASS: 22 tests |
| Final allowed headless suite | PASS: 39 tests in 10 files |
| Final Chromium suite on development build | PASS: 25 tests in 9 files |
| Final production-build browser suite | PASS: 7 tests |
| TypeScript typecheck | PASS |
| Production build | PASS: 120 modules; index-Bh-KuRuG.js and index-BwtNy-kG.css |
| Frozen final payload | 87 files checked; zero drift |
| Protected pre-existing files | 60 checked; zero unexpected changes |
| Official Ticket 03 acceptance text | Unchanged |
| Git index / HEAD | Empty index; original HEAD unchanged |

The browser scenario uses real keyboard events and the actual compiled SHIP HTTP artifact. The deterministic test player selects legal actions from the read-only DOM; it does not insert board cells or grant rewards. A controlled animation-frame boundary makes the long interaction reproducible. The test clears all eight entries, injects an IndexedDB receipt failure, proves unchanged quota until Retry, verifies the same receipt identity, reloads committed progress, finishes and reloads the saved Build state.

Other tests directly cover the pure board and public Application/persistence seams, including an actually reached top-out/reset branch. Browser contexts are disposable, with dedicated loopback servers on ports 4179/4180 and server reuse disabled. No personal browser profile or save was used. Production screenshots at 1280x720 and the collected state were inspected. This is not a hardware-performance or formal accessibility certification.

## Evidence and reproduction

Evidence root: .scratch/ticket03-development/.
Round records: review-initial/, review-interim/, review-final/ (briefs, separate raw axis reports, inventories and source copies).
Final log: final-verification.log, ending with TICKET03_FINAL_VERIFICATION_EXIT=0.
Scope/fingerprint check: final-scope-check.json.
Failure evidence: pool-red.log, collection-red.log, board-red.log, application-red.log, persistence-red.log, ui-red.log, review-objective-red.log and layout-diagnosis.log.
Screenshots: browser-production/.

```powershell
npm run typecheck
npm test -- --run tests/headless/pilot-scenario.test.ts tests/headless/content-pack-scenario.test.ts tests/headless/start-run-scenario.test.ts tests/headless/ticket02-content-boundary.test.ts tests/headless/ticket02-content-codec.test.ts tests/headless/ticket02-compiler-cli.test.ts tests/headless/ticket02-ship-pack.test.ts tests/headless/ticket03-salvage-domain.test.ts tests/headless/ticket03-board.test.ts tests/headless/ticket03-application.test.ts
npm run test:e2e -- --config .scratch/ticket03-development/playwright.config.ts tests/e2e/ticket-01.spec.ts tests/e2e/ticket-02.spec.ts tests/e2e/ticket-02-migration.spec.ts tests/e2e/ticket-02-recovery.spec.ts tests/e2e/ticket-02-receipts.spec.ts tests/e2e/ticket-02-ship-pack.spec.ts tests/e2e/ticket-03-persistence.spec.ts tests/e2e/ticket-03-migration.spec.ts tests/e2e/ticket-03-ui.spec.ts
npm run build
$env:TICKET03_BUILD = '1'
npm run test:e2e -- --config .scratch/ticket03-development/playwright.config.ts
```

Provider/orchestration test files were intentionally excluded. No repository-wide, CI, hosted deployment, full offline-milestone or complete security-audit claim is made. Existing LF/CRLF configuration warnings remain; whitespace checks reported no errors.

For a local manual check, run npm run dev from the repository root, create or continue a Pilot, Start Run, then Continue Salvage. Arrow keys move/drop, X or Up rotates clockwise, Z rotates counterclockwise, Space hard-drops, C or Shift uses Hold, and Escape pauses. Finish appears only after the committed starter requirement is met.

## Remaining boundary

Ticket 04 ship placement, full Build tools, combat, permanent progression, Review gameplay, production offline delivery and final visual/accessibility certification are not implemented here. The selected development pack is not final game balance. Final acceptance remains the user's decision; no later ticket was opened automatically.
