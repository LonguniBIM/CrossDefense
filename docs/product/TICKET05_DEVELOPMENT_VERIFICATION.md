# Ticket 05 - Return, Undo and Redo: Development Verification

> Latest user disposition - 2026-10-07: Ticket 05 is Approved / User accepted. The verification results below are preserved as the historical engineering record; their Pending acceptance wording describes the time of verification, not the latest disposition. Ticket 06 is separately authorized development-only; Tickets 07-12 remain ON HOLD.

Verification date: 2026-10-07, Windows local logs.
Repository: `D:\01_DCMvn\Workspace\CrossDefense`.
Branch: `tech-selection-poc`.
Original fixed point and unchanged HEAD: `fd945fae4916b8500245e74d75d65e331fb6ba43`.

## Outcome and authority

**Implemented / Locally verified / ChatGPT tri-axis PASS**, limited to Ticket 05 development-only. Final user acceptance of Ticket 05 remains Pending. Ticket 04 was explicitly accepted by the user. Tickets 06-12 remain ON HOLD; their issue files were not changed.

The original Ticket 05 acceptance criteria and UX Q246/Q257/Q276 remain the contract. See `TICKET05_EDITING_CONTRACT.md`. No content choice, word/Power rule, manifest byte, or prior content pin was changed. No provider reviewer, review credential, blocked orchestration, WFP/G-R/G-P, stage, commit, push or deployment was used.

## Delivered behavior

| Area | Observed implementation and proof |
| --- | --- |
| Return to Cargo | Explicit Inspector button unplaces the exact selected tile; retained ownership, subtype, letter, quota and Cargo capacity usage do not change |
| Impact preview | Return hover/focus previews word and Power changes separately from committed summaries; no write or free grant occurs |
| Undo / Redo | New validated durable layout edits restore canonical positions and derived summaries; revision increases rather than rolling database state back |
| Keyboard | Ctrl+Z and Ctrl+Shift+Z work outside text-entry fields; visible buttons communicate availability; repeated/pending input cannot race the current save |
| Branching | A new committed layout edit clears Redo; invalid operations and same-position no-op placements do not create history or clear Redo |
| History lifetime | Reload and reopening Build preserve saved layout but start an empty transient history; leaving and reentering Build was tested through UI |
| Failure / Retry | Each edit retains its prior acknowledged layout and history cursor on failure; Retry reuses the exact operation and publishes once |
| Lost acknowledgment | Application scenario commits an Undo then loses its acknowledgment; retry recovers the same operation without consuming another entry |
| Identity and stale edits | Duplicate-looking tiles retain separate IDs; conflicting operation IDs and stale revisions cannot overwrite a newer layout |
| Context invalidation | Named lifecycle/economy boundary clears history without restoring old aggregate data; Domain rejects changed scope, ownership, pins, hull, source layout or revision |
| Existing Build | Placement, rejection feedback, Power, crossing words, legacy content and Pre-Run regressions remain passing |

**Layout is durable; undo stacks are not.** A reload clears available Undo/Redo operations by the approved design, not because the saved ship was lost. A Return is not a discard and does not free Cargo capacity.

## Architecture and save compatibility

`src/domain/build/buildEditing.ts` owns position-only history entries, current-context comparison, valid Return/history transitions and acknowledgment-only stack movement. Existing placement rules remain in `shipBuild.ts`. `BuildApplication.ts` owns the serial editing context, pending operation and copied projection. UI emits commands and never applies an old save snapshot.

Both memory and Dexie adapters route placement and editing to one atomic layout/receipt boundary. Existing place receipt fingerprints are preserved. Save data contract v5 admits Return/Undo/Redo receipts but does not persist session history. The v4-to-v5 version-change transaction validates prior owners and receipts before publishing metadata; no prior Run, content pin, quota, retained tile or receipt is rewritten. Historical migration v4 retains its literal version.

Real IndexedDB tests cover valid upgrade, invalid receipt ownership and injected metadata-write failure with full rollback. Return/Undo/Redo receipt failures are injected after the layout write within the transaction; the saved layout and receipt publication roll back together.

## Numeric and identity examples

| Scenario | Available | Required | Surplus | Observation |
| --- | ---: | ---: | ---: | --- |
| SHIP before Return | 4.05 | 1 | 3.05 | I at C3 contributes one word-bonused Power value |
| Return I from SHIP | 0 | 1 | -1 | I remains in Cargo; the ship loses its equipped Power and supported word |
| Undo that Return | 4.05 | 1 | 3.05 | Exact I identity and SHIP layout are restored |
| SHIP + SIP crossing | 4.5 | 2 | 2.5 | Shared I is counted once |
| Return P at D3, keep P at C4 | 3.6 | 2 | 1.6 | SIP survives; the two P tiles are not confused |
| Undo that Return | 4.5 | 2 | 2.5 | Both word memberships and crossing Power are restored |

These tests use eight retained fixture tiles; that does not change the user's earlier six-tile Run. Negative Power surplus is a valid editable Build state; no Map launch behavior is introduced here.

## Review workflow

All rounds use the same original fixed point and an explicit tracked/untracked/ignored in-scope inventory. A pre-Ticket-05 snapshot protects previous uncommitted work; it is not a replacement comparison base. ChatGPT evaluated the axes separately and sequentially. No independently isolated dual pass or provider review is claimed.

