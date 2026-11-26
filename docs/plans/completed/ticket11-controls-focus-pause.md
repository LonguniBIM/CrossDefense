# Execution Plan: Ticket11 Controls, Focus and Pause

Date: 2026-11-25 (Asia/Bangkok)

Engineering closeout: 2026-11-26 (Asia/Bangkok)

## Status

Completed for engineering verification on 2026-11-26. Q16 was approved by the user on 2026-11-25: remapped gameplay controls are Workspace/device scoped and shared by every Pilot in the same local Workspace. Ticket11 implementation is authorized development-only. User acceptance was explicitly granted on 2026-11-26; commit, push, merge and deployment of the accepted result are authorized. Deployment awaits a concrete hosting target. Ticket12 implementation remains ON HOLD.

Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS, development-only. Final full round T11-R10-20261126 completed on 2026-11-26T02:21:24.215Z, followed by the fresh complete ordered executable gate from 2026-11-26T02:21:24.234Z to 2026-11-26T02:47:13.945Z. The [verification record](../../product/TICKET11_DEVELOPMENT_VERIFICATION.md) contains the final results, preserved failed rounds, remediation closure, evidence limits and cleanup audit.

The entry assessment, planned slices and chronological evidence below preserve what was known at each checkpoint. Their earlier pending or future-tense statements are historical; the current engineering disposition is stated here and in the verification record. User acceptance was explicitly granted on 2026-11-26; commit, push, merge and deployment of the accepted result are authorized. Deployment awaits a concrete hosting target. Ticket12 implementation remains ON HOLD.


See [the subsequent acceptance/publication record](../../product/TICKET11_ACCEPTANCE_20261126.md). Historical Pending/no-Git statements below preserve their original engineering checkpoint and do not override that later user decision.
## Outcome

Deliver the six accepted Ticket11 behaviors: explained binding conflicts; text entry isolated from gameplay; both clocks paused on blur, hidden tabs, undersized viewport and relevant overlays; explicit Resume with cleared input and paused 3-2-1; reduced motion with factual cues; and modal focus restored to its invoker.

## User Authority at Implementation Entry (historical)

The session handoff explicitly authorizes Ticket11 development-only implementation and a dedicated branch from the verified merged baseline. It requires direct live repository reads, meaningful RED/GREEN slices, independent sequential ChatGPT review axes, a separate final full review round, and a fresh complete ordered executable gate.

The completed Ticket10 publication authority does not authorize Ticket11 staging, commits, pushes, merges, deployment or external publication. Provider reviewers, credential setup, suspended orchestration, WFP/G-R/G-P and any retry/reconstruction/rerouting of the refused snapshot operation remain prohibited. Source snapshots, copied bundles, exports and replacement on-disk per-file inventories remain prohibited. Keep any needed comparison metadata transient in memory.

## Immutable Ticket11 Entry Baseline

| Field | Verified entry value |
| --- | --- |
| Device | DESKTOP-DBD6QJO / 0bfdbd88-da2a-400d-b6cc-0951271002c5 |
| Repository | D:\\01_DCMvn\\Workspace\\CrossDefense |
| Remote | https://github.com/LonguniBIM/CrossDefense.git |
| Entry branch | main |
| Original comparison base / entry HEAD | d32b9c7737056bdce1c5d6b89ae8e26180660393 |
| Merge tree | 779136a0975e717fb1bcfcc449d039b9b664776c |
| Merge parents | cc8b4d3ed70272ba4da787c6a28a21f89d6cbf0f; 46b35371756722924bfbb2da5a0761ab7bb29c8c |
| Local origin/main and live remote main | Both match the entry HEAD |
| Entry divergence | 0 ahead / 0 behind |
| Entry index / tracked worktree | Empty / clean |
| Preserved pre-existing untracked files | 502 |
| New working branch | ticket11-controls-focus-pause, created at the entry HEAD |

The historical fd945fae4916b8500245e74d75d65e331fb6ba43 point belongs to earlier evidence and is not the Ticket11 comparison base. Never rewrite this entry baseline when recording later candidates.

Branch creation used git switch -c after rechecking HEAD and clean tracked/index state. No reset, clean, stash, copying or blanket staging was used.

## Context and Accepted Authority

- [Agent instructions](../../../AGENTS.md) and [repository workflow](../../WORKFLOW.md).
- [Ticket10 acceptance](../../product/TICKET10_ACCEPTANCE_20261125.md), [verification](../../product/TICKET10_DEVELOPMENT_VERIFICATION.md), and [publication result](../../../.scratch/ticket10-development/publication-result-20261125.md).
- [Implementation breakdown, Ticket11](../../product/IMPLEMENTATION_BREAKDOWN.md) and [implementation specification](../../product/IMPLEMENTATION_SPEC.md).
- [Local Ticket11 issue](../../../.scratch/first-durable-playable-slice/issues/11-preserve-controls-focus-and-pause-across-settings.md). Its old hold is superseded by the current session authorization.
- [UX decisions](../../product/UX_UI_DESIGN.md): Q233, Q237, Q240-241, Q254, Q268-270, Q276-277, Q279 and Q281.
- [State matrix](../../product/UX_UI_STATE_MATRIX.md): paused Attempt, Settings/Controls, minimum viewport, focus and Presentation/Application boundary.
- [Combat timing](../../product/COMBAT_TIMING.md), [Falling Blocks](../../product/FALLING_BLOCKS_DESIGN.md), [technical architecture](../../architecture/TECHNICAL_ARCHITECTURE.md) and [testing strategy](../../architecture/TESTING_STRATEGY.md).
- [Invariant encoding](../../patterns/encoding-invariants.md): enforce accepted boundaries through native owners, with positive and negative evidence.

