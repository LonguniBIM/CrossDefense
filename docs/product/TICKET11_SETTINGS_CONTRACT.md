# Ticket11 Settings, Controls, Focus and Pause Contract

Date: 2026-11-25 (Asia/Bangkok)

Engineering closeout: 2026-11-26 (Asia/Bangkok)

## Authority and status

Ticket11 development is authorized by the current session handoff. The user explicitly approved **Q16: Workspace/device-scoped gameplay bindings** on 2026-11-25. Ticket11 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS, development-only. The final full review and fresh complete ordered gate are recorded in [the engineering verification](TICKET11_DEVELOPMENT_VERIFICATION.md). The user accepted Ticket11 and requested commit, push, merge and deployment on 2026-11-26; see [the acceptance record](TICKET11_ACCEPTANCE_20261126.md). Deployment awaits a concrete hosting destination. Ticket12 implementation remains ON HOLD.

The [completed execution plan](../plans/completed/ticket11-controls-focus-pause.md) records the immutable entry baseline and exact session restrictions. This contract supplements the existing Ticket11 acceptance criteria; it does not change Q13 combat/economy, Q14's exact fourteen assets, Q15 Review rules, old Run pins or save acknowledgments.

## Accepted product behavior

| Area | Contract |
| --- | --- |
| Ownership | Gameplay bindings, Music, Effects, Pronunciation and reduced motion belong to the local Workspace/device and are shared across its Pilots. Difficulty, tutorial and learning state retain their existing Pilot ownership. |
| Persistence | Only acknowledged settings become active. Reload retains acknowledged values. Restore control defaults changes the shared bindings after Save. |
| Defaults | Left/Right movement; Down soft drop; Up or X clockwise; Z counterclockwise; Space hard drop; C or either Shift Hold; Escape Pause. |
| Remapping | One to three compatible physical key aliases per action; explain conflicts using both affected actions and the key. Every action retains at least one key. New Shift bindings are limited to standalone rotation, Hard drop, Hold and Pause; movement and Soft drop require hold-capable keys. |
| Native input | Tab/Shift+Tab navigation, native buttons, editable fields and Ctrl/Alt/Meta shortcuts keep their native meaning. Standalone Shift may remain a Hold binding. Escape cancels a modal. |
| Overlay pause | Opening Settings during active Pre-Run or Combat stops gameplay, clears held and queued actions, and leaves explicit Resume after closing. If Settings is already open on the Loading screen, a newly mounted gameplay host applies that pause before its first frame while retaining the dialog and draft. Other accepted blur, hidden-tab and undersized-viewport guards remain. |
| Resume | Show 3, 2, 1 while both Combat and Falling Blocks clocks stay stopped. The completing countdown frame also stays stopped. A new pause cancels the countdown; becoming visible or large enough never resumes automatically. |
| Durability | Ordinary successful save barriers keep their accepted automatic continuation without a user countdown. |
| Focus | The native modal keeps the underlying page inert; native traversal remains available and close/cancel restores the still-connected invoking control. Settings remains accessible below the minimum play viewport and during recovery. |
| Motion | Explicit Workspace reduction OR the OS preference selects reduced presentation. Keep Hull, Shield, Threat, equipped words, module progress, board, harvest and receipts factual and visible. No default screen shake. |
| Audio | Independent channel volume/mute, requested pronunciation only, text equivalents and nonblocking missing-audio feedback. Playback and missing audio never grant learning evidence or rewards. |

Sources: [UX decisions](UX_UI_DESIGN.md) Q233/Q237/Q241/Q254/Q268-Q270/Q276-Q277/Q279/Q281; [state matrix](UX_UI_STATE_MATRIX.md); the local Ticket11 issue linked by the plan; current Q16 approval.

## Documented implementation choices

- Initial volume values are Music 45%, Effects 65%, Pronunciation 85%, all unmuted. These are reversible presentation initialization values, not approved numeric gameplay or learning policy.
- The explicit reduced-motion setting starts false; the system preference is always respected.
- Binding capture and live gameplay wait until release for standalone Shift, so Shift+Tab remains native navigation. All other physical key timing remains unchanged. A shared Presentation input router owns native-control/modal/browser precedence and Shift arbitration for both gameplay hosts.
- Reserved focus/modifier keys and malformed physical codes are rejected at the Settings boundary. No exhaustive browser shortcut blacklist is invented.
- Q268/Q281 and the Falling Blocks timing contract require native Shift+Tab and unchanged held movement/soft-drop behavior. New-save validation therefore rejects Shift for Move left, Move right and Soft drop with a reason. Stored structural values and acknowledged receipt fingerprints retain their prior interpretation; an earlier incompatible mapping remains readable, shows a correction warning and requires an explicit compatible edit. No saved row is silently reset or rewritten.
- Settings uses a native modal outside the current screen root, so Build's layout-history handlers and blanket button disabling do not consume modal input. A synchronously closed dialog relinquishes ownership before another open action, even if the browser delivers its close event later; delayed close events do not steal focus from a newer modal or a subsequently focused nonmodal control.
- The shared Settings launcher has a Workspace-owned marker. Build and Salvage persistence locks exclude that launcher while continuing to lock their feature controls. Opening Settings does not acknowledge, cancel, replace or resubmit the host's pending operation.
- The current approved packs contain no audio. No assets are added or fetched. The Review pronunciation request reports unavailability without adding a hint, response or reward. Actual sound output is not certified by this slice.

