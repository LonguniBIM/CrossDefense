# Ticket11 Development Verification

Date: 2026-11-26 (Asia/Bangkok)

> Subsequent user acceptance — 2026-11-26: The user accepted Ticket11 and requested commit, push, merge and deployment; see [the acceptance record](TICKET11_ACCEPTANCE_20261126.md). The Pending and no-publication wording in the engineering record below describes the earlier closeout checkpoint and is historical. Deployment awaits a concrete hosting target. Ticket12 implementation remains ON HOLD.

## Result and authority

**Implemented / Integrated verification PASS / ChatGPT tri-axis PASS — development-only.** The complete frozen candidate passed independent source review and a fresh complete ordered executable gate. User acceptance remains **Pending**; Ticket12 remains **ON HOLD**.

Q16 was approved on 2026-11-25: gameplay bindings belong to the local Workspace/device, are shared across every Pilot, survive reload and use shared acknowledged Restore control defaults. User acceptance remains **Pending**. Ticket12 remains **ON HOLD**.

This is an engineering verification record, not a user-acceptance record. No Ticket11 staging, commit, push, merge, publication or deployment was performed. Provider/credential/orchestration and WFP/G-R/G-P work remains suspended. The refused snapshot operation was not retried, reconstructed or rerouted. Reviews used direct live reads and transient in-memory metadata.

See the [Settings contract](TICKET11_SETTINGS_CONTRACT.md) and [completed execution plan](../plans/completed/ticket11-controls-focus-pause.md).

## Delivered behavior

- Shared settings contain physical-key aliases, independent Music/Effects/Pronunciation volume and mute values, and explicit reduced motion. Only acknowledged settings affect active preferences. Restore control defaults changes shared bindings after Save.
- Settings is keyboard accessible before Pilot selection and on relevant screens, including Build and Salvage while a failed host save remains pending. Feature controls stay locked and the original host Retry remains intact. Its native modal lives outside the screen root, preserves native traversal, and returns focus to a still-connected invoker while preserving any subsequent focus move to another control. The header/status/actions remain visible while the options region scrolls.
- One Presentation keyboard adapter gives editable controls, native buttons, open modals and browser modifier shortcuts precedence over gameplay. Standalone Shift waits for release, preserving native Shift+Tab and avoiding repeated/chord-triggered gameplay.
- New Shift mappings are restricted to discrete rotation, Hard drop, Hold and Pause. Move left/right and Soft drop require hold-capable keys to retain the accepted input timings. Historical structural values, canonical receipt fingerprints and exact replay remain readable; an incompatible older mapping warns and requires an explicit compatible correction.
- Settings, blur, controlled hidden state and undersized viewport guards clear held, queued and pending input and pause gameplay. A Settings modal opened during Loading is reconciled into the newly mounted host before its first frame, retaining its dialog and unsaved draft. Both gameplay hosts also start paused when they mount while the visible, adequately sized document lacks native focus; focus returning alone leaves explicit Resume.
- Explicit Resume displays 3, 2, 1 with both Combat and Falling Blocks clocks stopped, including the countdown completion frame. Another pause cancels the countdown. Ordinary successful durability barriers retain their existing automatic continuation.
- Native schema v10 adds Settings and operation receipts atomically, validates historical v9 ownership/Review/outcome/economy/Cargo relationships, and preserves previous rows and Run pins. Uncertain saves retain exact Retry. Stale rejection rereads acknowledged state without resubmitting the rejected draft; a failed reread remains read-only until reopening successfully refreshes.
- Workspace recovery retains the same Settings operation owner, including a modal opened during recovery Loading. Retry storage fully revalidates native storage while preserving the pending draft, original command and last acknowledged presentation; explicit Settings Retry alone resolves the uncertain save.
- An in-flight Settings operation also retains its Presentation state when a host transition dismisses the modal. A replacement stays busy and receives the original operation's success or failure; acknowledgment still publishes with no modal open. Settlement does not reopen dialogs or move focus, and later unsaved edits remain cancellable.
- Explicit or OS reduced motion selects static factual firing/hit/repair/regeneration cues while retaining resources, words, module progress, board and harvest. Requested unavailable pronunciation changes presentation feedback only and creates no hint, response, reward or other learning evidence.

Initial channel volumes are Music 45%, Effects 65%, Pronunciation 85%, independently unmuted; explicit reduced motion starts false while the OS preference is honored. These are reversible presentation initialization choices, not approved gameplay or learning policy. The current packs contain no audio assets; actual sound playback is not certified.

## Baseline and verified candidate

Repository: D:\01_DCMvn\Workspace\CrossDefense on DESKTOP-DBD6QJO.

| Identity | Value |
| --- | --- |
| Original immutable base and final HEAD | d32b9c7737056bdce1c5d6b89ae8e26180660393 |
| Original tree | 779136a0975e717fb1bcfcc449d039b9b664776c |
| Development branch | ticket11-controls-focus-pause |
| Index / new commits | Empty / none |
| Preserved pre-existing untracked paths | 502 |
| Final full review round | T11-R10-20261126 |
| Frozen candidate, UTC | 2026-11-26T01:38:35.394Z |
| Complete review inputs | 380; SHA256 03462b06301207d76d44e53715348e8754eefeedebbe1751a26c0b36dc62c006 |
| Runtime/test/config inputs | 199; SHA256 8416b1b63fe6857eb5366926458c59be5618b785e5e8db401a3b559b999ce9d3 |
| Fresh production build | 9 files; 29171985 bytes; SHA256 0313f5e54ea388603402081c2d803d9a7c41d4d99ef58c70e5e5fbe3b5e8d7b0 |

Aggregate method: sort the unique tracked paths plus the nineteen declared new review inputs; hash each file's raw bytes with SHA-256, concatenate relative path + NUL + file hash + newline, then SHA-256 that UTF-8 sequence. The runtime/test/config subset uses the same order and method, selecting src/, tests/ and public/ paths, package*.json, any path ending config.ts or config.json, index.html, .gitattributes, .gitignore and the explicit task Playwright configuration. Nested config paths are included. This definition is broader than root-level config files alone.

The dist identity is a deterministic aggregate of sorted output paths and each output file's raw-byte SHA256, computed by the same task helper immediately after the fresh build and again after production verification.

Root checked the candidate between review axes and through the final executable gate. Final administrative records and the plan move occurred after validation; the runtime/test/config aggregate remained identical. Public input hashes and the approved Q14 resources remained unchanged. The original entry baseline in the execution plan was not rewritten.

No source snapshot, copied source bundle/export or replacement on-disk per-file inventory was used. Aggregate comparison metadata remained in memory. Runtime build output and task-owned test evidence were produced only through the authorized executable checks.

## Acceptance evidence