| Stage | Standards | Spec | Architecture | Security |
| --- | --- | --- | --- | --- |
| Initial full tri-axis | PASS | FAIL | PASS | PASS |
| Remediation and selective re-review | PASS | PASS | No boundary change; deferred to final pass | No sensitive boundary change; deferred to final pass |
| Mandatory final full tri-axis | PASS | PASS | PASS | PASS |

**CS-05-01, Medium - FIXED:** the Retry button becomes hidden after successful acknowledgment. Focus restoration originally treated a connected/enabled but hidden button as a valid invoker, leaving Ctrl+Z ineffective until another click. The new browser regression failed with `Tile returned to Cargo.` instead of `Undo saved.`. The fix requires a visible invoker or uses the existing visible tile/grid fallback. The same regression now restores the actual tile and Power immediately after Retry; no storage or Domain semantics were changed by this fix.

No in-scope blocker was waived. Final review reports are read-only assessments of the final candidate, and executable verification is a separate gate.

## Executable verification

| Check | Actual result |
| --- | --- |
| Baseline strict typecheck | PASS |
| Baseline allowed headless suite | 54/54 PASS |
| Final strict typecheck | PASS |
| Final allowed headless suite | 74/74 PASS in 15 files |
| Final headed Chromium development suite | 53/53 PASS; 1.9 minutes; includes Ticket 01-05 regressions |
| Final production build | PASS; 126 modules; `index-DGI3cCuE.js` and `index-CfSYJic-.css` |
| Final headed production browser suite | 25/25 PASS; 1.0 minute |
| Final process result | `TICKET05_FINAL_VERIFICATION_EXIT=0` |
| Whitespace check | `git diff --check` passed; existing LF/CRLF configuration warnings remain |

The new coverage consists of 20 Domain/Application cases and 13 browser cases: seven UI, three persistence and three migration scenarios. Tests run with one worker, zero retries and traces enabled. Existing tests changed only where current schema or the approved transient-history projection changed; durable-state and historical rollback expectations remain.

Browser testing uses separate Chromium contexts and strict loopback servers on 4191/4192, not the personal browser profile at 4175. Disposable fixtures establish fault and migration states; the broader regression also earns real starter tiles through the actual Pre-Run interface. Both isolated test ports were confirmed no longer listening after completion.

Screenshots inspected include Return preview, returned Power tile, Undo-restored SHIP, restored crossing words and all three injected failure states on the headed development run. Production Return preview, Undo-restored SHIP and crossing screenshots were also inspected. Main layout bounds passed at 1280x720, 1366x768 and 1920x1080; failure messages can use the existing scrollable center panel. This is not a formal accessibility certification.

## Scope and integrity check

The final frozen payload contains 133 checked files including the separate test configuration, with zero drift. 109 protected earlier files were unchanged. Official Ticket 05 acceptance text and all seven Ticket 06-12 issue files were unchanged. The Git index remained empty and HEAD/branch did not change.

| Artifact | SHA-256 |
| --- | --- |
| Unchanged starter manifest | `99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe` |
| Unchanged Build manifest | `d5e8541107f99c0facb95a9496fd664a14d440a5b7697af21b440e7ba0f7e7fc` |
| Production Build manifest | Same as the unchanged Build manifest |

The intended delta is 16 changed existing files and seven new source/test/contract files, plus isolated test configuration. This generated evidence report is written after verification and is not a runtime change. No package installation, compiler change or new content version was required.

## Evidence and reproduction

Evidence root: `.scratch/ticket05-development/`.
Original baseline: `baseline/`.
Review rounds: `review-initial/`, `review-interim/`, `review-final/`, with scope, immutable snapshots, independent axis reports and synthesis.
Final execution log: `final-verification.log`.
Final scope check: `final-scope-check.json`.
Final headed traces/screenshots: `final-headed/` and `final-production/`.
Meaningful red logs: `return-red.log`, `history-red.log`, `migration-red.log`, `ui-red.log`, `review-focus-red.log`.

```powershell
npm.cmd run typecheck
npm.cmd test -- --run tests/headless/ticket05-editing.test.ts tests/headless/ticket05-history-domain.test.ts
$env:TICKET05_PRODUCTION = '0'
npm.cmd run test:e2e -- --config .scratch/ticket05-development/playwright.config.ts tests/e2e/ticket-05-ui.spec.ts --headed --workers=1 --retries=0 --trace=on
npm.cmd run build
$env:TICKET05_PRODUCTION = '1'
npm.cmd run test:e2e -- --config .scratch/ticket05-development/playwright.config.ts --headed --workers=1 --retries=0 --trace=on
```

The final log preserves the full allowed-suite command and results, not only the focused reproduction above. Do not edit watched source or construct live configuration checkpoints while browser tests are running.

## Remaining boundary

Actual Attempt launch, hull switching, purchasing, discarding and other future economy workflows are not implemented in Ticket 05. Their owners must invoke the tested invalidation boundary after the appropriate successful transition before those later tickets can be accepted. Current Domain tests prove stale scope cannot restore an old layout over changed non-layout Run data; they do not prove future Profile-level economy integration.

No production release, CI/branch protection, package vulnerability audit, final accessibility, remote authentication or general security certification is claimed. Final user acceptance of Ticket 05 remains Pending; Tickets 06-12 remain ON HOLD.
