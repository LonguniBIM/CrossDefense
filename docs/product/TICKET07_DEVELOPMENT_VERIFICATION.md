# Ticket 07 - Deterministic Combat and Durable Collection: Development Verification

> Latest user disposition - 2026-10-10: Ticket 07 is Approved / User accepted. Ticket 08 is separately authorized development-only, with Q14 packaging/old-Run behavior Pending; Tickets 09-12 remain ON HOLD. All verification results and previous Pending statements below are preserved as the historical engineering record, not silently rerun or relabelled.

Date: 2026-10-10 (Asia/Bangkok)

## Disposition

**Implemented / Locally verified / ChatGPT tri-axis PASS - development-only.** Final user acceptance remains **Pending**. Tickets **08-12 remain ON HOLD**.

Q10-Q13 were explicitly approved. The original fixed point and current HEAD are fd945fae4916b8500245e74d75d65e331fb6ba43 on tech-selection-poc. No staging, commit, push, deployment, provider reviewer, review credentials, suspended orchestration or WFP/G-R/G-P action was performed.

The implementation and reviews existed before this reconnection. This continuation recovered the exact evidence state, completed missing executable verification, inspected screenshots and finalized documentation. It did not rewrite runtime code, tests or content.

## Implemented scope

| Area | Delivered behavior |
| --- | --- |
| Immutable content | development-combat-ship-v1 / development-combat-ruleset-v1, schema4; accepted SHIP starter, six spellings, diamond-13 geometry and empty assets preserved |
| Encounter | One Scout then one Boss, with the approved Player1200/Scout240/Boss480 Normal Hull values, 45/75-second limits and60-tick inter-encounter gap |
| Simulation | Shared60Hz board/combat clock; independently seeded Piece, payload-order and payload-cell streams; immutable startup inputs |
| Combat | Per-tile weapon/Support clocks, Q290-Q298 timing,1/10000 resource precision, exact intermediate mitigation, K100, Missile penetration and Laser Shield overflow |
| Threat | One point per actual lock; approved enemy damage tiers captured at activation, never changing gravity or retroactively changing in-flight damage |
| Collection |24 distinct Attempt-scoped payloads; only actual cleared cells collect; identity survives Hold/rotation; exhausted reservations produce reward-free pieces |
| Persistence | One transaction for a tick's payloads, terminal outcome and operation receipt; failure/lost-ack Retry does not repeat simulation or grant twice |
| Recovery | Reload returns to Build with committed loot, not exact combat resume; interruption/abandonment have independent durable nonpaying outcomes |
| HUD | Factual DOM presentation, equal active/Hold/Next cell sizes, Hull/Shield/Threat/time/shared ticks and acknowledgment-only harvest |
| Compatibility | Old Build and Q9 diagnostic Runs retain their original pins/capabilities; no automatic conversion into combat |

Save data contract v7 adds combatOperations and combatOutcomes. Real IndexedDB tests exercise additive migration, owner validation, transaction rollback, duplicate receipts and recovery. This is not a full backup/import or future economy implementation.

## Final executable evidence and provenance

| Gate | Observed result | Evidence |
| --- | --- | --- |
| TypeScript | PASS, exit0 | Fresh reconnect verification.log |
| Allowed headless suite |152/152 PASS in25 files, exit0 | Fresh reconnect verification.log |
| Development browser regression |94/94 PASS,239.306 seconds | Preserved final-complete-headed-results.json on the identical180-file payload |
| Production build | PASS,144 modules, exit0 | Fresh reconnect verification.log |
| Production browser regression |52/52 PASS,83.027 seconds, exit0 | Fresh reconnect production-results.json |
| Integrity and visual check | PASS;13 Ticket07 screenshots inspected | evidence-check.json and screenshot-inspection.json |

Production ran on isolated headed Chromium at127.0.0.1:4212, one worker, zero automatic retries. JSON records zero unexpected failures, skipped cases, flaky cases or report errors. All52 traces were retained; the report does not claim that every trace or predecessor screenshot was manually opened. The11 Ticket07 UI scenarios are included within the52 production cases, not additional tests.

The preceding production attempt did not finish: final-complete.log ends after21 logged passing cases, final-complete-production-results.json and final-complete-summary.json are absent, and the old PID was gone at reconnection. Its result remains INTERRUPTED, not PASS. The complete94-case development report was already saved. It was reused only after all180 reviewed files were verified unchanged. A new complete52-case production run was executed separately rather than inventing the missing summary or resuming at case22.

New evidence directory: .scratch/ticket07-development/reconnect-20261010-194307-778/.
Execution started19:43:07 and finished19:44:51 local time. The new runner exited0. Ports4211/4212 were not listening afterward.

## Review, remediation and re-review

The required sequence was initial full tri-axis, remediation, selective re-review, and fresh final full tri-axis. Standards and Spec remain distinct sub-verdicts of Code/Spec. Architecture and Security are separate logical axes. All assessments are sequential ChatGPT reviews; no genuinely isolated reviewer or provider dual-pass is claimed.

