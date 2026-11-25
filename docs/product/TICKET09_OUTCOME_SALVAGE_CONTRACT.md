# Ticket 09 - Outcome Settlement and Staged Salvage Contract

Date: 2026-10-11

## Authority and scope

The user accepted Ticket08 and authorized Ticket09 development-only. Existing Q13 rewards, Q14 content compatibility, Q244/Q259 complete Salvage choices and Q260 single destructive/build-impact confirmation govern this implementation. No new pack, difficulty ratio, currency amount, Map, asset or game rule is selected by this contract.

Current status (2026-11-25): **Implemented / Integrated verification PASS / User acceptance Accepted**, after exact checkpoint validation. [The acceptance record](TICKET09_ACCEPTANCE_20261125.md) distinguishes new validation from the complete 19 November gate. Ticket10 subsequently implemented approved Q15 Review behavior and passed integrated verification and ChatGPT tri-axis review, development-only; see [the Ticket10 record](TICKET10_DEVELOPMENT_VERIFICATION.md). Ticket10 user acceptance was explicitly granted on 2026-11-25 (Asia/Ho_Chi_Minh); see [the acceptance record](TICKET10_ACCEPTANCE_20261125.md). Stage, commit, push and merge of the completed product work are authorized; deployment and suspended operations remain unauthorized. Ticket11 is the next-session implementation target and has not started here; Ticket12 remains ON HOLD. This status update does not change the behavior contract below.

## Saved outcomes and permanent Pilot economy

Original `combatOutcomes` rows remain immutable, including historical `pending-ticket09` or `not-eligible` status. A separate `outcomeSettlements` row, keyed by AttemptId, records payment disposition. Results distinguishes an outcome saved by combat from its reward settlement acknowledged by storage. Historical outcomes remain accessible after the Run's latest Attempt envelope changes.

Q13 repeatable victory Credits are 3/4/6/9 for Easy/Normal/Hard/Insane. First-Clear adds 20 Credits and 1 Celestium once per Pilot/Map, not per difficulty, Run or content version. Failed, abandoned and interrupted outcomes receive zero currency and do not claim First-Clear. Per-enemy kills pay nothing. Settlement reads frozen outcome definitions, never UI amounts or the current default pack. Unsupported fractional authored rewards are rejected rather than assigning a new rounding rule.

A single transaction publishes Pilot balances, first-clear claim, Run completion boundary, Attempt settlement receipt and stable operation acknowledgment. Same-operation Retry or a different operation for an already settled Attempt cannot pay again. Duplicate operations return current balances/layout, not an old aggregate snapshot. Concurrent different victories share the Pilot/Map entitlement once. The UI exposes Save rewards or Record result explicitly and shows balances only after acknowledgment.

The original Ticket09 delivery accounts for outcome-settlement income. Ticket10 extends the same ledger owner with approved Q15 Review receipts; see [the Review contract](DEVELOPMENT_REVIEW_SHIP_V1.md) and [Ticket10 verification](TICKET10_DEVELOPMENT_VERIFICATION.md). Missing or inconsistent balance/receipt/first-clear state is a recovery error, never permission to create zero balances or replay payment. Purchases remain outside these tickets. New Pilots have no earned funds. Migration adds no free/backdated grant.

This pack has one Map. Completion permits replay in the same Run after Salvage is resolved. No fictional next Map, full-MVP completion, restart/delete or upgrade is introduced. `clearedMapIds` records completed authored Maps; the existing initially-available Map stays available.

## Historical starter versus mutable retained Cargo

Pre-Run `salvage.order`, `collectedIds`, `completed` and quota stay unchanged when equipment is discarded later. Legacy Runs without explicit Cargo derive ownership from the original collected starter. After successful post-Map Apply, `run.cargo.tiles` is the explicit ownership list with its own revision.

Build projections, placement, history admission and subsequent Attempt startup use current retained Cargo, not starter history. All retained items, placed or unplaced, count toward 24 capacity. Economy/Cargo changes invalidate layout history; Undo cannot reverse currency, restore discarded tiles or erase earned ownership.

A nonempty post-combat buffer must match its frozen Attempt's actual committed payload identities and letter/subtype definitions even after ending. Shape-valid invented IDs or changed letters cannot be promoted through Apply. A resolved empty buffer remains valid; original records are preserved on rejection.

## Staging and Apply

Every buffer tile requires one explicit Keep or Discard choice. Optional removal of retained items is by exact identity, not letter grouping. Kept entries enter unplaced Cargo with original IDs. Removing retained equipment removes only its positions; this is not automatic cell replacement or optimization.

Preview shows capacity, before/after Words and Power, and affected equipment. Unresolved, duplicate, unknown, over-capacity or stale choices cannot Apply. The command binds Pilot/Run, content/Ruleset pins, reviewed Cargo/Build revisions, exact buffer identities and confirmed choices. The transaction revalidates these, saves retained ownership, empties the buffer, removes affected placements and adds a receipt atomically. Discard grants no currency.

One final modal lists kept/discarded identities, equipped positions removed, capacity and word/Power changes, and states that discarded items cannot be restored by layout Undo. Cancelling the modal or leaving staged Salvage changes no saved ownership; reopening begins unresolved. There is no implicit Keep, timed auto-resolution or duplicate confirmation.

Failure retains the acknowledged snapshot and pending command. Editing/navigation is blocked until Retry or reload recovery. An acknowledged Apply with a lost response cannot duplicate tiles on Retry. Old-operation replay never restores an obsolete layout over later acknowledged placement.

## Schema and compatibility

Player Data contract 8 adds `pilotEconomies`, `outcomeSettlements`, `outcomeOperations` and `cargoOperations`. Existing tables, pins, Attempt startup, outcomes, assets and Ruleset bytes remain unchanged. v7-to-v8 validates owners, receipts and outcomes before writing the root version; failure rolls back the whole upgrade. Earlier migrations retain explicit intermediate targets.

Legacy Build/diagnostic/DOM-combat/rendered Runs keep their capabilities. Graphics, simulation timing, RNG, damage, payload distribution and Q14 assets are unchanged. Only necessary ownership access and post-Attempt validation change. Fault injection uses disposable browser contexts, not personal saves.

## UI and verification boundaries

Results and Salvage are DOM screens accessible from Build; terminal combat adds View results and preserves Return to Build. Actions/feedback remain visible at tested minimum/reference widths; long histories and tile lists are scrollable. Attempt no-scroll/graphics behavior remains separately regression-tested.

Browser helpers await the actual Salvage screen and expected controls before enumerating choices. They do not force-enable Apply or use sleeps. Synthetic historical terminal fixtures are separate from actual keyboard Scout/Boss/Victory, settlement, Salvage and replay-launch proof.

Final verification covers migration/transaction failures, concurrent entitlement, exact Retry, cancel/replacement, old content, screenshots and complete development/production gates. Standards/Spec, Architecture and Security are separate logical ChatGPT assessments, not isolated-provider reviews or full-product certification.