| Accepted behavior | Proof in the final selections |
| --- | --- |
| Explain conflicts | Public Settings Application validation, native conflict/invalid-key feedback, remapping and shared Restore Defaults scenarios. Diagnostics identify the key and affected actions. |
| Isolate text/native input | Actual editable/modal routes; native Enter/Space Settings and Resume with Pause mapped to those keys; Combat Abandon Escape; active-board Shift+Tab and standalone Shift in both hosts. |
| Pause on blur, hidden, undersize and overlays | Native focus loss, separately qualified controlled hidden state, viewport interruption, active Settings overlays, Loading-to-host handover and visible/unfocused native mounting. Combat exposes both public clock counters. |
| Explicit Resume and stopped countdown | Public Combat Application completion-boundary cases; both hosts' 3/2/1 and interruption routes; held/queued/Shift-candidate clearing and unchanged completion-frame state. |
| Factual reduced motion | Renderer projection scenario and actual Q15 Combat UI facts/screenshots; explicit/OS preference, static event cues and retained HUD/words/progress/board/harvest. |
| Restore modal focus | Native traversal, still-connected invoker restoration, Abandon cancellation, delayed-close ownership and minimum/undersized access. Both gameplay hosts also verify a trusted native close preserves a later Resume focus for Enter and Space. Disconnected Loading launchers do not establish replacement-invoker focus behavior. |
| Q16 shared durable settings | One saved mapping drives actual Combat and another Pilot's Pre-Run, survives reload and changes through shared acknowledged defaults; independent audio/motion preferences. |
| Reliable native persistence | Real IndexedDB migration/rollback/history, transactional failure injection, exact Retry/reload, stale refresh/read failure, corrupt-settings recovery, historical Shift receipt correction and rejection of malformed sparse public-API bindings before writes. |
| Retain pending operation and current observer | Storage recovery and recovery-Loading cases retain the same command/draft. Four native late-settlement cases cover a replacement modal and no replacement, successful acknowledgment and controlled lost acknowledgment, current feedback/locks, exact Retry, one receipt, focus, cancellation and reload. |

## Independent review cadence

The initial full Code/Spec -> Architecture -> Security sequence completed before any remediation. The initial frozen source remained unchanged through 2026-11-25T15:38:35Z. Raw reports retain their native wording and classification.

| Initial finding | Original classification | Disposition |
| --- | --- | --- |
| CS11-R1-001 / AR11-R1-001: native Pause precedence | High / Strong; BLOCKER | Closed through shared routing, native Enter/Space/Abandon Escape proof and selective re-review. |
| CS11-R1-002: Shift+Tab activates live Hold | Medium; BLOCKER | Closed through deferred standalone Shift, chord/boundary cancellation and live Hold/drop proof. |
| AR11-R1-002: stale Settings recovery not connected | Moderate; NON_BLOCKING | Closed through acknowledged reread, failed-read/reopen recovery and unchanged exact Retry. |
| Initial Security | PASS; zero findings | Separate later full Security review still required and performed. |

Root also reproduced and fixed delayed native close-event ownership when a replacement modal was open, and resolved continuous-Shift compatibility without rewriting historical data. Failed intermediate evidence was retained. Selective Code/Spec and Architecture rechecks closed their own original findings.

A separate full R2 round then completed on its unchanged candidate:

| R2 axis | Native verdict / result |
| --- | --- |
| Code/Spec | Standards PASS / Spec PASS; zero findings |
| Architecture | FAIL; Strong/BLOCKER ARCH-T11-R2-001 |
| Security | GREEN, normalized PASS; zero findings |

R2 is a failed full round and is not relabeled PASS. ARCH-T11-R2-001 identified that an existing Loading-screen Settings modal did not transfer pause ownership into a new gameplay host. Both new regressions failed before the correction. The adapter now invokes the host pause callback synchronously for its own open modal, before the launcher early return. It preserves the existing dialog/draft, does not initiate a settings read/save/Retry, and does not resume automatically.

The selective Architecture recheck preserved the original Strong/BLOCKER classification and marked it **FIXED**. It inspected both host attach points before their first RAF and independently audited the semantic RED and complete 33-case Ticket11 GREEN proof. That recheck did not substitute for a full review.

The full R3 round was also completed before any further source change. Code/Spec returned Standards PASS / Spec PASS with zero findings. Architecture returned FAIL with Strong/BLOCKER T11-R3-ARCH-001 (HIGH confidence): the shared Settings launcher inherited Build and Salvage feature save locks after ordinary storage failure. Security returned GREEN (normalized PASS), with zero security findings. R3 remains a failed full round.

Only Build and Salvage had the supported whole-root control-locking conflict. The correction marks the Workspace-owned launcher and excludes it from those two feature locks. Host editing remains blocked, pending commands are retained, and exact Retry remains owned by each existing Application. The selective Architecture recheck marked the original Strong/BLOCKER (HIGH confidence) FIXED after inspecting both corrected locks and the two semantic RED cases, typecheck and 35/35 focused GREEN artifacts. It confirmed keyboard/modal/focus, unchanged pending data and exact native Retry; the recheck was not a full-candidate verdict.

The full R4 round completed on its own unchanged candidate before further remediation. Code/Spec returned Standards PASS / Spec FAIL, with Medium/BLOCKER T11-R4-SPEC-001 (High confidence). Architecture returned PASS with zero findings. Security returned GREEN (normalized PASS), with zero security findings. R4 remains a failed full round.

T11-R4-SPEC-001 identified a public Settings boundary defect: array mapping skipped absent binding elements. Such input could be acknowledged and serialize holes as null in a receipt fingerprint, making subsequent native history validation fail. Ordinary UI capture produces dense arrays; the defect concerned malformed input supplied to the public Application/repository APIs.

The shared structural validator now examines every declared binding index and creates a fresh canonical dense array. Missing elements fail the existing physical-key validation instead of being skipped or filtered. It does not call a caller-supplied array map or iterator. No receipt format, transaction, migration or new-save Shift policy changed; malformed stored data still enters recovery without reset or repair.

Five new headless cases cover wholly sparse, leading, interior and trailing holes plus dense canonicalization. They start with acknowledged nondefault preferences and an existing receipt. The Application rejects before generating an operation ID or invoking the repository; direct validation, fingerprinting and the public in-memory repository also reject. A subsequent valid save can reuse the rejected identity, and old/new exact replay and fresh-session reopening retain the acknowledged state.

Two development-only native browser cases construct sparse input inside the page and call only the public repository API. Before the correction they observed an acknowledged save followed by a failed native history read. After correction they verified rejection, every native table unchanged, ordinary UI reload, a valid save using the same rejected identity, exact replay with only one added revision/receipt, and another successful reload. They import Vite source modules and do not establish ordinary UI sparse-input reachability or direct production API coverage.

red-sparse-settings-r4 recorded 37 previous passes and five meaningful failures; red-sparse-native-r4 recorded two acknowledged-save/history-read failures. sparse-settings-typecheck exited 0. green-sparse-settings-r4 passed 42/42; green-sparse-browser-r4 passed all 37 Ticket11 cases once, including both new native scenarios and historical compatibility, with zero skips, unexpected/flaky results, global errors or repeated attempts.