Ticket07 is present in the accepted implementation lineage. No new content/asset approval is required.

## Q16: Binding Persistence Scope — Approved

Q277 expressly assigns audio volume/mute and reduced motion to Workspace/device, but does not assign gameplay bindings. Q281 requires remapping, conflict feedback and Restore Defaults without specifying that ownership. The state matrix repeats this gap. WorkspaceRepository, WorkspaceApplication and PilotProfile contain no existing binding/settings contract to inherit.

| Option | Observable behavior |
| --- | --- |
| Recommended: Workspace/device | One saved gameplay mapping applies to Pre-Run and Map play for every Pilot in the same local Workspace/device. Reload retains it; changing Pilot does not switch controls. Restore Defaults changes that shared mapping. |
| Alternative: Pilot | Each Pilot retains a separate mapping; choosing another Pilot may change gameplay controls. Pre-Pilot Settings requires an additional distinction between device settings and Pilot controls. |

Decision recorded on 2026-11-25: the user explicitly approved the recommended Workspace/device scope. This authorizes one saved mapping shared across Pre-Run and Map play for all Pilots in the Workspace, retained on reload and changed by shared Restore Defaults. The alternative is not selected.

### Nonblocking implementation choices

- Preserve native Tab/Shift+Tab focus traversal, text/native-control input, browser/OS modifier shortcuts and modal Escape cancellation. Do not invent an exhaustive reserved-key blacklist. Standalone Shift Hold is explicitly accepted by Q268. Preserve Escape as the default Pause key without inferring that it must be permanently unremappable.
- No accepted numeric audio defaults were found. The illustrative preview's 45/65/85 values are not production policy. Any selected initial volumes must be documented as a reversible presentation initialization choice; no current audio assets or gameplay correctness depend on those values.
- Missing audio alone is nonblocking. Do not fetch or author audio assets. Pronunciation remains on request; mute/failure/missing assets cannot change gameplay or learning evidence.
- Exact UI tokens remain routine implementation choices within the accepted layout and visible-focus contract.

## Inspected Implementation Boundaries at Entry

| Boundary | Entry state and planned responsibility |
| --- | --- |
| Composition | src/main.ts owns screen lifetime, Workspace lock and Application construction. Add Settings access through this lifetime without moving simulation truth into UI. |
| Input | PreRunView and CombatView contain separate hardcoded default maps. Route validated saved mappings consistently while preserving physical-press behavior and default aliases. |
| Pause and clocks | CombatApplication owns pause, queued/held input clearing, countdown and fixed-step barriers. PreRunView owns its current browser clock host. Preserve these accepted seams and verify countdown boundaries rather than inferring correctness from existing tests. |
| Persistence | DexieWorkspaceRepository currently has schema v9 and no settings API. Use the native persistence owner with deliberate migration/compatibility, serialized writes and truthful acknowledgment/error feedback. |
| Motion | FixedCameraRenderer and relevant CSS currently read OS reduced-motion preference; there is no persisted Workspace override. Add presentation-only preference while retaining actual HUD/board/receipt/progress facts. |
| Focus | Existing Map and Abandon dialogs restore invoker focus. Extend that behavior to Settings and preserve native dialog keyboard semantics. |
| Audio | No current product audio settings/runtime contract exists. Keep settings and any observer adapter independent of Domain and learning correctness. |

## Scope and Preservation

Implement controls, Settings, accessible pause/resume and focus only. Preserve Q13 combat/economy, all fourteen Q14 resources, Q15 Review rewards/rules, old Run pins, transactional acknowledgment, accepted layout and current input timings.

Preserve the root /build/ ignore anchor and immutable authored/compiled/resource attributes. Do not normalize hash-pinned licenses or glTF.

Exclude Ticket12 service-worker/offline work, new balance/vocabulary/assets/rewards, purchases, import/export, Restart/Delete, and full tutorial/learning-summary work.

## Planned Vertical Slices and Proof

1. After Q16 is resolved, implement the smallest validated Settings Application/persistence behavior. Prove saved settings, retry/failure truthfulness, reload and migration preservation through public APIs and real Dexie browser storage.
2. Add keyboard-accessible Settings and remapping with action-specific conflict explanations and Restore Defaults. Prove actual remapped gameplay, default aliases, text/contenteditable/native-control exclusion, and settings access.
3. Integrate overlay pause, stale-input clearing and explicit Resume. Observe both Combat and board clocks during 3, 2 and 1, cancellation/interruption during countdown, blur/visibility/resize, and ordinary no-countdown durability success.
4. Add Workspace audio/motion controls within accepted scope. Prove static factual cues, unchanged Domain outcomes and usable settings/recovery below 1280 x 720.
5. Prove close/cancel focus restoration and visible keyboard focus through real dialogs and invokers, including safe screen disposal.
6. Freeze the candidate; complete initial Code/Spec, Architecture and Security reviews sequentially in independent ChatGPT contexts before remediation. Keep Standards and Spec verdicts separate.
7. Preserve all raw findings and failed evidence, fix supported findings, obtain focused proof, and perform selective interim re-review where required.
8. Freeze the final candidate and perform a separate final full tri-axis round. Then run one fresh ordered gate: typecheck -> allowed headless selection -> development browser selection -> fresh build -> production browser selection.
9. Inspect relevant saved screenshots and audit complete results, candidate/build identity, selection counts and task-owned cleanup. Update English records and move this plan to completed only after validation.

The existing agreed seams are public Application/Domain scenarios and the real browser application. Do not create implementation-coupled tests or infer product policy from fixtures. Discover actual Ticket11 test identities and totals; historical Ticket10 totals are not fixed targets.

## Risks and Recovery

