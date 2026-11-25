# Execution Plan: Ticket 07 - Deterministic Combat and Durable Collection

Recorded: 2026-10-08 on DESKTOP-DBD6QJO.

## Status and authority

Ticket 06 is Approved / User accepted by explicit user instruction. Ticket 07 is authorized development-only. Tickets 08-12 remain ON HOLD. Q10-Q13 are explicitly approved by the user on 2026-10-09. Implementation, ChatGPT tri-axis review and final executable verification are complete in development-only scope. Final user acceptance remains Pending; see docs/product/TICKET07_DEVELOPMENT_VERIFICATION.md.

Original fixed point and verified HEAD: `fd945fae4916b8500245e74d75d65e331fb6ba43`; branch `tech-selection-poc`. Prior uncommitted work must be preserved. No stage, commit, push, deploy, provider reviewers, review credentials, blocked orchestration, WFP/G-R/G-P or rerouting of refused operations is authorized.

This is the single active continuation plan. It does not change official acceptance criteria or replace the required implementation review with a planning PASS.

## Outcome

One development Map runs Falling Blocks and deterministic auto-battle together behind a factual DOM HUD. An actual cleared payload is committed once to the Run's unresolved Salvage Buffer. Both simulations stop during pause or a durability barrier. Eligible final-tick payloads and the terminal outcome commit atomically, including simultaneous-failure precedence. Ordinary successful writes resume without a countdown; explicit pause still requires explicit resume.

## Sources inspected

| Source | Governing evidence |
| --- | --- |
| `.scratch/first-durable-playable-slice/issues/07-play-a-map-with-deterministic-auto-battle-and-durable-collection.md` | Approved acceptance criteria; reviewed encounter/Threat/reward fixture is still a prerequisite |
| `docs/product/IMPLEMENTATION_SPEC.md` and `IMPLEMENTATION_BREAKDOWN.md` | Fixture gate; minimal DOM HUD in Ticket 07; Three.js in Ticket 08; reward settlement and Salvage Apply in Ticket 09 |
| `docs/product/COMBAT_TIMING.md` | Q290-Q298 cadence, flight times, active windows, target loss, regeneration, damage-before-terminal ordering and experimental activation magnitudes |
| `docs/product/FALLING_BLOCKS_DESIGN.md` | Q299-Q319 board/input rules, 60 Hz accounting, separate RNG streams, lock/clear/top-out order and final-tick collection |
| `docs/product/MVP_SPEC.md` | Word/Power, difficulty ratios, damage order, Cargo/Salvage, interruption and progression boundaries |
| `docs/architecture/TECHNICAL_ARCHITECTURE.md` | Fixed-step Domain, bounded catch-up, immutable startup, transaction/receipt boundaries and explicit numeric policy |
| `docs/product/DEVELOPMENT_PACK_FIXTURE_INVENTORY.md` | Combat rounding/K, encounter/Threat, Map payload distribution and reward fixtures are not yet selected |
| `docs/product/DEVELOPMENT_ATTEMPT_SHIP_V1.md` | Q9 is launch/recovery-only; its bytes and existing Run pins cannot be converted into combat |
| `src/domain/preRun/board.ts`, `seeded.ts`, `src/application/preRun/PreRunApplication.ts` | Existing pure board stepping, separate shape/cell RNG, finite payload supply and acknowledged collection seam |
| `prototypes/fixed-camera-renderer/review/model.mjs`, `attempt.mjs`, `README.md` | Disposable prior art only: illustrative K=100, fixture Hull and cosmetic Threat; not production authority or a module to import |

## Already settled - do not ask again

Keep the SHIP Pre-Run with quota 8, eight original tile definitions, diamond-13 hull geometry, six supported spellings, Technology Level 1, existing hundredths Word/Power arithmetic and empty assets. Keep all accepted board controls, rotations, Hold/Next/payload identity, 60 Hz tick accounting and shared pause rules.

Keep Ballistic 8 damage every 0.8 seconds with 0.1-second impact; Missile 36 every 3 seconds with 0.4-second impact; Laser 21.6 across 0.6 seconds with a 2.4-second cycle; Shield 2 per pulse after its shared delay; Support 3 per injury-triggered 3-second cycle. Bonuses alter magnitudes, not timing. Keep passive Armor/System/Engine/Power, target-loss rules and no banking.

Keep Easy/Normal/Hard/Insane and their approved ratios, Normal default, explicit per-Pilot difficulty, no supported-word launch requirement, no-offense confirmation and hard Power/Salvage blockers. Keep interrupted recovery rather than exact combat resume. No free equipment grants are introduced.