The selective Code/Spec recheck preserved the original Medium/BLOCKER/High classification and marked T11-R4-SPEC-001 FIXED after independently auditing the source and saved semantic RED/GREEN evidence. Standards was not rerun in that selective pass. It did not replace the separate full R5 review.

The complete R5 round ran on its unchanged candidate. Code/Spec returned Standards PASS / Spec FAIL with Medium/BLOCKER/High-confidence T11-R5-SPEC-001: visible-but-unfocused gameplay mounting was not reconciled after the asynchronous Loading interval. Architecture returned PASS with zero findings (Strong verdict, HIGH static-scope confidence); Security returned GREEN (normalized PASS) with zero findings. R5 remains a failed full round. The source finding was explicitly qualified as a retained baseline omission within Ticket11's focus/handover acceptance scope, not a newly introduced regression or an executed reproduction.

The R5 Code/Spec report also records a narrow review-process limitation: after its Spec assessment was fixed, an agent-readiness inventory unexpectedly exposed the prior R4 selective status summary. No prior report artifact was opened, the fixed assessment was unchanged, and that output was not supplied to the independent Standards reviewer. This disclosure is retained with the failed round; it does not stand in for a fresh final review.

Each gameplay host now reconciles current native focus before Settings attachment and the first RAF, through its existing pause/input-clear owner. Prior hidden/undersized reasons and the surviving Settings modal's pause handover retain their existing order. Normal focused mounting, countdown timings, renderer readiness and ordinary successful durability continuation are unchanged.

Before the production correction, red-native-focus-mount-r5 executed two native cases and failed both at the unchanged-visible-state assertion (2026-11-25T18:41:38.615Z–18:41:48.885Z, exit 1). The Combat attachment records combatTick 0→60, boardTick 0→60 and Hull 1200→1187.4; the Pre-Run attachment records active-piece y 1→2. Both record trusted native blur → real Loading → mounted host while focused=false and hidden=false, with no hidden transition or late host-visible blur. These are semantic failures, not setup or cleanup failures.

After the two guards, native-focus-mount-typecheck exited 0. green-native-focus-mount-r5-all executed the complete 39-case Ticket11 selection across five files (2026-11-25T18:46:10.323Z–18:48:34.538Z, exit 0), with all 39 passed, one worker, zero retries, one repeat, zero skipped/unexpected/flaky/global-error results and exact discovered case identities. Both actual native-focus attachments retain identical before/after visible state through sixty ordinary frames. An earlier title-filter diagnostic selected four cases and passed 4/4; that narrower run is retained as diagnostic evidence and is not substituted for the complete 39-case run.

Fresh discovery r6-selection-development lists 208 cases in 36 files; r6-selection-production lists 121 cases in 13 files. The two initial native-focus cases are selected in both environments; source-import sparse-array and renderer probes remain development-only. Discovery is selection evidence, not executed validation. The separate final full reviews and ordered integrated gate remain pending at this proof entry.

The two native browser cases use a separate small Chromium window, disable focus emulation, and require a trusted blur, a visible adequately sized game document, no hidden transitions and no late blur delivered to the mounted host. They retain actual native samples and rendered before/after facts as JSON attachments. Native blur occurs on the preceding ready screen; controlled public Start/Begin invocation then carries that same visible/unfocused state through the real Loading transition and host mounting. This proves the missing initial guard and the state implicated by the source finding, without claiming runtime blur first occurred after Loading began. No historical latch for a blur already ended before mount is added.

GREEN additionally proves focus return alone stays paused, paused input is discarded, each 3/2/1 stage and its completing frame stay frozen, ordinary play then resumes, both Combat counters advance equally, and native saved rows remain identical to the post-startup acknowledgment baseline. The foreground target, observation handle and CDP sessions have explicit cleanup assertions. Existing Loading Settings and native-blur-after-mount cases remain in the focused selection.

The selective Spec recheck independently read the current guards, pause/input/countdown owners and actual saved RED/GREEN records and attachments, and marked T11-R5-SPEC-001 FIXED (selective Spec PASS), retaining Medium / BLOCKER / High confidence. It confirmed the current-focus and event-order qualifications. Standards was not rerun. R5 remains a failed full round; the selective result does not replace fresh full R6 or the ordered executable gate. The raw 109-line report is retained as T11-R5-code-spec-recheck.md.

The complete R6 round finished before further edits; root verified the frozen candidate unchanged through 2026-11-25T19:22:48.821Z. Standards returned PASS with zero findings. Spec returned FAIL with R6-CS-01, Medium / BLOCKER / High confidence, classified as an introduced Settings integration defect. Architecture returned PASS / Strong / High static confidence with zero findings. Security returned GREEN (normalized PASS) / High static confidence with zero findings. R6 remains a failed full round.

R6-CS-01 traced a concrete same-page recovery sequence: Workspace and Settings initialization succeed, later content storage fails, an ordinary Settings save becomes uncertain on the recovery screen, and Retry storage replaces the Application holding the pending command. The new owner has no pending command, so the original exact Retry and draft become unavailable. The review did not claim overwritten acknowledged player rows or duplicated rewards, and its original evidence was source-based.

Before remediation, the first native diagnostic, red-settings-recovery-r6, reproduced the rollback branch but did not withhold acknowledgment in the lost-ack branch; that second case was a harness failure and is not counted as semantic RED. The failed artifact remains preserved. The initial interception targeted a transaction factory after the adapter had opened; the installed Dexie core binds db.transaction (node_modules/dexie/dist/dexie.js:3657). The corrected fixture redirects the actual receipt transaction's completion callback instead.

Corrected pre-fix native RED: red-settings-recovery-r6-corrected ran 2026-11-25T19:27:36.309Z–19:27:49.440Z with two semantic failures, one rollback and one controlled lost acknowledgment; red-settings-recovery-loading-r6 ran 19:31:06.408Z–19:31:13.305Z with one semantic Loading ownership failure. Each failed only at the intended pending/recovered-UI equality assertion, with no global errors, retries, skips, flaky outcomes or cleanup failures. Native rows stayed unchanged through storage recovery, but the old composition lost exact Retry and the locked draft; the lost-ack branch also published the committed preference before Settings acknowledgment.

A second source trace identified why preserving only an already-pending owner would be insufficient: a Settings modal can open during recovery Loading, capture an idle Application, and start Save only after bootstrap has replaced that Application and reached its content fetch. The extra Loading case opens the real public launcher through a MutationObserver and holds the ordinary development manifest response as a deterministic checkpoint after Settings refresh. It then starts the failed Save, releases the response, and checks the subsequent chooser/reopened modal. The response body is unchanged; no product hook, browser-side source-module import, source-level sleep or timing-budget change is introduced.

The composition correction retains both the Workspace repository and Settings Application for the page lifetime. WorkspaceApplication is still reconstructed, and every bootstrap still calls initialize(), including explicit db.open() and the complete native validation transaction. Idle Settings rereads native state; a pending save uses its existing acknowledged projection and is never automatically resubmitted. A surviving modal and the global Settings accessor therefore keep the same operation owner. Domain validation, the Application's pending/idle guard, receipt fingerprints, schema and native save transaction are unchanged.