- Preserve all 502 pre-existing untracked files and unrelated processes. Use explicit task paths; stop only resources this task creates.
- Entry free-space observation: C: 55,370,059,776 bytes; D: 2,380,189,696 bytes. Before long browser runs, obtain fresh C:/D: free space and committed-memory samples. No host-memory result is claimed from the initial incomplete sample.
- Keep bulky runtime evidence in a task-owned area with sufficient capacity using the established evidence arrangement. Do not move/copy source files. Keep loopback servers isolated; never reuse or terminate the unrelated port 4175 server.
- Preserve one browser worker, zero automatic retries, one repeat, all regression assertions and existing budgets.
- A native Windows background/minimized-tab test may still report visibilityState=visible. Report native focus-loss proof separately from controlled document.hidden proof; never relabel the latter as native hidden-tab evidence.
- No full old Ticket10 rerun is needed for unchanged accepted history. Do not execute the obsolete Ticket09 verifier as the Ticket11 gate.
- On a concrete failure, diagnose the code, test or environment cause before rerunning. Never assemble PASS from partial runs.

## Progress

- [x] Read session handoff and current repository authority.
- [x] Verify local and live remote merged baseline, index and residual worktree.
- [x] Create dedicated Ticket11 branch without moving/resetting the worktree.
- [x] Inspect relevant product, architecture, input, pause, settings, persistence and renderer boundaries.
- [x] Complete independent read-only authority audit; no formal review verdict inferred.
- [x] Resolve Q16 binding persistence scope — approved Workspace/device.
- [x] Implement and record meaningful RED/GREEN slices.
- [x] Complete initial tri-axis, remediation and separate final full tri-axis.
- [x] Run fresh complete ordered executable gate and inspect screenshots.
- [x] Audit evidence, update English records and move plan to completed.

## Focused Evidence (historical execution record)

- Settings accessibility: meaningful browser RED because open-settings was absent after Pilot chooser readiness; GREEN 1/1 after adding native modal access and invoker restoration. Evidence: C:/Users/Admin/AppData/Local/CrossDefenseTaskEvidence/Ticket11-20261125/red-settings-ui and green-settings-ui.
- Remapping interaction: meaningful browser RED because pressing H left Hard drop set to Space. Evidence: red-remapping-ui under the same runtime evidence root. Core integration and GREEN follow.
- Settings core: delegated public Application RED/GREEN covers durable reopening, cross-action conflict rejection and exact Retry after failed/lost acknowledgment. Final core handback will supply exact counts and logs.
- Native compatibility: new schema v10 is additive. Eight historical migration files update only their latest target-version assertions; all legacy data-preservation/rollback checks remain, including the intentional v8-to-v9 failure predicate.
- Audio initialization selected for this slice: Music 45%, Effects 65%, Pronunciation 85%, independently unmuted; explicit reducedMotion false while the OS reduce preference remains honored. These are reversible presentation defaults, not Ruleset or learning policy.

## Validation and Result

Fresh Ticket11 engineering verification completed on 2026-11-26 (Asia/Bangkok). Final full round T11-R10-20261126 returned Standards PASS, Spec PASS, Architecture PASS, and Security GREEN / normalized PASS. Earlier failed full rounds and their selective closures remain preserved; selective rechecks were not substituted for the final full round.

The fresh complete ordered gate ran from 2026-11-26T02:21:24.234Z to 2026-11-26T02:47:13.945Z: typecheck exit 0; 332/332 allowed headless cases in 36 files; 217/217 development browser cases; fresh production build exit 0; and 130/130 production browser cases. Actual browser identities matched the separately discovered selections. The verification record contains the outcome audit, resource samples, screenshot observations, build identity and task-owned cleanup.

Ticket10's historical 288/288 headless, 169/169 development and 85/85 production results remain historical evidence, not Ticket11 execution. Ticket11 user acceptance remains Pending. Ticket12 remains ON HOLD. No Ticket11 staging, commit, push, merge, publication or deployment was performed.

### Focused evidence continuation

- Shared remapping: red-shared-gameplay failed because the replaced ArrowLeft still moved the actual Combat piece. green-shared-gameplay passed all three UI scenarios, including a second Pilot's real Pre-Run.
- Settings overlay: red-settings-overlay exposed the missing Combat launcher. After mounting it, green-settings-overlay exposed fractional countdown arithmetic (3 passed, 1 failed).
- Countdown diagnosis: nominal 1000 ms RAF subtraction produced 999.9999999999982 ms, leaving a 1.8189894035458565e-12 ms remainder. The public Application RED also remained paused after three seconds. A 1e-7 ms tolerance fixes only numerical residue. green-countdown-boundary: 8/8 headless; green-overlay-countdown: 4/4 browser.
- Audio/motion UI: red-audio-motion failed on missing Music volume. green-audio-motion passed 5/5, including independent channel persistence, deferred application and no audio requests.
- Boundary RED: red-focus-prerun-audio-motion had four meaningful failures (moving Missile under reduced motion; Shift+Tab rewriting Move left as Left Shift; Pre-Run not ending its countdown; missing requested-audio feedback), with one prior audio scenario passing.
- The moving Missile is now replaced by static factual event cues. Shift capture is deferred until release. Pre-Run uses an explicit remaining countdown and returns before ordinary play on its completion frame. Requested unavailable pronunciation is presentation-only.
- green-ticket11-core: 27/27 PASS (19 Settings, 2 countdown, 6 existing Combat Application cases).
- green-ticket11-slices: 15/18 PASS; all six native migration/transaction/recovery cases and the motion fixture passed. Three new assertions required diagnosis: native Shift+Tab focuses the dialog itself at the first field; Combat's existing resetClock contract requires a baseline frame after countdown before ordinary elapsed play. diagnose-native-shift-focus confirmed document.activeElement is the open native dialog and document.hasFocus is true. The temporary probe was removed; native containment is asserted without inventing a last-button destination. Existing clock/assertion budgets were not changed.
- The latest revised focused browser run remains to be recorded. Formal initial/final review and the complete ordered gate have not run.

