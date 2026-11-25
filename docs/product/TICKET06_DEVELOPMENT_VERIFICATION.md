# Ticket 06 - Launch and Recover a Map Attempt: Development Verification

> Latest user disposition - recorded 2026-10-08: Ticket 06 is Approved / User accepted. Ticket 07 is separately authorized development-only; its fixture decisions remain pending. Tickets 08-12 stay ON HOLD. The evidence and earlier Pending wording below describe the historical verification checkpoint and are preserved, not rerun or relabelled.

Verification date: 2026-10-07; Windows local test logs.
Repository: D:\01_DCMvn\Workspace\CrossDefense.
Branch: tech-selection-poc.
Original fixed point and unchanged HEAD: fd945fae4916b8500245e74d75d65e331fb6ba43.

## Outcome and authority

**Implemented / Locally verified / ChatGPT tri-axis PASS**, restricted to Ticket06 development-only and explicit Q9 approval. Final user acceptance of Ticket06 remains **Pending**. Tickets04/05 are User accepted; Tickets07-12 remain ON HOLD. No prior Ticket02/03 acceptance is inferred.

The new Map is **launch/recovery-only**, not playable combat. It has no invented enemies, HP, damage, encounter timer, Threat, boss, rewards, mitigation K, learning data or assets. See DEVELOPMENT_ATTEMPT_SHIP_V1.md for the approved contract.

## Delivered behavior

| Area | Implementation and observed proof |
| --- | --- |
| Content | New development-attempt-ship-v1, Ruleset development-attempt-ruleset-v1, schema3, one initially available development-map-01 named Map 1 - Development |
| Inheritance | SHIP quota8, original eight retained-tile definitions, diamond13 hull, six spellings, exact hundredths Word/Power and empty assets; old source/runtime artifacts unchanged |
| Map/difficulty | Build header opens Map selection; Easy/Normal/Hard/Insane; new/legacy unset preference displays Normal and each explicit Pilot choice is durably saved |
| Hard blockers | Current insufficient Power, unresolved Salvage, invalid or incompatible saved state/pins/Map and the accepted minimum viewport prevent launch |
| No offense | Explicit Start anyway confirmation; confirmation cannot override hard blockers; unsupported SHI is not an additional launch blocker |
| Start admission | Same-turn queued Build edits and Attempt startup exclude each other; history clears only after durable startup acknowledgment |
| Frozen startup | Persisted copied hull, retained identities, positions, Build revision, content digest, Map/difficulty, seed and versions; no live mutable Build or simulated combat state |
| Duplicate/retry | Exact request/command receipts prevent another Attempt; failure and lost acknowledgment retain startup identity; completed replay resolves current saved state rather than an obsolete running projection |
| Diagnostic | Truthful paused launch/recovery screen; explicit End diagnostic confirmation produces abandoned, not victory |
| Reload recovery | Owned bootstrap marks running as interrupted and returns to Build without changing layout, retained tiles or quota, even when the pinned cache is unavailable |
| Fault handling | Atomic Start/end/preference receipts; failed migration/write preserves previous data; visible Recovery/Retry; invalid startup data does not become an empty new Workspace |
| Old Runs | Remain pinned and editable; do not borrow the new Map. Explicit Retry can restore a known evicted old artifact without changing the current default or Last Known Good |

Layout remains durable and editing history remains transient. The actual successful Attempt-start boundary now invokes the Ticket05 history-clearing contract. The unresolved Salvage Buffer field is a launch-validation input only; its production collection/Keep/Discard/Apply workflow remains later scope.

## Save and compatibility

Data contract v6 adds attemptOperations and optional Pilot difficulty/Run startup inputs. Its migration validates the existing v5 root, owners, state and receipts before publishing metadata/table creation. Existing Run pins, layout, quota, retained entries and receipts are not rewritten. Historical migrations retain their literal versions; failures roll back the entire upgrade.

Start, interrupt, abandon and difficulty each commit state plus their exact receipt in one IndexedDB transaction. Recovery depends on valid saved identity/status and canonical relationships, not on the order of diagnostic wall-clock timestamps; a device-clock correction cannot trap a valid Attempt in running state.