Retaining the repository also makes recovery explicitly reopen the same database object owned by Settings. Installed Dexie source confirms that explicit open clears a cached failed-open state before retrying; this is a source-backed reason for the lifetime choice. No forced native connection-close/reopen failure test was executed, and no universal connection-recovery claim is made.

Post-fix TypeScript exited 0 (settings-recovery-typecheck, 2026-11-25T19:32:52.824Z–19:32:53.228Z). green-settings-recovery-r6-all ran 19:33:44.884Z–19:36:25.453Z: all 42 Ticket11 cases in five files passed once, with one worker, zero retries, repeat one, no skipped/unexpected/flaky cases, no global errors and exact discovery identity. The three structured native observations retain the original operation ID, canonical fingerprint and base revision through explicit Retry; all finish at revision 1 with one durable receipt. The complete native state and attempt trace are unchanged during Retry storage. The rollback and Loading cases retry the same attempted write, while lost acknowledgment replays its existing receipt without a second insert. Pending draft/presentation ownership and successful reload are asserted.

The lost-ack fixture first records a real trusted native completion and verifies one durable Settings revision/receipt, then delivers a controlled synthetic failure notification instead of the normal acknowledgment. It does not claim that the browser naturally aborted after committing. The rollback branch verifies that the attempted receipt and row both remain uncommitted. Public Continue legitimately updates lastUsedAt before the test's preservation baseline; all later comparisons include every unrelated historical player table.

The three cases retain structured observations before their semantic assertion, including native snapshots, pending/recovered UI, receipt lookup identities, attempted receipt bodies and the original canonical fingerprint/base revision. GREEN requires no implicit submission during storage recovery, the same identity on explicit Retry, one durable revision/receipt, unchanged unrelated rows, acknowledgment-controlled presentation, and successful reload. Loading observers, routing barriers and native instrumentation have explicit cleanup.

The selective R6-CS-01 recheck independently inspected the retained repository/Application, mandatory initialize/open/validation path, captured modal owner and late-Loading Save interleaving. It audited the exact 42-case focused GREEN selection and all nine native JSON attachments, then marked R6-CS-01 FIXED (selective PASS), retaining Medium / BLOCKER / High confidence and introduced-integration attribution. Standards was not rerun. The full original R6 FAIL remains unchanged. The complete 149-line raw report, T11-R6-code-spec-recheck.md, was read back exactly; its owned reader was closed. Root verified the full R7 candidate unchanged at 2026-11-25T19:44:06.392Z before starting the separate full round.

R7 was interrupted before its parent Spec report was completed. Its separate Standards context had already completed the full static pass and independently reproduced the full 380-input identity; that unchanged raw report was retained. On continuation, root verified the complete candidate unchanged at 2026-11-25T22:41:00.379Z and closed the orphaned reader. A fresh Spec context reviewed the complete scope, fixed its own assessment before opening the current-round Standards report, and then assembled Code/Spec. No incomplete earlier Spec assessment or peer-axis result was used. This continued the same frozen R7 round; it did not replace full review with a selective recheck.

The full R7 round completed on its unchanged candidate before further edits. Standards and Spec returned native PASS for static review, each with zero actionable findings and Moderate overall confidence. Architecture returned FAIL with T11-R7-ARCHITECTURE-001, Strong / BLOCKER / HIGH source-trace confidence, introduced by the complete Ticket11 change against the immutable base. Security returned native GREEN / normalized PASS with zero confirmed actionable findings. Its unconfirmed retained pagehide/BFCache ownership observation was recorded under Needs evidence without a severity or blocker; no runtime reproduction or newly introduced Security defect was established. Root verified the full candidate unchanged through 2026-11-25T23:15:15.103Z. R7 remains a failed full round.

The Architecture finding traced an ordinary public Salvage Apply -> Settings Save -> Build transition -> Settings reopen sequence. The page-lived Application correctly retained its operation, but each modal captured separate busy, draft, status and error variables. A save could settle in the dismissed dialog's closure while the replacement kept locked controls and an obsolete Retry. Clicking that obsolete Retry after success raised NO_PENDING_SAVE and falsely reported nonacknowledgment. Ordinary failure retained the command but its current observer missed failure feedback. Closing/reopening repaired the view; no data loss, duplicate receipt or incorrect global publication was established by the source finding.

Read-only design work proceeded while the final Security axis was running, with no candidate edits or tests before all full axes finished. It confirmed the ordinary host path and exact disjoint native transaction scopes: cargoOperations/pilots/runs for Salvage, and settings/settingsOperations/workspace for Settings.

Before any production correction, settlement-regression-typecheck passed (exit 0; 2026-11-25T23:15:15.269Z–23:15:15.708Z). red-settings-settlement-r7 ran 2026-11-25T23:16:02.410Z–23:16:22.939Z on the unchanged R7 SettingsView and exited 1: two replacement cases failed at the intended post-settlement semantic assertions (success at ticket-11-ui.spec.ts:815, lost acknowledgment at :820), while both no-replacement guards passed. All four observed trusted native completion, revision 1 and one receipt, with every native row unchanged by acknowledgment delivery. The failing replacements retained generic status and obsolete locks/Retry; success still published reduced motion correctly. All four cleanup attachments reported no problems, no retained callbacks, no open MessagePorts and no remaining owned handles. One worker, zero retries, repeat 1; no skips, flaky cases or global errors.

The correction keeps draft, readiness, busy status, message and operation error in one stable Presentation-owned state object across modal instances. Idle open still initializes from the acknowledged projection or the exact retained pending draft; a busy reopen retains the current operation state. Async Save/Retry and stale-refresh settlement render only the current connected, open dialog owner. Acknowledged publication remains independent of modal connectivity, and late close cleanup clears only its own renderer without stealing focus from a newer open modal. The later nonmodal-focus gap and its correction are recorded under R9 below. Reopening during an existing refresh does not start another refresh. No Application/persistence API, host transition, key-routing policy or timing budget changes.

After the narrow correction, settlement-fix-typecheck passed (exit 0; 2026-11-25T23:20:47.657Z–23:20:48.207Z). green-settings-settlement-r7-all passed 46/46 cases in five files, 2026-11-25T23:21:27.080Z–23:24:58.453Z, with exact identity equality to fresh discovery, one worker, zero retries, repeat 1, no skips/flaky/global errors and one result per case. The four late-settlement attachments independently confirm current replacement success/failure feedback, correct in-flight locking, acknowledgment-only publication, no-replacement focus, original-identity Retry without a second receipt, unchanged native rows, later draft cancellation and reload. All owned hooks, callbacks, MessagePorts and handles were cleaned.