### Candidate ready for initial review

- green-ticket11-slices-corrected: **22/22 PASS**, including all 18 Ticket11 scenarios and four unchanged Build/Review/layout regression cases. Execution 2026-11-25T15:07:33Z–15:08:59Z; one worker, zero retries.
- Screenshot inspection found the Save/Close footer outside the initial 1280 x 720 dialog viewport. red-settings-footer confirmed Save intersection ratio 0. The dialog now keeps header/status/actions visible and scrolls its options region. green-settings-footer-corrected: **5/5 PASS** after the correction, including initial footer visibility, conflicts, audio persistence, native Shift+Tab traversal and undersized access.
- An intermediate footer run passed 4/5; its failure was the new test's assumption about the user agent focus destination at the first modal control. The final test checks an interior native reverse/forward step, still proving Shift+Tab does not bind Shift and preserves native traversal. No custom Tab trap or browser shortcut interception was introduced.
- Root inspected actual minimum-viewport Settings and reduced-motion Combat screenshots, and the undersized Settings screenshot. Save/Close and visible focus are now present; factual Combat HUD, words, board and harvest remain readable.
- Fresh focused resource sample: C free 54,746,632,192 bytes; D free 2,344,411,136 bytes; available memory 3,683 MiB; committed 22,855,532,544 / 29,221,576,704 bytes. Task ports 4241/4242 were unoccupied before this run.
- Implementation and focused proof are ready for the initial full sequential tri-axis. The complete final executable gate and user acceptance remain Pending.

### Review remediation evidence

- The initial full independent Code/Spec, Architecture and Security sequence finished before any remediation. Root verified the original candidate aggregate remained unchanged through 2026-11-25T15:38:35Z. Raw reports remain under .scratch/ticket11-development/reviews; the normalized disposition is recorded in the final verification record after validation.
- red-review-keyboard-stale: all eight focused cases failed at the reviewed behavior: native Enter/Space activation in both hosts, active-board Shift+Tab, Combat Abandon Escape, remapped Shift hard-drop chords and stale Settings refresh.
- A shared GameplayKeyboard now owns native/editable/modal/browser precedence, deferred standalone Shift and physical-release handling. Both hosts clear pending Shift with queued/held state at pause, resume, overlay, blur, durability, clock reset and disposal boundaries.
- Stale Settings rejection now performs a real acknowledged-state read, never resubmits the old draft, and preserves ordinary exact Retry. A failed refresh leaves controls read-only; reopening retries only the read.
- green-review-remediation: 30/31 passed. The remaining Pre-Run native activation failure was traced to delayed native close-event delivery retaining the previous dialog owner. red-settings-close-ownership independently reproduced the same failure with two public UI actions in one browser task. A closed dialog now relinquishes ownership synchronously; its delayed close event cannot steal focus from a newer modal.
- Preserving native Shift+Tab requires standalone Shift activation on release. Q268/Q281 and the Falling Blocks timing contract require held movement and soft drop to retain their timings. New-save compatibility therefore rejects Shift for these continuous actions with a key/action-specific explanation. Canonical stored values and historical receipt fingerprints remain readable and unchanged; legacy incompatible controls show a correction warning, then an explicit new save applies the correction.
- shift-compat-red-2026-11-25T15-53-00-878Z: 25 passed / six meaningful semantic failures. shift-compat-green-2026-11-25T15-55-19-904Z: 37/37 Settings headless cases passed, including all six legacy Shift/continuous-action read/replay/correction combinations. The native browser case separately validates the same preservation boundary.
- review-corrected-typecheck passed. Browser discovery selects 200 development cases in 35 files and 115 production cases in 13 files; discovery is not execution proof. The final ordered executable gate remains pending.

- green-review-remediation-corrected: **31/31 Ticket11 browser cases PASS**, 2026-11-25T15:56:59Z–15:58:48Z. Root audited JSON: no skips, unexpected/flaky results, global errors or repeated attempts; one worker, zero retries, repeat one. This includes native focus loss, both stale-read paths, legacy receipt preservation, continuous remaps and deterministic close/reopen ownership. All initial review remediation is ready for selective re-review and the separate final full round.


### Loading-screen handover proof

- red-loading-overlay-r2: both new browser cases failed semantically with Settings still open. Combat and Falling Blocks HUD ticks advanced from 0 to 60, Hull changed and board gravity advanced; Pre-Run's rendered piece also fell during 60 ordinary frames.
- WorkspaceSettingsView.attach now applies the new host's pause callback immediately when its own Settings modal is already open, before the existing-launcher guard. The same modal and unsaved draft survive mounting. Closing alone remains paused; explicit 3-2-1 Resume is still required.
- loading-overlay-typecheck passed. green-loading-overlay-r2: **33/33 Ticket11 browser cases PASS**, 2026-11-25T16:42:44Z–16:44:42Z. Root audited JSON: no skips, unexpected/flaky results, global errors or repeated attempts; one worker, zero retries, repeat one.
- Loading interleavings are deliberately scheduled by a MutationObserver activating the actual Loading screen launcher and public draft input. The proof uses ordinary RAF intervals so the existing long-frame safety pause cannot mask the defect. Combat exposes both clock counters; Pre-Run is checked through rendered board/Hold/Next/quota/collection/line facts, not an invented private tick counter. The disconnected Loading invoker does not establish a replacement-invoker focus promise.
- Updated discovery (r3-selection-development / r3-selection-production) selects **202 development cases in 35 files** and **117 production cases in 13 files**. Discovery is not execution; the separate final full review and fresh complete ordered gate remain Pending.