## Native persistence and acknowledgment

Schema v10 adds one Workspace settings row and a settings-operation receipt store. Migration validates the historical v9 ownership, Review, outcome, economy and Cargo relationships before writing defaults and advancing metadata. Existing Pilot, Run, content pins and historical receipts are preserved.

Settings and its receipt commit in one transaction. Revision guards reject stale commands. Exact Retry retains the original operation identity after ordinary storage failure or lost acknowledgment. A replay returns the current saved projection so an old Retry cannot overwrite a newer acknowledged preference.

A stale-command rejection refreshes the acknowledged projection and shows the current saved settings without automatically resubmitting the rejected draft. If that read fails, Settings stays read-only; reopening retries the read. Ordinary uncertain saves retain the exact Retry operation and are never refreshed away.

The Workspace recovery composition retains the same repository and Settings Application for the page lifetime, including a modal opened while recovery is Loading. Every bootstrap still explicitly initializes and validates native storage. Idle Settings refreshes acknowledged values; a pending save preserves its original command and acknowledged projection until explicit Settings Retry. Retry storage never submits or acknowledges that Settings operation.

Every declared binding slot is validated before canonical settings are returned. Sparse arrays are rejected rather than silently filtered. At the Application boundary this happens before operation-ID allocation; direct native commands are rejected before opening a write transaction. Valid dense bindings retain their order and canonical receipt bytes, including historical Shift mappings.

Invalid or inconsistent stored settings enter recovery; they are never silently reset. Settings is read-only until Workspace initialization succeeds.

## Presentation and clock boundary

The Settings Application validates and serializes acknowledged state; Presentation owns the editable draft and input routing. No settings fields enter a Ruleset, combat formula, Content Pack, Review occurrence or reward command.

A host transition may dismiss Settings while its save or recovery read is still pending. Reopening before settlement preserves the same draft, busy state and operation feedback; the current open modal observes success or failure when that operation settles. Acknowledged preferences still publish if no modal is open. Settlement does not open or close a dialog or move focus, and a delayed close event cannot clear a newer modal's renderer. After the operation is idle, closing an unsaved edit and reopening restores the acknowledged projection, or the exact retained draft for an uncertain save.

Combat retains its existing Application-owned fixed-step and pause state. Pre-Run retains its existing browser clock host. Both clear queued/held input and reset elapsed-time baselines at pause/resume boundaries. Before Settings attachment and the first gameplay frame, each host also reconciles current native focus through its existing pause owner. An adequately sized, visible but unfocused host starts paused; focus returning alone leaves explicit Resume. Existing hidden/undersized reasons retain precedence. A sub-nanosecond numerical tolerance prevents floating-point RAF subtraction from creating a spurious extra countdown frame; it does not shorten meaningful countdown intervals.

Reduced motion uses fixed firing-module, hit, repair and regeneration markers, suppresses projectile travel, decorative recoil and Shield ripple, and retains actual module progress and active laser facts. Rendering remains read-only with respect to the supplied projection.

## Verification obligations

Use public Domain/Application scenarios and the real native IndexedDB/browser path. Required evidence covers shared remapping across Pilots, reload, defaults/conflicts, native keyboard routing, overlay/visibility/resize countdown interruption, focus restoration, motion facts, native v9 migration/rollback, save failure/Retry and corrupt settings recovery.

Native focus loss and controlled document.hidden input must be reported separately. A controlled hidden signal is not certification of a native hidden-tab transition on this Windows harness.

After a frozen candidate: initial full independent Code/Spec, Architecture and Security reviews run sequentially before fixes; supported findings receive focused proof; a separate final full round follows. Then a fresh ordered gate runs typecheck, allowed headless tests, development browser tests, fresh production build and production browser tests, with one browser worker, zero retries and unchanged budgets.

## Scope limits

The accepted development slice is now authorized for staging, commit, push, merge and requested deployment. A concrete hosting target and live verification are still required before deployment can be claimed. Provider reviewers, review-credential setup, suspended orchestration, WFP/G-R/G-P work, source snapshots, source bundles/exports, replacement on-disk source inventories and reconstruction of the refused snapshot operation remain excluded. No Ticket12 implementation, new assets, balance, vocabulary, rewards or offline-completion claim is introduced.