The native scheduling fixture observes real trusted completion events after native commit, retains the actual installed completion callbacks, and releases the host and Settings acknowledgments in a controlled order. A synthetic abort notification is used only to deliver the controlled lost-ack error after the durable commit; it is not described as a native abort after commit. A MessageChannel task supplies a microtask checkpoint after callback release, with both ports closed. It adds no elapsed-time sleep, product hook, browser-side source import or timing-budget increase.

The comparison baseline follows the legitimate Salvage/Build transition. The proof separately checks the live replacement's in-flight controls and post-settlement feedback, no-replacement publication/focus, exact original operation identity/fingerprint, one Settings revision/receipt, unchanged durable rows on acknowledgment delivery, explicit Retry after uncertainty, later unsaved-draft cancellation, current invoker focus, reload and owned native-hook/handle cleanup. The two no-replacement cases protect previously correct behavior and are not relabelled semantic defect RED.

The selective Architecture recheck marked T11-R7-ARCHITECTURE-001 FIXED (selective PASS), retaining Strong / BLOCKER / HIGH source-trace confidence and introduced-by-Ticket11 attribution. It independently traced retained UI state, current connected/open renderer ownership, unconditional publication and idle-versus-busy reopening, and audited the saved RED/typecheck/46-case GREEN plus four native observations. The full 148-line, 16,514-byte raw report T11-R7-architecture-recheck.md was read back exactly (SHA256 224ff32d93ee53ea46a64e41c7e42dff8860a31ffd6470888e816c740605c450). Its source/helper/report readers were closed. A read/report interruption involved only truncated displayed source output; the existing reader resumed, with no abandoned mutation or execution. Separate rollback-across-handover and recovery-read-handover cases were not added; recovery-read/current-observer and delayed-close behavior were assessed by source trace. The evidence does not certify continuous focus containment through every intermediate Retry transition. This selective result does not relabel full R7 or substitute for fresh full R8.

Full R8 (T11-R8-20261125) completed on the unchanged candidate: Standards PASS and Spec PASS, each with High scoped static confidence and zero findings; Architecture PASS with HIGH static confidence and zero classified findings; Security native GREEN / normalized PASS with High scoped static confidence and zero confirmed actionable findings. The final Security report completed at 2026-11-26T00:09:38.030Z, and root recorded completion of the whole source review at 00:11:00.386Z. The full candidate digest remained 346b5f558a8f221ae68355090929825a91d5f3b6fc1ed11e72fe1516a7a304be and its runtime/test/config digest f179fba6512da2ab0f3ce331b964f23135aa0b380c2bccfb991a6461e271f550 through the post-execution check at 00:25:38.496Z.

R8 Architecture and Security retained a qualified Needs evidence observation about cached acknowledged Settings after a later Workspace reinitialization failure. A later Settings-only save still validates its own Workspace/settings/history subset. No normal UI corruption producer, accepted policy requiring revocation after an earlier successful initialization, harmful ownership path or introduced security violation was established. This was not assigned a finding ID, severity, blocker or defect deferral, and no new runtime reproduction is claimed.

The subsequent first ordered execution attempt passed typecheck (final-01-typecheck, exit 0) and all 332 allowed headless cases in 36 files (final-02-headless). Its full development-browser stage, final-03-development, ran 2026-11-26T00:12:46.143Z-00:25:19.747Z and exited 1 with 213/215 passed. Its exact 215 discovered identities ran once, with no skips, flaky cases, global errors or retries. Build and production-browser stages were not started. This failed gate remains preserved and does not change the native static-review verdicts or count as integrated PASS.

Both failures were retained Ticket03 Resume tests, at their then-current toBeHidden assertions on lines 188 and 201. Their error artifacts showed "Paused - resuming in 3..." throughout the 5000 ms assertion timeout. Direct source/base comparison explained the mismatch: after the accepted reset of lastTimestamp at Resume, their first manual frame(2999) established the baseline without consuming countdown time; frame(1) therefore left 2999 ms. The controlled fixture advances only on explicit callbacks, so assertion polling could not complete the countdown. This is recorded as a validation-harness timeline mismatch, not semantic RED for a product stepping or reward defect.

The correction was test-only: both tests establish frame(0), observe labels 3 and 1, retain the 2999/1 ms boundary split, and assert unchanged active-piece rendering through countdown completion. The delayed-frame scenario additionally checks an empty Hold through completion, then retains fresh C on an ordinary frame and unchanged 8/8 quota and 0 collected total. Existing viewport, pause, resize, delayed-frame and piece-identity assertions were preserved. Root compared every candidate input before updating the progress document and found only tests/e2e/ticket-03-ui.spec.ts changed; all production inputs were unchanged. The test change necessarily updates the runtime/test/config aggregate.

countdown-test-typecheck exited 0 at 2026-11-26T00:25:53.917Z. green-countdown-test-r8 ran 00:26:34.706Z-00:26:46.574Z and passed the exact three-case focused selection in two files: both affected tests and the existing Ticket11 Pre-Run boundary case. JSON audit confirmed one worker, zero retries, repeat one, no skipped/unexpected/flaky cases, no global errors and one result per case. A separate read-only diagnosis follow-up inspected the correction and confirmed the retained checks; it explicitly relied on root's execution audit rather than claiming an independent test run. The diagnosis reader was closed, and the follow-up opened no process. This bounded diagnosis closure does not replace a fresh full review.

Fresh list-only r9-selection-development and r9-selection-production passed at 00:26:51Z and retained the same 215 development and 128 production case identities. The next final gate starts again at typecheck with distinct r9-final evidence labels; no successful stage from the failed attempt is reused.

Full R9 (T11-R9-20261126) completed on its unchanged candidate before the second ordered gate. Standards returned native PASS with Moderate overall confidence; Spec returned PASS with High source-to-contract confidence and Moderate end-to-end confidence pending execution; Architecture returned PASS with High static confidence; Security returned GREEN / normalized PASS with High scoped static confidence. All four assessments had zero confirmed actionable findings. Root recorded full source-review completion at 2026-11-26T01:09:49.337Z. Raw reports, their native qualifications and integrity metadata remain preserved.

| Assessment | Native verdict | Confirmed findings / blockers | Native confidence |
| --- | --- | --- | --- |
| Code/Spec - Standards | PASS | 0 / 0 | Moderate overall; high for source identity and inspected test structure |
| Code/Spec - Spec | PASS | 0 / 0 | High for inspected source-to-contract trace; Moderate for end-to-end completion until the fresh ordered executable gate |
| Architecture | PASS | 0 / 0 | High for inspected static ownership, dependency, transaction, lifecycle and deterministic-input traces |
| Security | GREEN (normalized PASS) | 0 / 0 | High for the scoped static assessment |

Native source-review confidence is preserved as reported. The separately observed executable results below do not rewrite those native assessments. The full review completed at 2026-11-26T01:09:49.337Z.

The Spec report retains informational observations T11-R9-SPEC-O1 through O4: source inspection is not execution; native focus and controlled hidden input differ; actual audio is absent; and the synthetic motion fixture/controlled UI clocks do not certify every graphics or accessibility environment. None is a confirmed Spec defect.