### Feature save-lock isolation proof

- red-storage-access-r3: both new browser cases reached an ordinary native receipt-write failure, verified unchanged acknowledged data and an enabled host Retry, then failed specifically because open-settings was disabled. Execution: 2026-11-25T17:22:07Z–17:22:27Z; two semantic failures.
- The shared Settings launcher now has the semantic st-launcher ownership marker. Build and Salvage exclude that marker from their feature control locks; their existing editing, dragging, admission and exact-Retry guards remain in place. Other inspected hosts use named/owned control locks, so no matching change was needed there.
- storage-access-typecheck passed. green-storage-access-r3: **35/35 Ticket11 browser cases PASS**, 2026-11-25T17:23:25Z–17:25:33Z. Root audited JSON: no skips, unexpected/flaky results, global errors or repeated attempts; one worker, zero retries, repeat one.
- Each new case starts from acknowledged nondefault Settings, opens Settings by native Enter/Space while the host operation remains pending, checks traversal/inertness/draft cancellation/connected-invoker focus, then retries the original host command. The two captured native receipt attempts are deeply identical and only one new durable receipt commits. Full native data remains unchanged before Retry; acknowledged preferences and resulting host state survive reload.
- Native faults are injected after bootstrap at IDBObjectStore.add for Build return/buildOperations and Salvage resolve-salvage/cargoOperations. These prove rollback and the stable failed-pending route, not native quota exhaustion or a controlled in-flight acknowledgment race.
- Updated discovery (r4-selection-development / r4-selection-production): **204 development cases in 35 files**, **119 production cases in 13 files**. Discovery is not execution. The separate final full review and fresh complete ordered gate remain Pending.


### Binding-array validation proof

- red-sparse-settings-r4: 37 existing Settings cases passed and five new cases failed semantically. Four sparse-array shapes were acknowledged instead of rejected; the fifth exposed use of a caller-provided array map. No setup failure was counted as RED.
- red-sparse-native-r4: both native public-repository cases reproduced an acknowledged malformed save followed immediately by a failed Settings history read. The ordinary UI fixture first saved a valid nondefault mapping. Sparse arrays were constructed inside the page, avoiding runner serialization changes. Execution: 2026-11-25T18:01:28.995Z–18:01:36.367Z.
- The structural validator now checks each declared index using a bounded fresh array construction. Missing elements fail the existing physical-key rule; no filtering, receipt-format change, migration, reset or repair is introduced. Dense bindings preserve order and receipt canonicalization; new-save Shift restrictions remain separate.
- sparse-settings-typecheck passed. green-sparse-settings-r4 passed **42/42** Settings headless cases, including rejection before Application ID allocation/repository invocation, unchanged acknowledged state, no pending command, direct repository/fingerprint rejection, reuse of the rejected identity, old/new exact replay, reopening and dense defensive canonicalization.
- green-sparse-browser-r4: **37/37 Ticket11 browser cases PASS**, 2026-11-25T18:02:48.072Z–18:05:03.775Z. Root audited actual JSON: zero skipped, unexpected, flaky, global-error or repeated-attempt results; one worker, zero retries and one repeat. Both new sparse native cases, all prior persistence/history/Shift cases, both host save-lock cases and the accepted input/pause/focus/motion scenarios passed.
- The native cases call only public getSettings/saveSettings methods. Rejection preserves every native table and allows ordinary UI reopening; a later valid save with the same rejected operation ID commits exactly one new revision/receipt, replays and survives reload. Prior receipt bytes and unrelated player tables remain unchanged. These two source-import scenarios are development-only and do not claim ordinary key capture can generate holes or directly exercise the production bundle's repository API.
- Updated discovery (r5-selection-development / r5-selection-production): **206 development cases in 36 files**, **119 production cases in 13 files**. Discovery is not execution. The separate final full review and fresh complete ordered gate remain Pending.


### Initial native-focus handover proof

- Before the production correction, red-native-focus-mount-r5 executed two native cases and failed both at the unchanged-visible-state assertion (2026-11-25T18:41:38.615Z–18:41:48.885Z, exit 1). The Combat attachment records combatTick 0→60, boardTick 0→60 and Hull 1200→1187.4; the Pre-Run attachment records active-piece y 1→2. Both record trusted native blur → real Loading → mounted host while focused=false and hidden=false, with no hidden transition or late host-visible blur. These are semantic failures, not setup or cleanup failures.
- Each gameplay host now reconciles current native focus before Settings attachment and its first RAF. Pre-Run calls its existing blur handler only when no initial pause reason exists; Combat uses its existing pause owner when the viewport is safe but native focus is absent. Existing hidden/undersized reasons, Settings handover, renderer readiness, timing and ordinary durability continuation remain unchanged.
- After the two guards, native-focus-mount-typecheck exited 0. green-native-focus-mount-r5-all executed the complete 39-case Ticket11 selection across five files (2026-11-25T18:46:10.323Z–18:48:34.538Z, exit 0), with all 39 passed, one worker, zero retries, one repeat, zero skipped/unexpected/flaky/global-error results and exact discovered case identities. Both actual native-focus attachments retain identical before/after visible state through sixty ordinary frames. An earlier title-filter diagnostic selected four cases and passed 4/4; that narrower run is retained as diagnostic evidence and is not substituted for the complete 39-case run.
- The native harness disables Chromium focus emulation and foregrounds a separate small about:blank window. It requires a trusted blur before host creation, an adequate game viewport, and no native hidden transition or late host-visible blur across Loading, mounting and sixty ordinary frames. Actual samples and rendered before/after state are retained as native-focus-mount-state JSON attachments.
- Event-order qualification: native blur occurs on the preceding ready screen, then controlled invocation of the existing public Start/Begin button carries that visible/unfocused state through the real Loading transition and host mounting. This demonstrates the missing initial-focus guard and the same mount state in the source-traced Loading path; it is not claimed as a reproduced blur first occurring after Loading began. No global latch for a transient blur that ended before mount is introduced.
- GREEN also verifies that focus return alone leaves Resume, held/discrete paused input is discarded, all 3/2/1 stages and their completing frame remain stopped, subsequent ordinary movement works, both Combat counters advance equally, and native saved data remains unchanged after normal startup acknowledgment. Owned native target/session/observer cleanup is asserted for success and failure paths.
- Fresh discovery r6-selection-development lists 208 cases in 36 files; r6-selection-production lists 121 cases in 13 files. The two initial native-focus cases are selected in both environments; source-import sparse-array and renderer probes remain development-only. Discovery is selection evidence, not executed validation. The separate final full reviews and ordered integrated gate remain pending at this proof entry.