The stored envelope describes the latest diagnostic Attempt and its startup inputs, not a full Attempt archive or exact mid-battle save. There is no victory or learning-reward mutation in this ticket.

## Review workflow and findings

Every round used the immutable original fixed point and one frozen source/content/test inventory. A pre-ticket worktree snapshot protected preceding uncommitted work without redefining the comparison base. ChatGPT evaluated separate logical axes sequentially; no independently isolated reviewer context, dual pass or provider review is claimed.

| Stage | Standards | Spec | Architecture | Security |
| --- | --- | --- | --- | --- |
| Initial full tri-axis | PASS | FAIL | FAIL | PASS |
| Remediation and all-axis interim re-review | PASS | FAIL: new replay finding | FAIL: current-state ownership | PASS |
| Mandatory final full tri-axis | PASS | PASS | PASS | PASS within reviewed scope |

| Finding / unit | Severity | Resolution and actual proof |
| --- | --- | --- |
| CS06-01 / R1 | Medium blocker | Known pinned artifact restoration validates exact version/Ruleset/digest and retains without default/LKG downgrade; actual old-cache eviction, HTTP Retry and negative/collision cases pass |
| CS06-02 + AR06-01 / R2 | Medium / strong architecture blocker | The screen compositor catches Map-selection read faults after disposing the old Build; corrected pre-Dexie fault injection proves Recovery and Retry restore the same Build |
| CS06-03 / R3 | Medium blocker | Scoped Map/diagnostic layout plus remaining-space recovered Build layout fix minimum/reference overflow; assertions and screenshots cover1280x720/1366x768 |
| CS06-04 / R4 | Medium blocker | Valid wall time is diagnostic, not lifecycle ordering; recovery with an earlier injected timestamp preserves Build/tiles and reaches interrupted |
| CS06-05 + AR06-02 / R5 | Medium / strong architecture blocker | A completed Start replay reads current receipt-bound state; public Start -> end -> same Start regression now returns ended Build without a second active Attempt |

All five root-cause units are **FIXED**. No in-scope blocker, content decision or risk was waived. All-axis interim re-review was necessary because content retention changed a storage/network-facing seam and recovery changed lifecycle ownership/validation. Final full review ran on a fresh payload regardless of interim coverage. Executable verification remained separate.

Evidence caveats are retained: one grep invocation failed at the Windows command parser because of a pipe and was corrected with a character class. The first Map-read test patched transaction after Dexie had captured the method; that failure did not prove the intended injected fault. The corrected init-script fixture is installed first, armed only for Map selection and asserts that the fault was observed. Neither issue was counted as a product pass or hidden by a retry policy.

## Final executable verification

| Check | Actual final result |
| --- | --- |
| Strict TypeScript typecheck | PASS |
| Allowed headless suite | 105/105 PASS in18 files |
| Headed Chromium development suite | 75/75 PASS; 6.05 minutes; zero failed/skipped/flaky |
| Production build | PASS |
| Headed Chromium production suite | 40/40 PASS; 2.23 minutes; zero failed/skipped/flaky |
| Aggregate process | TICKET06_FINAL_VERIFICATION_EXIT=0 |
| Development evidence | 75 trace archives; 34 screenshots |
| Production evidence | 40 trace archives; 34 screenshots |

Both browser suites use one worker, zero retries, trace enabled, separate Chromium contexts and strict loopback4201/4202. They do not use personal browser profile/save data at4175. The development suite includes real IndexedDB transaction and migration scenarios; production exercises the built UI and actual HTTP artifacts. The real Q9 scenario creates a Pilot, starts a pinned Run, earns the quota by actual Pre-Run keyboard play, places SHIP, launches the diagnostic and reloads into the same recovered Build.

UI evidence includes Map/difficulty, the explicit no-offense dialog, Power/Salvage blockers, startup/preference/recovery failures, paused diagnostic, actual earned-starter path, old pinned-content restoration and recovered layout. Minimum/reference bounds are behavior checks, not formal accessibility or universal device certification.

## Scope and integrity

Final review froze 152 files with zero source drift before documentation closeout. 101 earlier files outside the intended change remained unchanged. The ticket delta is 33 changed existing files and 18 additions, including the isolated test configuration and content/contract files. Final report creation and implementation-plan archival are documentation closeout, not unreviewed runtime edits.