Architecture retains a Needs evidence / contract-interpretation observation about later native Workspace revalidation after an earlier successful Settings initialization. An earlier acknowledged Settings projection may still supply edit readiness, while each native Settings transaction validates its own subset. No reachable introduced violation, severity, blocker, deferred confirmed defect or required new product decision was established. No runtime reproduction of that distinct branch is claimed.

Security retains T11-R9-SEC-OBS-01 as an unproven retained BFCache/Workspace-lock lifecycle observation: no severity, nonblocking observation, High confidence in the source fact and Low confidence in the conditional runtime path. Native BFCache restoration with a second owner and a resulting supported write were not demonstrated. It is not counted as a security finding.

| Preserved report artifact | Raw bytes | Physical lines | SHA256 |
| --- | ---: | ---: | --- |
| T11-R9-code-spec-standards.md | 18307 | 142 | 6ba17b23301d62e15ee8de00a0e4a8bfdef96f5689524e38f429d1dc5495e9de |
| T11-R9-code-spec-spec.md | 26225 | 142 | 649232ec2cf233bad3239e20d31960056eeeeab51286c4a97a5401f00373108e |
| T11-R9-code-spec.md | 45799 | 304 | a04aa2ff0cba4178d4214c57dad7aef96701b55fc891cdd97ab37546ad6c5eb5 |
| T11-R9-architecture.md | 27862 | 205 | 5124cc12a669a56f7ed0b02bf52353f33580d2ee64e963089df87753d5085cf4 |
| T11-R9-security.md | 22976 | 161 | 0efbd4d0b77262eb9b184a2527922e815d98e58f5b46398a5d5afb6f57575ec0 |

The combined Code/Spec artifact is a root provenance wrapper around the two complete, unmodified native leaf texts. All five artifacts were read back and matched their recorded raw-byte identities.

The second ordered gate passed r9-final-01-typecheck (exit 0, 01:09:49.350Z-01:09:49.764Z) and r9-final-02-headless (332/332 in 36 files, 01:10:03.341Z-01:10:29.674Z). r9-final-03-development ran 2026-11-26T01:11:19.656Z-01:23:26.920Z and exited 1: 214/215 passed, with one failure in the Pre-Run native Enter/Space Settings/Resume case. All discovered identities ran once with one worker, zero retries, repeat one, no skips, flaky cases or global errors. Both corrected Ticket03 tests passed. Build and production-browser stages were not started. The full/runtime digests remained 06404be3f2ca5229321931559799fb0fea11ec1362afe5111a004db95d3176d5 / 339cb1c0dd89110aed65f43581dd5e4b431327683858ff54be0eb6ceb7b3d334 through 01:27:22.443Z. R9 remains a source-review PASS followed by a failed integrated gate.

The retained trace established failure in the second Space iteration. Enter had completed 3/2/1 successfully. Escape closed Settings, its launcher-focused assertion passed, and Resume.focus completed, but the old closed dialog remained connected. Space then opened a new Settings modal, leaving the pause-for-Settings message. Relevant trace actions are call@13334 (Escape), call@13340 (Resume focus), call@13342 (Space) and call@13346 (failed countdown assertion). Trace SHA256: 9ee9177accbcc3e1b6575b3460f26ec9ee43ca1a6b4d1b7d784a7fff1f847b93, 11,300,481 bytes. The trace does not directly record activeElement or the native close-event timestamp; its action highlight is not treated as focus evidence.

A separate source diagnosis identified unconditional invoker.focus in deferred close cleanup when no modal was open. Two new public-UI regressions then made the ordering deterministic in Combat and Pre-Run: in one browser task they invoke Close, observe the native synchronous return to the launcher, deliberately focus Resume, and await the actual trusted native close event. red-close-focus-r9 ran 2026-11-26T01:28:09.014Z-01:28:18.085Z and failed both cases at the intended focus assertion. Each attachment recorded returnedToInvoker=true, movedToResume=true, trustedClose=true, but focusAtClose=open-settings rather than the relevant Resume button. No modal remained and the old dialog had been removed. Both failures stopped at the first Enter iteration before reaching the later Space branch. This is semantic RED for the focus overwrite; it does not depend on arbitrary sleeps, product hooks, synthetic close events or enlarged budgets.

The narrow SettingsView correction captures activeElement and whether it belongs to the closing dialog before removing that dialog. Explicit fallback restoration is limited to absent/body/closing-dialog focus, still requiring a connected invoker and no newer open modal. A later focused nonmodal control is preserved. Dialog/renderer ownership, pending operation state, native input precedence, persistence and countdown policy are unchanged. close-focus-regression-typecheck and close-focus-fix-typecheck both exited 0; the production correction was applied at 2026-11-26T01:28:48.267Z.

The first post-fix 48-case attempt, green-close-focus-r9-all, ran 01:29:29.141Z-01:32:44.353Z and remains a failed execution: 47/48 passed. All four new host/key observations passed, but the historical Shift case failed its initial openChooser before setting up historical data. Its actual network trace records GET /src/main.ts failing at 01:31:00.991Z with net::ERR_NO_BUFFER_SPACE, response status -1 and no response body; the HTML and Vite client loaded with HTTP200. Only page.goto and the chooser assertion executed. The trace SHA256 is 28d7fee680417d2b8a6df5b43c387b531618a4979da353ce910124d8b9fbd470, 21,611 bytes. The underlying resource cause was not established. No source, retry policy, network workaround or timeout change was made in response. The failed evidence is retained and is not relabeled GREEN.

After a fresh C:/D: free-space, committed-memory and task-port sample, the unchanged candidate ran a separate complete focused selection: green-close-focus-r9-complete, 2026-11-26T01:33:41.876Z-2026-11-26T01:37:12.924Z, exit 0, 48/48 cases in 5 files. Exact discovered identities ran once with one worker, zero retries, repeat one, no skipped/unexpected/flaky cases or global errors. Both hosts record real trusted close events preserving Resume after native invoker return and a later focus move, for both Enter and Space; each then passes the complete 3/2/1 frozen-board countdown. Existing native Close/Escape, same-task modal replacement, recovery, late-settlement, native focus, historical compatibility and persistence scenarios remain in this complete focused selection. Source-only and trace-only diagnosis readers were closed. This proof closes the root-discovered focus defect without changing any native R9 reviewer verdict; it does not substitute for a separate fresh full review or a new complete ordered gate.

Fresh list-only r10-selection-development and r10-selection-production completed at 2026-11-26T01:37:41Z with 217 cases in 36 files and 130 cases in 13 files. Every earlier identity is retained; the only additions are the two native-close focus cases, selected in both environments. Ticket11 contributes 48 development and 45 production cases. The existing three direct-source cases remain excluded from production.

Fresh full T11-R10-20261126 reviewers inspected the complete intended change against the original immutable base, sequentially and independently, without peer reports. Code/Spec used two fresh independent contexts for Standards and Spec. Root assembled only their final native reports after both contexts completed, without sharing one assessment with the other.