### Pending Settings ownership through Workspace recovery

- All full R6 axes completed on the unchanged candidate before any remediation: Standards PASS; Spec FAIL with R6-CS-01 (Medium / BLOCKER / High confidence, introduced integration defect); Architecture PASS / Strong / High static confidence; Security GREEN / normalized PASS / High static confidence. Both latter axes had zero findings. R6 remains a failed full round.
- Corrected pre-fix native RED: red-settings-recovery-r6-corrected ran 2026-11-25T19:27:36.309Z–19:27:49.440Z with two semantic failures, one rollback and one controlled lost acknowledgment; red-settings-recovery-loading-r6 ran 19:31:06.408Z–19:31:13.305Z with one semantic Loading ownership failure. Each failed only at the intended pending/recovered-UI equality assertion, with no global errors, retries, skips, flaky outcomes or cleanup failures. Native rows stayed unchanged through storage recovery, but the old composition lost exact Retry and the locked draft; the lost-ack branch also published the committed preference before Settings acknowledgment.
- The first diagnostic preserved in red-settings-recovery-r6 includes a semantic rollback failure and an ineffective lost-ack factory interception. Its lost-ack case acknowledged normally, so it is recorded as a harness failure, not semantic RED. Corrected instrumentation redirects the actual native receipt transaction completion callback.
- Settings opened during recovery Loading can capture the old idle owner and start Save after the Settings refresh checkpoint. The additional public-UI Loading case uses a MutationObserver and a held ordinary manifest response to make that ordering deterministic, without product hooks, browser-side source imports, arbitrary waits or budget changes. An already-pending-only guard would not cover that observed ordering.
- The composition now retains the Workspace repository and Settings Application. Every retry still reconstructs WorkspaceApplication, calls bootstrap/initialize, explicitly opens the same native database, and runs all existing validation. Idle Settings rereads current native state; pending Settings keeps its original operation, draft and acknowledged projection until explicit Settings Retry. Repository/Domain/Application formats and policies are unchanged.
- Post-fix TypeScript exited 0 (settings-recovery-typecheck, 2026-11-25T19:32:52.824Z–19:32:53.228Z). green-settings-recovery-r6-all ran 19:33:44.884Z–19:36:25.453Z: all 42 Ticket11 cases in five files passed once, with one worker, zero retries, repeat one, no skipped/unexpected/flaky cases, no global errors and exact discovery identity. The three structured native observations retain the original operation ID, canonical fingerprint and base revision through explicit Retry; all finish at revision 1 with one durable receipt. The complete native state and attempt trace are unchanged during Retry storage. The rollback and Loading cases retry the same attempted write, while lost acknowledgment replays its existing receipt without a second insert. Pending draft/presentation ownership and successful reload are asserted.
- Controlled lost acknowledgment is distinct from a native abort: a trusted complete event and durable row/receipt precede the injected failure delivery. Public Continue's legitimate lastUsedAt update precedes the persistence baseline. Complete native snapshots, original operation/fingerprint/base revision, locked pending UI, no implicit resubmission, exact explicit Retry, one durable revision/receipt, reload and owned fixture cleanup are asserted.
- Retaining the adapter also lets initialize explicitly reopen the database object held by Settings; installed Dexie source supports clearing a cached failed-open state through explicit open. No forced native connection-close/reopen failure scenario was executed.
- Fresh list-only R7 selection discovery exited 0: development 211 cases in 36 files, production 124 cases in 13 files, including 42 Ticket11 cases overall. The source-import-only development cases are absent from production. These discovery results are not executed final-gate evidence; the selective recheck, separate fresh full round and fresh complete ordered gate are still pending.


### Current Settings modal observes operation settlement