## Approved decisions - Q10-Q13 (2026-10-09)

The user explicitly approved all four proposals below. Their original values are retained as the authoring contract. They are development hypotheses, not claims of final balance.

### Q10 - Versioned combat pack and numeric policy

| Item | Proposed definition |
| --- | --- |
| Content / Ruleset | `development-combat-ship-v1` / `development-combat-ruleset-v1` |
| Content capability | Explicit schema 4 combat definitions; retain schema 1/2/3 readers and their original behavior |
| Map identity | `development-map-01`, display `Map 1 - Development`, scoped to the new immutable content |
| Inheritance | Exact approved Pre-Run, hull geometry, six spellings, Word/Power rules and assets `[]` |
| Compatibility | New Runs pin the new pack; old Build and diagnostic Runs remain on their old capabilities and never borrow combat definitions |
| Combat arithmetic | Integer ticks at 60 Hz; resource/rating precision 1/10000; exact integer/rational intermediate calculation and positive half-up rounding at resource-effect boundaries; no UI rounding or epsilon-based life/death rules |
| Mitigation | K=100 for Engine, System and Armor; received fraction K/(K+rating), in the accepted damage order |
| Weapon modifiers | Exact 25% Missile Armor-rating penetration; Laser x1.5 against Shield only; overflow is converted back to unamplified damage before Armor/Hull |
| Laser accounting | Allocate total active-window damage over 36 ticks using cumulative integer allocation, preserving the rounded total without losing per-tick remainders |

Build's existing hundredths precision is unchanged; combat uses greater internal precision to avoid coarse per-tick damage loss. Only an actual positive resource loss resets Shield recharge. Any safe-range arithmetic limit must reject invalid content rather than silently clamp or overflow. Native exact-integer implementation details may vary without changing this policy.

Resolve events deterministically using immutable event/tile identities for ties. Gather due attacks from both sides before evaluating the combined terminal outcome; never let iteration order erase mutual destruction. Final executable tests must prove threshold and tie cases.

### Q11 - Minimal encounter and Threat fixture

Use one ordinary opponent followed by one boss, never two concurrent enemy targets. No enemy has an invented supported word or multiplier. Both use the existing diamond-13 geometry and Level-1 module magnitudes.

| Entry | Normal Hull HP | Canonical equipment and coordinates | Active-encounter time limit |
| --- | ---: | --- | ---: |
| Player | 1200 | Exactly the user's saved equipped tiles; no bonus equipment | Not a separate player timer |
| Scout (`development-scout-01`) | 240 | S/Ballistic at B2; H/Armor at C3; I/Power at C4 | 45 seconds |
| Boss (`development-boss-01`) | 480 | P/Missile at B2; S/Shield at D2; H/Armor at C3; I/Power at B4 and D4 | 75 seconds |

These positions produce no three-letter contiguous supported enemy word. Scout has Power 3/1; Boss has Power 6/4 and Shield 25 before any future balance change. All enemy tile IDs are distinct. Player starts with full Hull and derived full Shield; enemies start full. Player damage, Shield, cooldowns and Support state persist across encounters; there is no between-encounter refill.

After Scout dies, wait 60 simulation ticks with no enemy target, then spawn the boss. The board, existing weapon deadlines and legal repair/regeneration continue during the gap; no attacks are banked. Existing projectiles keep their original target and deadline, do not retarget, and are not cancelled merely because their source was destroyed. No new targeting, range, movement or module-destruction mechanic is added.

An encounter timer begins at its spawn and pauses with the shared clock. Expiry is evaluated with the accepted failure-before-victory rule after due hits and board events. Victory requires the boss to be destroyed while no higher-priority failure applies. There is no empty encounter or auto-win fallback.

Apply the approved difficulty Hull multiplier to enemy Hull only and the damage multiplier to enemy outgoing damage; derived Shield capacity, regeneration, cooldowns, Player Hull and board gravity are unchanged. This proposed application detail is explicit rather than an accidental implementation default.

Threat starts at 0 and increases by 1 for each actual piece lock, including a lock that clears rows. Hold and line clear alone do not increase or lower it. Proposed enemy damage factor: `1 + 0.10 * min(5, floor(Threat / 20))`, capped at x1.50. Threat does not alter Hull, Shield, gravity or cooldowns. Capture this factor at weapon activation, including an entire Laser active window, so later locks do not retroactively modify an in-flight attack. The display still shows the actual lock-derived Threat beyond 100.

Rationale: two opponents exercise target loss and sequence boundaries with little content; a generous development Player Hull leaves time to observe collection. This is intentionally a short test Map, not the full-MVP 4-6-minute balance target. No win-rate, duration or balance guarantee is claimed before playtesting.