| Assessment | Native verdict | Native confidence | Confirmed findings | Blockers |
| --- | --- | --- | ---: | ---: |
| Standards | PASS | High for the static Standards assessment of the frozen source inputs | 0 | 0 |
| Specification | PASS | High for static source-to-approved-contract correspondence; Moderate for end-to-end completion while the fresh ordered gate remains pending | 0 | 0 |
| Architecture | PASS | HIGH for the inspected source and contract traces | 0 | 0 |
| Security | GREEN / normalized PASS | HIGH for the stated source-review scope | 0 | 0 |

These native assessments concern the inspected source. The ordered executable gate below is separate. Standards STD-O1 and Spec T11-R10-SPEC-NE1 explicitly reserve that execution obligation; source PASS alone does not satisfy it.

Standards STD-O2/STD-O3 and Spec T11-R10-SPEC-INFO1 retain the native-focus versus controlled-hidden distinction, cross-platform/accessibility limits and the current absence of audio payload. Architecture T11-R10-ARCH-OBS01 through OBS07 are INFO / Observed / HIGH-confidence ownership observations, with no defect severity or remediation strength; they are not findings or deferrals.

Security SEC-O1 records the retained local-authority boundary: canonical receipts and cooperative ownership do not authenticate against an actor already able to rewrite same-origin local data. No new vulnerability or hardening requirement is asserted. SEC-O2 qualifies the source-only review: it inspected no runtime attachments or application execution, which are addressed separately by the ordered gate within its stated scope.

| Native artifact or provenance wrapper | Bytes | Physical lines | SHA256 |
| --- | ---: | ---: | --- |
| T11-R10-code-spec-standards.md | 22349 | 152 | abd0fe204f63d1d6b10a27e9f60d9757b059f701b783c7de551ae071d4394509 |
| T11-R10-code-spec-spec.md | 16687 | 94 | 95291e4f198ffe6107da512d966c325562bebc860311b5cc51a442dfa91452ff |
| T11-R10-code-spec.md | 40323 | 266 | 81cea1d4a5046b6163699adc7750060ebbcf0e9026f35ffcf4100cbc44663970 |
| T11-R10-architecture.md | 21704 | 158 | 2a19353172ccc8bc491a4e0c35b3b4b765f95a7910ddbceb8110317f5aafa7d6 |
| T11-R10-security.md | 22580 | 161 | 5ddfb0b069f96702da8155ed98ad8dc4ff96bc6354bb80e6bb58af9f5b6bca31 |

The Code/Spec wrapper reproduces both complete native leaves unchanged. Root read each full native report, verified its raw-byte identity, preserved the author confidence and observation classifications, and checked the frozen source between axes.

The pending-gate wording in the native confidence above is retained from source-review time. The completed executable outcome below was established afterward; the raw reports and their confidence classifications remain unchanged.

Raw reports are retained under .scratch/ticket11-development/reviews. Final reports are T11-R10-code-spec.md, the separate T11-R10-code-spec-standards.md and T11-R10-code-spec-spec.md, T11-R10-architecture.md and T11-R10-security.md. Earlier full reports and selective rechecks remain preserved. Source-review verdicts are separate from the executable gate below.

## Fresh complete ordered gate

Runtime evidence root: C:/Users/Admin/AppData/Local/CrossDefenseTaskEvidence/Ticket11-20261125.

| Stage | Evidence label | Started, UTC | Finished, UTC | Actual result |
| --- | --- | --- | --- | --- |
| TypeScript | r10-final-01-typecheck | 2026-11-26T02:21:24.234Z | 2026-11-26T02:21:24.652Z | exit 0 |
| Allowed headless | r10-final-02-headless | 2026-11-26T02:21:36.390Z | 2026-11-26T02:22:01.422Z | 332/332; 36 files |
| Development browser | r10-final-03-development | 2026-11-26T02:22:53.826Z | 2026-11-26T02:34:50.145Z | 217/217; 36 files |
| Fresh production build | r10-final-04-build | 2026-11-26T02:35:32.916Z | 2026-11-26T02:35:33.492Z | exit 0 |
| Production browser | r10-final-05-production | 2026-11-26T02:36:19.148Z | 2026-11-26T02:47:13.945Z | 130/130; 13 files |

The allowed headless selection contains 36 files. Provider/orchestration/credential files were excluded. No obsolete Ticket09 verifier or old standalone Ticket10 full gate was used to reconfirm history.

Actual development and production case identities match the separately discovered complete selections: 217 development cases in 36 files and 130 production cases in 13 files. Discovery itself was not treated as execution. Browser runs used one worker, zero automatic retries, one repeat and unchanged assertion/server budgets. Individual outcomes, skipped/flaky/unexpected cases, repeated attempts and global errors were audited. No partial-run stitching was used.

The production gate served the fresh bundle on task port 4242 after development on port 4241. Build aggregate identity was compared again after production. The unrelated port 4175 server was neither reused nor terminated.

## Focused RED/GREEN and native proof

Earlier focused history is preserved in the completed execution plan, including missing Settings/remap/audio behavior, floating-point countdown residue, moving reduced-motion projectiles, Shift navigation and the hidden minimum-viewport footer.

Review-focused evidence includes:

- red-review-keyboard-stale: eight semantic failures across native activation/modal input, live Shift chords and stale refresh.
- green-review-remediation: 30 passed / one failed; red-settings-close-ownership independently reproduced the remaining native close-event ownership issue.
- shift-compat-red-2026-11-25T15-53-00-878Z: 25 passed / six meaningful failures; shift-compat-green-2026-11-25T15-55-19-904Z: 37/37 Settings headless PASS.
- green-review-remediation-corrected: 31/31 Ticket11 browser PASS with no retries, skips, unexpected/flaky cases or global errors.
- red-loading-overlay-r2: both Loading interleaving tests failed. Combat clocks advanced 0 to 60, Hull changed and gravity advanced behind the modal; Pre-Run's rendered piece also fell.
- loading-overlay-typecheck: exit 0. green-loading-overlay-r2: all 33 Ticket11 browser cases passed once with no retries, skips, unexpected/flaky cases or global errors.
- red-storage-access-r3: both native receipt-failure scenarios reached unchanged acknowledged data and an enabled host Retry, then failed because Settings was disabled. storage-access-typecheck passed. green-storage-access-r3 passed all 35 Ticket11 browser cases, including native keyboard/modal/focus, exact receipt replay, single durable commit and reload, with no retries or skipped/unexpected/flaky/global errors.