- Full R7 completed before edits: Standards PASS / Spec PASS, both static with zero findings and Moderate confidence; Architecture FAIL with T11-R7-ARCHITECTURE-001 (Strong / BLOCKER / HIGH source-trace confidence, introduced by Ticket11). Security returned native GREEN / normalized PASS with zero confirmed actionable findings. Its unconfirmed retained pagehide/BFCache ownership observation was recorded under Needs evidence without a severity or blocker; no runtime reproduction or newly introduced Security defect was established. R7 remains a failed full round. Root's final unchanged-candidate check was 2026-11-25T23:15:15.103Z.
- A normal Salvage Apply completion can dismiss a still-saving Settings modal and enter Build. A replacement modal formerly missed the original operation's settlement, keeping stale locks/Retry and potentially reporting nonacknowledgment after success. No data loss or duplicate native write was established.
- Before any production correction, settlement-regression-typecheck passed (exit 0; 2026-11-25T23:15:15.269Z–23:15:15.708Z). red-settings-settlement-r7 ran 2026-11-25T23:16:02.410Z–23:16:22.939Z on the unchanged R7 SettingsView and exited 1: two replacement cases failed at the intended post-settlement semantic assertions (success at ticket-11-ui.spec.ts:815, lost acknowledgment at :820), while both no-replacement guards passed. All four observed trusted native completion, revision 1 and one receipt, with every native row unchanged by acknowledgment delivery. The failing replacements retained generic status and obsolete locks/Retry; success still published reduced motion correctly. All four cleanup attachments reported no problems, no retained callbacks, no open MessagePorts and no remaining owned handles. One worker, zero retries, repeat 1; no skips, flaky cases or global errors.
- The correction keeps draft, readiness, busy status, message and operation error in one stable Presentation-owned state object across modal instances. Idle open still initializes from the acknowledged projection or the exact retained pending draft; a busy reopen retains the current operation state. Async Save/Retry and stale-refresh settlement render only the current connected, open dialog owner. Acknowledged publication remains independent of modal connectivity, and late close cleanup clears only its own renderer without stealing focus from a newer open modal. The subsequently found nonmodal-focus gap is recorded in the later R9 execution entry. Reopening during an existing refresh does not start another refresh. No Application/persistence API, host transition, key-routing policy or timing budget changes.
- After the narrow correction, settlement-fix-typecheck passed (exit 0; 2026-11-25T23:20:47.657Z–23:20:48.207Z). green-settings-settlement-r7-all passed 46/46 cases in five files, 2026-11-25T23:21:27.080Z–23:24:58.453Z, with exact identity equality to fresh discovery, one worker, zero retries, repeat 1, no skips/flaky/global errors and one result per case. The four late-settlement attachments independently confirm current replacement success/failure feedback, correct in-flight locking, acknowledgment-only publication, no-replacement focus, original-identity Retry without a second receipt, unchanged native rows, later draft cancellation and reload. All owned hooks, callbacks, MessagePorts and handles were cleaned.
- Native commit/completion is real and trusted; delayed callback delivery and the lost-ack failure notification are controlled. The latter does not undo the durable commit and is not a natural postcommit abort. A MessageChannel checkpoint drains scheduled microtasks and closes both ports without elapsed-time sleeps or changed budgets.
- The post-Build native baseline excludes legitimate host changes. Replacement and no-replacement observations, original Settings identity/fingerprint, one revision/receipt, unchanged rows on acknowledgment delivery, explicit Retry, later draft cancellation, current-invoker focus, reload and owned fixture cleanup are checked. No-replacement cases are baseline guards, not semantic RED for this defect.
- Fresh list-only discovery r8-selection-development and r8-selection-production passed: 215 development cases in 36 files and 128 production cases in 13 files. The Ticket11 subsets contain 46 development and 43 production cases; the three direct-source native cases remain development-only. Discovery is not execution of the final integration gate.


### Controlled Resume clock baseline in retained Ticket03 tests

- The first complete development-browser attempt ran unchanged from 2026-11-26T00:12:46.143Z to 00:25:19.747Z and exited 1: 213/215 cases passed, with only the two retained Ticket03 Resume cases failing. Both timed out at pause-message.toBeHidden while the controlled frame clock still displayed "resuming in 3". All 215 discovered identities ran once with one worker, zero retries, no skips, no flaky cases and no global errors. The preceding typecheck and 332/332 allowed headless cases passed. Build and production-browser stages were not started; this failed integration attempt remains preserved.
- Direct source, original-base comparison and failure artifacts identified the controlled-test timeline as the cause. Resume resets the elapsed-time baseline. The first 2999 ms callback therefore established that baseline and consumed zero countdown time; the following 1 ms callback left 2999 ms. Assertion polling cannot advance the fixture's manual RAF clock. This is not recorded as a reproduced product stepping or reward defect.
- The correction changes only tests/e2e/ticket-03-ui.spec.ts: establish the baseline with frame(0), observe labels 3 and 1 around the existing 2999/1 ms boundary, and verify the board stays unchanged through the completing frame. The delayed-frame case also keeps Hold empty through completion and retains its fresh C/ordinary-frame, quota 8/8 and collected 0 checks. Existing viewport, pause, resize, delayed-frame and piece-identity assertions remain. No timeout, selection, configuration or product-source change.
- countdown-test-typecheck exited 0 (2026-11-26T00:25:53.419Z-00:25:53.917Z). green-countdown-test-r8 passed all three focused cases in two files (00:26:34.706Z-00:26:46.574Z): both corrected Ticket03 cases and the existing Ticket11 Pre-Run countdown scenario. Actual JSON and exact discovered identities were audited: one worker, zero retries, repeat one, no skipped/unexpected/flaky cases, no global errors and one result per case.
- A separate read-only diagnosis follow-up personally inspected the corrected source and confirmed that it addresses the timeline while retaining the checks. It relied on root's audited execution results and did not claim its own test run. Its original reader was closed, and its follow-up opened no process.
- Fresh list-only r9-selection-development and r9-selection-production discovery passed at 00:26:51Z. The selections retain the same 215 development and 128 production case identities; the three direct-source-only cases remain excluded from production. The separate fresh full review and a new complete ordered executable gate remain required. No earlier partial stage will substitute for that gate.

### Deferred native close preserves subsequent Resume focus