| Phase | Standards | Spec | Architecture | Security |
| --- | --- | --- | --- | --- |
| Initial review | PASS | FAIL | FAIL | FAIL for a Medium local-integrity invariant |
| Remediation and selective re-review | PASS | PASS | PASS | PASS in scope |
| Final review-final-complete | PASS | PASS | PASS | PASS in development-only scope |

| Finding | Severity and resolution |
| --- | --- |
| CS07-01 | Medium blocker: releasing a gameplay direction over an in-page control left movement held. Physical releases now clear gameplay input without hijacking native button activation; browser red/green evidence retained. |
| AR07-01 / SEC07-01 | Shared identity-invariant blocker; Security Medium. An enemy could alias the builtin player actor. The shared reserved identity is rejected by authoring/startup validation and direct battle construction; three negative tests and existing combat cases verify the repair. |
| CS07-02 | Low documentation inconsistency: approval notices still said fixture decisions were pending. Corrected without changing official acceptance criteria. |

Final review files are in .scratch/ticket07-development/review-final-complete/. Their pending-execution statements describe when those immutable reports were issued; executable-closeout.md and this report provide the later disposition. The reconnect check verifies exact payload identity; it is not misrepresented as a new independent review.

## Preserved verification failures and corrective work

Earlier failures remain in the record. The first full production run passed49/51; the next passed51/52. Completion was withheld both times. Three test-only corrections followed: deterministic frame control plus an explicit delayed-frame/Hold regression; a reproducible seed and deliberate legal-input cadence for the victory workload; and trusted native dragstart/dragover/drop preconditions for the outside-hull test. No HP, damage, gravity, top-out, placement or save rule was weakened to obtain PASS.

The exact prior native-drag failure and the early104/105 concurrent compiler baseline failure were not conclusively diagnosed. The old random-seed top-out cannot be exactly replayed because that seed was not retained. These limits are not erased by subsequent passing results. Final tests preserve all outcome, collection, compatibility, native-clock and error assertions.

## Screenshot inspection

All13 Ticket07 screenshots from the new production run were opened. No new blocking visual discrepancy was identified in these observations.

| Observation | Evidence |
| --- | --- |
| Live attack | Shared tick7, Player Hull1193.7 and Scout Hull230.18; no collection yet |
| Failed collection / Retry | Shared tick5 with0/24 acknowledged, then tick6 with2/24 and no Resume countdown; Retry preserved actual payload identities |
| Recovered loot | Unresolved Salvage blocks another Start instead of automatically keeping/discarding it |
| Viewport layout |1280x720,1366x768 and1920x1080 screenshots show board/Hold/Next/harvest and factual HUD; resize pause stays paused until explicit Resume |
| Whole Map victory | Fixed-seed legal-keyboard run reached Scout then Boss and saved victory at tick3673 with Player Hull620.4, Threat21 and20/24 collected; currency explicitly not granted |
| Timeout | Confirmed no-offense run ended at tick2700 with Timeout and0/24 collected |
| Actual initial flow | Real HTTP content plus earned Pre-Run starter entered combat and acknowledged10 payloads in this run |
| Native clock | Actual requestAnimationFrame advanced gameplay; Pause held both displayed clocks at tick28 |

Static images support the correlated assertions; they are not continuous observation or proof of universal balancing. The fixed-seed victory workload is a repeatable acceptance scenario, not a promise that every random input sequence wins.

## Compatibility, integrity and closeout

Before documentation closeout, all180 frozen files matched the final reviewed inventory;125 protected predecessor files had no drift. All six previous starter/Build/Q9 authoring and runtime artifact hashes remained unchanged. Official Ticket07 acceptance criteria and the five Tickets08-12 issue files were unchanged. HEAD remained at the original fixed point and the index was empty.

The new public and built-production combat manifest have the same file SHA-256:15b63c9e66f72c9764120e74bc7ae98d359a26e235940fdb7242c42bdbd726f5.

Documentation-only closeout updates the current status, records this report and moves the implementation plan to docs/plans/completed/ticket07-combat-collection.md. The frozen reports and prior failed/interrupted evidence remain intact. closeout.json identifies these documentation changes and verifies that no runtime/test/content drift was introduced.

## Deliberate boundaries and remaining evidence limits

This is a minimal DOM combat milestone. The2.5D renderer remains Ticket08. Reward values are authored but Credits/Celestium and First-Clear entitlement are not paid or consumed; victory settlement remains pending-ticket09. Salvage Keep/Discard/Apply also remains Ticket09. Consequently, collected unresolved Salvage legitimately blocks a subsequent Attempt. Do not bypass this blocker to demonstrate replay.

Native blur and controlled visibilitychange inputs were tested separately. The prior Windows automation experiment did not establish a native document.hidden transition. No hidden-tab guard was removed, and no native-hidden certification is claimed. Full target-browser/settings/accessibility coverage remains separately reviewable, including Ticket11. Offline service-worker completion, full content scale, final balance, other browser engines, formal accessibility and public-release readiness are not claimed.

**Next decision: user acceptance of Ticket07. No later ticket is automatically opened.**