### Q12 - Finite Map payload fixture, separate from Pre-Run

Use 24 distinct payload entries per Attempt: the following twelve definitions repeated twice, then shuffled once using a Payload RNG stream independent of the seven-shape Piece RNG. The existing Pre-Run quota stays 8 and Cargo Capacity stays 24.

| Four-entry group | Proposed letter/subtype definitions |
| --- | --- |
| A | S/Ballistic; H/Armor; I/Power; P/Armor |
| B | S/Missile; H/Shield; I/Power; P/System |
| C | S/Laser; H/Engine; I/Power; P/Support |

The resulting pool has Ballistic 2, Missile 2, Laser 2, Armor 4, Shield 2, System 2, Engine 2, Power 6 and Support 2. This gives all nine subtype collection paths without adding vocabulary spellings. These new letter/subtype pairings are part of Q12, not silently inherited from Q9.

Each generated piece has one payload-bearing cell until all 24 entries have been reserved across the board/active/Hold/Next supply; later pieces carry no reward. Each occurrence has an Attempt-scoped unique identity. Payload position uses its own deterministic stream; Hold/rotation preserve identity and never redraw rewards. Difficulty and enemy transitions do not change the pool.

Only clearing the actual payload cell commits that entry, and multiple cleared payloads in one tick form one outcome. Newly collected entries go to unresolved Salvage Buffer, not current equipment or retained Cargo. No Blueprint, Credits or Celestium is a falling payload in this development pack. This explicit fixture restriction does not remove those later MVP capabilities.

### Q13 - Outcome/reward fixture and the Ticket 09 boundary

Propose authoring the following reward data in the new pack now so the encounter/reward fixture is complete, while leaving currency mutation and full results/Salvage UI to Ticket 09.

| Reward definition | Proposed amount and rule |
| --- | --- |
| Repeatable victory | Base 4 Credits, 0 Celestium; approved difficulty ratios give 3/4/6/9 Credits |
| First-Clear bonus | Additional 20 Credits + 1 Celestium, once per Pilot/Map, not per difficulty and not reset by republishing a pack |
| First victory composition | Repeatable amount plus the one-time bonus; later victories receive only the repeatable amount |
| Failure/abandon/interruption | No victory or First-Clear reward; retain only already committed eligible payloads |
| Per-enemy kill | No separate reward; only the complete Map outcome is eligible |

Ticket 07 records a factual terminal outcome plus exact frozen reward-definition references, but does NOT mint Credits/Celestium, consume First-Clear entitlement or claim rewards paid. Pending outcomes must remain recoverable independently of the latest Attempt envelope so Ticket 09 can settle exactly once later. Publishing reward data does not authorize Ticket 09 implementation.

Until Ticket 09 is opened, collected items stay unresolved; a later Start remains blocked when Salvage Buffer is nonempty. Do not auto-keep, auto-discard or bypass this condition to make repeated play convenient. Baseline and smoke use disposable Runs. The HUD must distinguish `outcome saved` from `reward settlement unavailable in this development stage`.

## Implementation approach after approval

| Slice | Observable result and verification |
| --- | --- |
| S1 - Real combat content admission | Compile approved source deterministically, validate every required field, pin new Runs, preserve all old artifacts/Run capabilities; negative missing/invalid/collision tests |
| S2 - One live encounter through the public seam | Frozen startup produces actual Hull/Shield and timed attacks in the DOM HUD; exercise every subtype, target loss, penetration, Shield overflow and repair with deterministic scenarios |
| S3 - Shared board and combat clock | Real keyboard locking changes Threat while separate Piece/Payload streams remain reproducible; prove pause/barrier/lag cannot advance either simulation |
| S4 - One real clear and one terminal tick | Real IndexedDB atomically commits cleared payloads, terminal outcome and operation receipt; fault injection, lost acknowledgment, duplicate Retry and terminal-tick ties preserve exact identities |
| S5 - Whole Map, reload and minimal handback | Scout -> boss -> outcome; reload returns to Build with committed loot; unresolved Salvage remains blocked; old diagnostic/Build Runs remain usable; real-browser and minimum-viewport proof |
| S6 - Review/remediation/final proof | Initial full tri-axis, bounded fixes, selective re-review and mandatory final full tri-axis; final safe headless, headed development and built-production runs with screenshots |

Work in red/green behavioral slices rather than writing the entire simulator before tests. Reuse production board/seed/input seams where behavior matches; do not import throwaway prototype modules or add a general engine/framework. Application owns admission, clock/barrier and pending operation; Domain owns pure simulation; repositories own atomic storage; views only emit intents/render copied projections.