- Full R9 source review completed on its unchanged candidate at 2026-11-26T01:09:49.337Z: Standards PASS (Moderate overall), Spec PASS (High source-to-contract / Moderate end-to-end pending execution), Architecture PASS (High static), Security GREEN / normalized PASS (High static), with zero confirmed actionable findings. Native reports and qualifications remain preserved. The second ordered gate then passed typecheck and 332/332 allowed headless cases in 36 files.
- r9-final-03-development ran 2026-11-26T01:11:19.656Z-01:23:26.920Z and failed with 214/215 passed. Exact discovered identities ran once, with one worker, zero retries, repeat one, no skips/flaky/global errors. Both corrected Ticket03 cases passed. The remaining failure was the second Space iteration of Pre-Run native Settings/Resume activation; the trace shows a closed Settings dialog surviving Resume.focus, then Space reopening Settings. Enter had completed 3/2/1. Trace does not directly serialize activeElement or the native close timestamp. Build and production stages were not started. R9 remains source-review PASS followed by a failed gate.
- Source diagnosis identified delayed close cleanup unconditionally focusing the invoker when no modal was open. New public-UI cases in both gameplay hosts invoke Close and move focus to Resume in one browser task, then await the actual trusted close event. red-close-focus-r9 (01:28:09.014Z-01:28:18.085Z, exit 1) failed both intended assertions: native return and later Resume focus were observed, but deferred close changed focus back to open-settings. Both stopped on their first Enter iteration. No arbitrary delay, synthetic close event, product hook or timing-budget change was introduced.
- The narrow SettingsView guard captures focus ownership before removing the old dialog. Explicit fallback to a connected invoker is limited to absent/body/closing-dialog focus and remains blocked by a newer open modal. Native normal return is retained; a subsequent focused control is preserved. Renderer, operation, persistence, key-routing and countdown ownership are unchanged. Regression and fix typechecks exited 0; the correction was applied at 2026-11-26T01:28:48.267Z.
- The first post-fix attempt green-close-focus-r9-all remains failed, 47/48, 01:29:29.141Z-01:32:44.353Z. All new host/key observations passed. Its single historical Shift failure occurred during initial openChooser before historical setup: the trace records /src/main.ts failing with net::ERR_NO_BUFFER_SPACE (HTTP-style status -1, no body) while HTML/Vite client succeeded. The underlying resource cause is unestablished. No product/network workaround, retry setting or timeout changed. The original failed artifacts remain preserved.
- After a fresh disk/committed-memory/task-port sample, the unchanged candidate passed the separate complete green-close-focus-r9-complete selection: 2026-11-26T01:33:41.876Z-2026-11-26T01:37:12.924Z, exit 0, 48/48 cases in five files. Exact discovery identities, one worker, zero retries, repeat one, no skips/unexpected/flaky/global errors and one result per case were audited. Four native observations cover both Enter and Space in Combat and Pre-Run: native invoker return, a deliberate later Resume focus, trusted close preserving that focus, no retained/open old dialog, and the complete frozen-board 3/2/1 countdown. Existing close/cancel, newer-modal, lifecycle/recovery, late-settlement, native-focus and persistence cases all passed.
- Read-only source and trace diagnostics opened no execution or mutation path; their owned readers were closed. The failed R9 gate and failed initial post-fix attempt are historical evidence, not relabeled passes. The focus proof is a root-discovered runtime-defect closure, not a selective reviewer verdict or a substitute for another full round.
- Fresh list-only r10-selection-development and r10-selection-production passed: 217 cases in 36 files and 130 cases in 13 files. Ticket11 contributes 48 development and 45 production cases; the existing three source-import-only cases remain development-only. The separate fresh full review and a new complete ordered executable gate remain pending at this entry. User acceptance stays Pending, Ticket12 ON HOLD, with no staging/commit/push/merge/publication/deployment.


### Final engineering closeout - 2026-11-26 (Asia/Bangkok)

- Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS, development-only. User acceptance remains Pending and Ticket12 remains ON HOLD.
- The separate full T11-R10-20261126 review completed at 2026-11-26T02:21:24.215Z. Standards PASS; Spec PASS; Architecture PASS; Security native GREEN / normalized PASS. Native confidence and observation qualifications remain unchanged in the raw reports and development verification record.
- A fresh complete ordered gate ran 2026-11-26T02:21:24.234Z to 2026-11-26T02:47:13.945Z: typecheck exit 0; allowed headless 332/332 across 36 files; development 217/217 across 36 files; fresh build exit 0; production 130/130 across 13 files. Exact discovered browser identities, single results, one worker, zero retries and unchanged budgets were audited. The earlier failed gates remain preserved; none of their stages substitute for this gate.
- Root inspected the fresh production screenshots, audited structured native recovery, unfocused-mount, deferred-close focus and late-settlement observations in both browser environments, compared the fresh build identity after production, and checked task resource cleanup. The unrelated port 4175 process was not reused or terminated.
- The original entry baseline and Harness section remain unchanged. HEAD is d32b9c7737056bdce1c5d6b89ae8e26180660393, branch ticket11-controls-focus-pause, index empty, no new commit, all 502 pre-existing untracked paths retained. Final records and this plan move are documentation-only; the runtime/test/config digest remains 8416b1b63fe6857eb5366926458c59be5618b785e5e8db401a3b559b999ce9d3.
- Complete evidence, source-review limits and artifact locations are recorded in [Ticket11 Development Verification](../../product/TICKET11_DEVELOPMENT_VERIFICATION.md). No Ticket11 staging, commit, push, merge, publication, deployment or suspended provider/orchestration action was performed.

### Subsequent user acceptance and publication authority — 2026-11-26

The user accepted the completed result and requested commit, push, merge and deployment. Ticket11 user acceptance is Accepted. The accepted code/test/config checkpoint was reproduced unchanged before publication edits; the runtime aggregate remains 8416b1b63fe6857eb5366926458c59be5618b785e5e8db401a3b559b999ce9d3. Git publication uses the explicit Ticket11 allowlist. Hosting destination and live deployment verification remain unresolved; Ticket12 implementation remains ON HOLD. See the acceptance record for the scope and evidence.
