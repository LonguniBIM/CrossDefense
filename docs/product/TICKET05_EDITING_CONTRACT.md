# Ticket 05 - Approved Build Editing Contract

Authority: the user accepted Ticket 04 (including its feedback fix and headed UI smoke), then explicitly authorized Ticket 05 development-only. Tickets 06-12 remain ON HOLD. ChatGPT-only Code/Spec, Architecture and Security review and isolated headed Chromium smoke apply. No staging, commit, push, deployment, provider review, credentials, blocked orchestration or WFP/G-R/G-P is authorized.

## Existing requirements

The original Ticket 05 acceptance criteria in `.scratch/first-durable-playable-slice/issues/05-revise-a-build-with-return-undo-and-redo.md` remain unchanged. UX decisions Q246, Q257 and Q276 and the Build/return/history row of `UX_UI_STATE_MATRIX.md` are the behavior authority.

Return to Cargo unplaces the selected retained tile, with a separate read-only impact preview. It does not discard, grant, purchase, refund or change Cargo capacity usage. No destructive confirmation is introduced. Both duplicate-looking tiles retain distinct IDs.

Undo and Redo affect only successful tile-layout edits in the current uninterrupted editing context. Each action is a newly validated durable command, not database rollback. The saved revision increases monotonically. A new successful layout edit after Undo clears Redo; invalid operations and no-op placements do not create history entries. Ctrl+Z and Ctrl+Shift+Z operate outside text-entry fields; buttons communicate availability.

History stacks are transient because Q246 explicitly ends history on reload. Positions and idempotency receipts are durable. Reopening Build starts an empty history and reconstructs summaries from the saved layout. Saving failures retain the prior acknowledged layout, cursor and exact pending operation; Retry cannot duplicate an edit or consume a second entry.

## Implementation boundaries

Application owns the serialized editing session and copies of projections. Domain validates current retained ownership, hull, source layout, versions and revision. History entries contain only canonical positions plus a context comparison value; no previous Run/economy snapshot is restored. Both storage adapters use one atomic layout/receipt boundary. Existing place receipt fingerprints are preserved.

Save data contract v5 admits Return/Undo/Redo receipt kinds, validates v4 state before upgrading, and preserves existing Runs, content pins, quota, tile identities and receipts. It does not persist undo stacks or migrate content pins. The two approved SHIP manifests and all word/Power rules remain unchanged.

A named `invalidateHistory` Application boundary is provided for confirmed Attempt start, hull change, retained-tile/economy change and leaving Build. Boundary behavior and rejection of stale state can be tested now. Actual Attempt launch, hull-switch and economy workflows remain in their later tickets; their owners must call this boundary after the corresponding successful transition. No implementation or end-to-end verification of those later workflows is claimed by Ticket 05.

## Proof

Use public Application/Domain scenarios and real isolated IndexedDB transactions for Return, Undo, Redo, stale/replayed requests, save failure, rollback and reload. UI proof uses the existing Build app, equivalent keyboard/button interactions, known disposable fixtures, and a headed browser context on a separate loopback server. Never use the user's personal Pilot save for injected faults.

The original review fixed point remains `fd945fae4916b8500245e74d75d65e331fb6ba43`. The pre-Ticket-05 snapshot separates earlier uncommitted work from this change; it is not a new comparison base. Final user acceptance of Ticket 05 remains Pending until explicitly given.