| Later correction | Preserved failure evidence | Complete focused result |
| --- | --- | --- |
| Sparse Settings bindings (R4) | Five meaningful headless failures and two native history/read failures | 42 Settings headless cases and 37 Ticket11 browser cases passed |
| Native focus at gameplay mount (R5) | Both real visible/unfocused mount cases changed gameplay before the guard | Complete 39-case Ticket11 browser selection passed |
| Pending Settings ownership through recovery (R6) | Corrected rollback/lost-ack RED plus the Loading ownership RED; ineffective first lost-ack instrumentation retained separately | Complete 42-case Ticket11 browser selection passed |
| Current modal receives late settlement (R7) | Two replacement-modal failures; two no-replacement guards passed | Complete 46-case Ticket11 browser selection passed |
| Retained Ticket03 controlled countdown baseline (after R8) | First full development gate 213/215; manual clock baseline mismatch, not product stepping RED | All three specifically affected/adjacent boundary cases passed after test-only correction |
| Deferred close preserves later Resume focus (after R9) | Second full development gate 214/215; both deterministic native close cases then failed at the intended focus assertion | Separate unchanged-candidate green-close-focus-r9-complete passed 48/48; the earlier 47/48 attempt with entry-module ERR_NO_BUFFER_SPACE remains failed |

The Loading interleaving is deliberately scheduled by a MutationObserver activating the real public launcher and editing a public input. Sixty ordinary RAF intervals avoid masking the defect through the long-frame safety pause. Combat proof observes both public counters; Pre-Run proof observes rendered board/Hold/Next/quota/collection/line facts, not a private tick hook. The unsaved draft and modal focus survive mounting; close alone stays paused; explicit 3/2/1 and its completion frame are frozen; ordinary play resumes afterward.

Native IndexedDB scenarios cover meaningful v9 history (completed Review, paid outcome, retained Cargo, economy and receipts), additive migration, initialization rollback, inconsistent historical Review rejection, failure at each Settings transaction write, exact Retry/reload, stale refresh success/failure, invalid v10 recovery, and preserved historical Shift mapping/receipt correction. Controlled competing writers and injected native storage failures are test scenarios, not normal UI concurrency behind the Workspace lock.

The final development and production artifacts each contain the three recovery-ownership cases and four late-settlement cases. Root independently audited their structured native/UI/trace attachments in both runs: unchanged native state across recovery or acknowledgment delivery, original identity on explicit Retry, one durable revision/receipt, acknowledgment-controlled presentation, cancellation/reload and owned fixture cleanup. Native trusted completion and the deliberately synthetic postcommit lost-ack notification are distinguished.

The final development and production runs also each contain two native visible/unfocused mounting cases and two deferred native-close focus cases. Their structured observations are audited separately: the mount cases retain identical rendered gameplay state, while each close case records native invoker return, a later deliberate Resume focus move, a trusted close event preserving that focus, no remaining old/open dialog, and both Enter and Space completing the frozen-board 3/2/1 countdown. These native focus observations do not certify a native hidden-tab transition.

## Observed UI, resources and cleanup

Root visually inspected six fresh PNGs from r10-final-05-production after the complete run passed. Header/status/action visibility and the selected factual layouts were checked; a still image is not timing or accessibility certification.

| Fresh screenshot | Observed result |
| --- | --- |
| settings-before-play.png | The native Settings modal shows the shared-device scope, initial bindings and audio defaults, visible keyboard focus, and readable Save/Close actions. |
| binding-conflict.png | The visible KeyH conflict identifies Move left and Hard drop; Save is disabled while Close remains available. |
| paused-countdown.png | Paused and Resuming in 1 are visible together with both public tick counters at 1 and the retained board/resources. Interval and completion-boundary freezing is established by the passed test, not by a still image alone. |
| settings-audio-motion.png | The saved state shows Music 20 muted, Effects 40 unmuted, Pronunciation 70 muted and Reduce motion checked, with shared-Pilot confirmation and visible actions. |
| settings-undersized.png | The undersized modal retains its title, status, Save and Close while the lower options remain in the bounded scrolling region above the footer. |
| reduced-motion-combat-1280.png | The 1280-wide actual Combat render retains ship assets, Hull/Shield, equipped words, the falling-block board, Next pieces and factual harvested-resource panels. |

All six paths are under the production run traces directory; they were read directly without source extraction or copied source artifacts.

Fresh C:/D: free-space and committed-memory samples preceded each final browser run. Task ports were free before launch. A final sample after completed runners and closed independent readers found no listener on 4241 or 4242. Exact raw counters remain in the named JSON evidence files.

| Phase / evidence file | Sampled UTC | C: free GiB | D: free GiB | Available MB (Windows counter) | Commit / limit GiB | Task listeners |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Before development / resources-r10-final-development.json | 2026-11-26T02:22:43.6421793Z | 39.845 | 1.201 | 3422 | 23.661 / 28.143 | None |
| Before production / resources-r10-final-production.json | 2026-11-26T02:35:57.9601311Z | 37.568 | 1.201 | 3466 | 23.542 / 28.143 | None |
| After runners and independent readers / resources-r10-final-closeout.json | 2026-11-26T02:50:39.0068684Z | 35.840 | 1.196 | 3134 | 23.558 / 28.143 | None |

All five final test/build runners finished with exit 0. The source reviewers confirmed closure of their owned readers and same-axis helpers. A separate read-only runtime auditor completed all three phases and closed its readers (14068, 1440 and 26144). It independently matched exact headless/browser selections, single passed attempts, stage chronology and targeted native attachments, and compared the recorded build identity values; root performed the actual before/after dist hashing and screenshot inspection.

The two task application servers stopped with their browser runners; the final resource sample at 2026-11-26T02:50:39.0068684Z records no listeners on 4241 or 4242. All four late-settlement scenarios in each environment report restored or absent owned fixtures with zero remaining callbacks, message ports, owned handles, cleanup problems or errors. The unrelated 4175 server was neither reused nor terminated. Failed evidence was retained.

The root evidence session was retained only for preparing, writing and reading back these final administrative records and the final in-memory preservation check. No persistent test/app server is required for this closeout.

Failed artifacts remain preserved. No old player-data ownership, accepted resource, unrelated pre-existing file or unrelated process was cleaned, reset, stashed or moved.

## Limits and pending acceptance

- Evidence covers the Windows Chromium development harness and its selected production bundle paths, not universal browser or accessibility certification.
- Native window focus loss was observed. Hidden-state interruption uses controlled document.hidden input and does not certify a native Windows hidden-tab transition.
- The approved packs contain no audio assets. Saved controls, requested unavailable-pronunciation feedback and absence of learning/reward side effects are verified; actual sound output is not certified.
- Historical Shift compatibility has exact-replay headless and source proof. The native historical-Shift UI scenario covers reading, explicit correction and reload; it is not a separate native assertion replaying the original historical command.
- BFCache restoration with a second Workspace owner was not exercised. R7 Security and R9 Security retained the page-lifecycle observation as unproven. T11-R9-SEC-OBS-01 has no vulnerability severity and is a nonblocking observation, with High confidence in the retained source fact and Low confidence in the conditional runtime bypass path. No native restoration, simultaneous owner or resulting supported write was established.
- No offline-completion, full-MVP, public-release, publication or deployment claim is made.
- Ticket11 user acceptance remains Pending. Earlier Ticket02/03 acceptance is not inferred or changed. Ticket12 remains ON HOLD.