Saved schema changes must be additive and versioned, with actual rollback/migration proof. Keep compact canonical inputs, committed payload identities and essential terminal receipts, not exact combat-resume state or a general event-sourcing log. No unreviewed configuration default substitutes for missing content.

## Review and verification contract

Use the same original fixed point throughout. Capture tracked/untracked in-scope inventory and a pre-edit snapshot protecting earlier work; the snapshot is not a new Git comparison base. Freeze one payload per round. Standards and Spec are separate sub-verdicts of Code/Spec; Architecture and Security are separate logical axes. ChatGPT-only sequential assessments do not claim genuinely isolated reviewers or a provider dual pass.

Complete all initial axes before remediation. After each coherent fix batch, run focused tests and Code/Spec; rerun Architecture for state/clock/transaction/interface changes and Security for validation/persistence/content/permission changes. Run all three axes again on the final candidate regardless of interim coverage. Do not waive a blocker or replace acceptance criteria to get PASS.

Final proof must include different frame schedules with identical seed/input digests; no background catch-up; no collection from Hold/Next alone; multi-payload and terminal-tick atomicity; loss/retry exactly once; clocks stopped during a failed save; ordinary commit success without countdown; manual pause not cancelled by save acknowledgment; all subtype timers and mitigation; migration/old-content preservation; actual HTTP pack and earned-starter play; error-state and viewport screenshots.

Use isolated headed Chromium and strict loopback servers, one worker and zero automatic retries. Reuse inspected test commands; do not use personal saves, run suspended provider/orchestration tests, install packages or change firewall/network configuration. More test runs do not count as independent reviews.

## Baseline evidence already collected

Evidence: `.scratch/ticket07-readiness/baseline-20261008-035612-600/`.
Fresh typecheck PASS; allowed headless suite 105/105 PASS in 18 files; Ticket 06 UI smoke 15/15 PASS in 37.8 seconds on isolated headed Chromium development server 4201, one worker, zero retries, traces enabled. All commands exited 0; 153 inventoried files were unchanged during the run; HEAD/index unchanged; no test-port listener remained.

Six screenshots were opened and inspected: Map selection, paused diagnostic, interrupted Build, insufficient-Power blocker, no-offense confirmation and real-Q9 earned-starter recovery. Existing bounded Build-panel scrolling is not relabelled as a new defect or a blanket no-scroll pass.

These results verify the predecessor baseline, NOT Ticket 07 combat. Production build/full-suite final verification and Ticket 07 tri-axis verdicts remain pending.

## Progress and next action

- [x] Re-establish the correct device, repository, branch and original fixed point.
- [x] Read accepted behavior, current production seams and prototype limitations.
- [x] Run fresh predecessor verification and inspect selected screenshots.
- [x] Record Ticket 06 acceptance and Ticket 07 development authorization in project status.
- [x] Prepare concrete Q10-Q13 proposals without changing runtime/content/tests.
- [x] Obtain explicit approval of Q10-Q13 (2026-10-09); no values changed.
- [x] Implement Ticket 07 in verifiable slices, then complete tri-axis and executable gates.
- [ ] Obtain final Ticket 07 user acceptance; do not automatically open Ticket 08.

Historical readiness result: implementation in progress under explicit Q10-Q13 approval. The prior readiness evidence is historical. Baseline: typecheck PASS; first concurrent headless run 104/105 (Q9 compiler case failed); focused diagnostic rerun 9/9 PASS without source changes. Cause not yet established; do not label that initial suite a PASS. Final full verification remains required.

## Continuation review - 2026-10-10

The saved implementation was resumed rather than rewritten. A fresh frozen initial payload captures 179 files, including 23 changed and 27 added files relative to the protected pre-ticket worktree. Original fixed point/HEAD remain unchanged. Fresh strict typecheck, 149 allowed headless tests (one worker) and nine headed Ticket07 UI scenarios passed. Earlier 104/105 baseline and native-hidden-state evidence limitations remain in the logs; the baseline cause is not inferred from later passing runs.

All initial logical axes completed before review remediation: Standards PASS, Spec FAIL, Architecture FAIL and Security FAIL for a Medium local data-integrity invariant, not a remote Critical/High vulnerability. R1 (CS07-01) reproduced a held movement key after release over a focused button (pivot expected5, actual8); keyup now clears gameplay state without hijacking native button activation, and the focused browser test passes. R2 (AR07-01/SEC07-01) reproduced an enemy ID aliasing the builtin Player in compiler, saved startup and direct battle construction; a shared reserved actor ID is now enforced and all three negative cases plus 24 existing content/combat tests pass. R3 (CS07-02) corrects stale approval status only; official acceptance text is unchanged.