Official Ticket06 acceptance text remains unchanged. All 6 issue files for Tickets07-12 remain unchanged. The Git index is empty, branch/HEAD are unchanged, and no stage, commit, push, deploy, new dependency, provider reviewer, review credential, blocked orchestration or WFP/G-R/G-P operation was used.

| Artifact | SHA-256 |
| --- | --- |
| Original starter runtime, unchanged | 99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe |
| Original Build runtime, unchanged | d5e8541107f99c0facb95a9496fd664a14d440a5b7697af21b440e7ba0f7e7fc |
| New Attempt runtime | 7636819b01fc9ee0a729ec356909cac73a6ce092996954c1692e4cfeffe293a6 |
| Production Attempt artifact | 7636819b01fc9ee0a729ec356909cac73a6ce092996954c1692e4cfeffe293a6 |

## Evidence and reproduction

Root: .scratch/ticket06-development/.
Final execution: final-verification.log and final-verification-summary.json.
Machine-readable browser results: final-headed-results.json and final-production-results.json.
Browser artifacts: final-headed/ and final-production/.
Frozen rounds: baseline/, review-initial/, review-interim/, review-final/ with inventories, exact scope, raw axis reports and synthesis.
Integrity: final-scope-check-pre-closeout.json and final-scope-check.json.
Implementation plan after validation: docs/plans/completed/ticket06-launch-recovery.md.

Reproduce via the existing .scratch/ticket06-development/playwright.config.ts, with TICKET06_PRODUCTION=0 for development and1 after npm.cmd run build for the production UI suite. Use --headed --workers=1 --retries=0 --trace=on and a new output directory. Do not edit watched source/config during browser execution, overwrite prior evidence, or run provider/orchestration test suites.

## Remaining boundary

This delivers Ticket06, not Ticket07 combat or a public playable release. No encounter catalog, rewards, final tuning, renderer expansion, full backup/import, CI/branch protection, vulnerability audit, formal accessibility, publisher authentication or security certification is claimed. A schema upgrade was verified using disposable browsers, not fault-injected personal saves. New Map demonstration uses a new Run pinned to the new pack; existing Build Runs retain their original capability.

**Final engineering gate: PASS for the reviewed development-only scope. Final user acceptance: Pending. Tickets07-12: ON HOLD.**

## Continuation verification and report closeout - 2026-10-07

The previous session completed implementation, the final full tri-axis and the full executable suites, but stopped before creating this report and archiving the plan. This continuation read the actual source, raw axis reports, logs and JSON results, and confirmed that the live 152-file payload still matches the final review snapshot. It did not repeat or claim a new independent review, and did not rewrite runtime code or content.

Fresh verification in `.scratch/ticket06-development/resume-20261007-171429-469/` completed at 17:15:09 +07:00: strict typecheck PASS; 105/105 allowed headless tests PASS; 15/15 Ticket06 UI tests PASS in 32.4 seconds on the existing production build using headed isolated Chromium. One worker, zero retries, traces enabled, exit code0. These 15 tests are a focused rerun, not additional unique tests to add to the 40-test production suite.

All18 screenshots from this fresh run were opened and inspected: Map/difficulty; diagnostic; interrupted Build; Power and Salvage blockers; no-offense confirmation; old Map unavailable; restored old pack; Start/preference/recovery failures; minimum Map layout; both diagnostic viewport sizes; both recovered Build sizes; real-Q9 diagnostic and recovered Build. No new blocking issue was observed. The Build center retains its permitted bounded inner scrolling at1366x768; no blanket no-scroll or accessibility-certification claim is made.

`summary.json` records no frozen-file drift, unchanged HEAD, empty index and zero remaining test-port listeners. Full-suite prior evidence remains preserved in its original directories. The new report and archived implementation plan are the only product-document closeout outputs; runtime, tests, packages, old Runs and immutable content were not modified in this continuation.

Final user acceptance of Ticket06 remains Pending. Tickets07-12 remain ON HOLD. No stage, commit, push or deployment is authorized by this closeout.