An additional native-requestAnimationFrame smoke test is included to distinguish real browser clock operation from controlled deterministic frame fixtures. The refreshed interim/final tri-axis and full development/production regression results must be recorded before the engineering gate is complete. No later ticket, provider workflow, commit, push or deployment is authorized.

## Production verification correction - 2026-10-10

The first final executable gate was not clean: typecheck/headless/development/build passed, but production finished49/51 with two failures. Preserve its final-verification.log, JSON, traces and screenshots. No PASS closeout was made from that run.

PV07-01: the prior uncontrolled-clock Hold test ran while the accepted delayed-frame guard had paused Pre-Run. The test now uses its existing deterministic clock for input semantics; a separate new test proves that lag discards queued Hold, preserves quota, and requires explicit Resume before Hold works. Native-clock combat smoke remains unchanged. PV07-02: a random-seed, high-rate hard-drop workload top-outed at Boss; the victory expectation had no reproducible seed contract. Its exact old seed was not retained, so no exact replay is claimed. The victory workload now uses a fixed browser-local ID/seed source, deliberate three-second legal placement cadence, and captures frozen startup plus ordered keyboard decisions. It still traverses Scout/Boss, requires real positive collection, asserts saved victory and unpaid settlement, and checks terminal clock freeze. No production code/content/HP/damage/gravity/top-out rule or acceptance assertion was relaxed.

After these two test-only corrections, typecheck passed and the focused production run passed15/15 in approximately1.4 minutes with zero automatic retries, including the new delayed-frame case and native animation-frame test. Evidence: .scratch/ticket07-development/postverification-focused.log and postverification-focused-results.json. The previous failed evidence is retained; the new run is not described as an automatic retry or proof of universal balance.

Next gate: a fresh review-final-verified payload from the same original fixed point, separate final Code/Spec, Architecture and Security review, and new full executable verification. User acceptance remains Pending; Tickets08-12 stay ON HOLD.

## Native drag observation correction - 2026-10-10

The next full gate again withheld completion: typecheck and152 headless passed,94 development browser cases passed, and build passed, but production51/52 failed one predecessor Build feedback case. Its retained trace call@3333 shows the correct draggable H source and mouse down/move/up, but no acknowledged H selection or rejected commit; S remains selected. DOM drag events were not captured in that original trace, so the exact browser gesture failure is not claimed diagnosed.

PV07-03 strengthens that test's native precondition instead of changing product code: wait for prior committed placement and enabled/draggable source, perform deliberate real mouse movement across the drag threshold, require trusted dragstart for H and trusted dragover/drop at A1, then retain all original rejection/preview/data-preservation assertions. Native event evidence is attached even on failure; there is no synthetic dispatch, force or direct Application call. Strict typecheck and all11 Ticket04 production cases passed in27.7 seconds with zero automatic retries. Evidence: native-drag-focused.log/JSON/artifacts. No runtime, content, game rule or save schema changed during any of the three continuation verification corrections.

Final verification now uses a fresh review-final-complete payload and separate final-complete execution artifacts. Earlier final-verification and final-verified failures remain preserved. User acceptance Pending; Tickets08-12 ON HOLD.

## Completed engineering verification after reconnection - 2026-10-10

The interrupted final-complete production run stopped after 21 logged passing cases without its JSON report or summary. On reconnect, PID30924 no longer existed and no test server was listening; no exact failure cause is asserted. All180 frozen files matched review-final-complete. Its completed94/94 development JSON was retained. A separate production run was explicitly executed into .scratch/ticket07-development/reconnect-20261010-194307-778 without overwriting any earlier evidence.

Fresh typecheck PASS,152/152 headless PASS in25 files, production build PASS with144 modules, and52/52 headed production PASS in83.027 seconds; all exit codes0, no retries/skips/flaky/errors, test ports released. All13 Ticket07 screenshots were opened and inspected. Pre-closeout checks confirm180 matching frozen files,125 unchanged protected predecessor files, all six prior authoring/artifact hashes unchanged, matching new public/dist manifest hashes, unchanged official criteria and five later issues, unchanged HEAD and empty index.

No runtime, tests or content were edited during reconnection. This documentation closeout updates status and moves the plan after validation; the reviewed source/test payload remains unchanged. Review reports remain immutable, with executable-closeout.md supplementing their historical pending-execution notes. Engineering status: Implemented / Locally verified / ChatGPT tri-axis PASS. Final user acceptance Pending; Tickets08-12 ON HOLD.
