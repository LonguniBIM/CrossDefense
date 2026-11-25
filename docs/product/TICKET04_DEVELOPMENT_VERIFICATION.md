# Ticket 04 - Development Verification and ChatGPT Tri-Axis Review

Date: 2026-10-06, Asia/Ho_Chi_Minh.
Repository: `D:\01_DCMvn\Workspace\CrossDefense`.
Branch: `tech-selection-poc`.
Original fixed point and unchanged HEAD: `fd945fae4916b8500245e74d75d65e331fb6ba43`.

## Outcome

**Implemented / Locally verified / ChatGPT tri-axis PASS.** The engineering gate is GREEN within the explicitly approved Ticket 04 development-only scope. Final user acceptance remains Pending. Tickets 05-12 remain ON HOLD. No staging, commit, push, deployment, provider reviewer, review credentials, blocked orchestration, WFP/G-R/G-P or provider round 6 was performed.

The user approved Q5-Q8: a 13-cell development hull, six supported spellings with CEFR Unknown, exact hundredths for Level-1 word/Power calculations, and a new versioned pack without migrating old Run pins. See [the approved Build contract](DEVELOPMENT_BUILD_SHIP_V1.md). Prior tickets' final user acceptance was not silently relabelled.

## Delivered behavior

| Area | Delivered result |
| --- | --- |
| Versioned content | New `development-build-ship-v1`, content schema 2, paired with `development-build-ruleset-v1`; SHIP/quota 8 and the approved eight tiles are retained; assets remain empty |
| Hull | 5 x 5 bounding grid with 13 allowed cells: C1; B2/C2/D2; A3/B3/C3/D3/E3; B4/C4/D4; C5 |
| Vocabulary | SHIP, SHIPS, HIP, HIPS, SIP, SIPS; all CEFR Unknown; maximal contiguous horizontal/vertical sequences, without substring bonus duplication |
| Placement | Click-select/place, native drag/drop and keyboard navigation call the same Application placement intent; only retained tiles can be placed |
| Rejection | Occupied, out-of-hull, fractional, unowned, mismatched-version or stale-revision requests preserve the saved layout and tiles; no automatic swap |
| Preview | Separate before/after Power and affected-word feedback; preview does not write state or inflate committed summaries |
| Derived summaries | Equipped Words, all nine Equipped Tile subtype counts and Power derive from saved positions plus pinned definitions; unplaced tiles contribute no equipment effects |
| Unsupported sequences | Neutral Not supported feedback in preview and the contextual Inspector after commit/reload; intrinsic effects remain |
| Persistence | Canonical hull/positions/revision and a fully bound receipt commit atomically; Retry preserves the same request; duplicate replay cannot undo later edits |
| Legacy Runs | Old starter content and Ruleset pins remain intact; a legacy Run without Build definitions has a readable unavailable surface and retains its tiles |
| Layout | Cargo left through the usable bottom; grid and Power center; Inspector right; Equipped Tiles below grid; Equipped Words bottom-right; minimum/reference bounds verified |

The new default is loaded from `public/content/packs/development-build-ship-v1/manifest.json`. The original `public/content/packs/development/manifest.json` is not overwritten. A fresh Pilot/Run uses the new Build pack. Old Runs do not borrow the new hull or vocabulary.

## Numeric proof

All values below were verified through public Domain scenarios; the single SHIP result was also observed through native browser input and reload.

| Layout | Available Power | Required Power | Surplus | Relevant rule |
| --- | ---: | ---: | ---: | --- |
| One SHIP | 4.05 | 1 | 3.05 | Four-letter factor 1.35; one Power tile and one Ballistic tile |
| One SHIPS | 4.65 | 2 | 2.65 | Five-letter factor 1.55; no additional SHIP substring |
| Two SHIP words sharing I at C3 | 4.50 | 2 | 2.50 | Shared Power tile factor 1.50, counted once; seven unique equipped tiles |
| Unsupported SHI | 3 | 1 | 2 | Intrinsic Power only, no supported-word bonus |

Integer hundredths are authoritative; the UI displays at most two decimals and strips trailing zeroes. Combat damage rounding, mitigation K, permanent technology progression and balance certification remain outside Ticket 04.

## Architecture and save compatibility

`src/domain/build/shipBuild.ts` owns the pure placement transition, ownership/hull checks and derived word/equipment projection. `rules.ts` owns the explicitly versioned numeric policy. `BuildApplication.ts` owns pinned content resolution, opening admission, ordered commands, pending retry and copied projections. The memory and Dexie adapters own atomic receipt/state publication. `BuildView.ts` renders projections and emits intents; it does not persist derived summaries.

Save schema 4 is additive. It introduces optional canonical Build data and the `buildOperations` receipt table. The version-change transaction validates existing data before publishing the new root version and does not rewrite previous Run pins, quotas, collected entries or receipts. Tests cover valid upgrade, invalid legacy state and injected metadata-write rollback. Historical version 3 remains explicitly version 3 within its own migration.

## Compilation and fingerprints

The existing compiler compiled the actual approved authoring source twice into separate staging files. Both outputs were byte-identical and passed the shared runtime validator before exclusive creation of the new runtime artifact. No new dependencies were installed.

| Item | Value |
| --- | --- |
| Authoring source | `content/authoring/development-build-ship-v1.json` |
| Compiled size | 1178 bytes |
| New compiled whole-file SHA-256 | `d5e8541107f99c0facb95a9496fd664a14d440a5b7697af21b440e7ba0f7e7fc` |
| New canonical payload SHA-256 | `8beea9729f95b1c374597cba8ae974a41aa708781123ef12a7b62bfd2c2c9aec` |
| Unchanged legacy compiled SHA-256 | `99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe` |
| Production artifact copy | Same whole-file SHA-256 as the new runtime artifact |

The path-specific `.gitattributes` safeguard preserves generated manifest bytes without changing global Git configuration. Checksums establish integrity, not publisher authentication.

## Review cadence and findings

All rounds retain the original fixed point and explicitly include untracked in-scope files. The pre-Ticket-04 snapshot protects earlier uncommitted work; it is not a replacement comparison point. Each round freezes a new file inventory and source copy. ChatGPT evaluated the axes separately and sequentially; no isolated dual pass or provider independence is claimed.

| Stage | Standards / Spec | Architecture | Security |
| --- | --- | --- | --- |
| Initial full review | FAIL / FAIL | FAIL | PASS |
| First selective re-review | PASS / FAIL; new contextual feedback finding | PASS; lifecycle boundary changed | PASS; command admission changed |
| Second selective re-review | PASS / PASS | Not repeated for presentation-only text change | PASS; dynamic text path checked |
| Mandatory final full review | PASS / PASS | PASS | PASS |
| Final executable verification | PASS, separately observed after review | Review does not replace tests | Review is not a security certification |

| Remediation unit | Finding IDs | Disposition and proof |
| --- | --- | --- |
| Application admission | CS-01 and ARCH-01, Medium | FIXED; same-turn place/open and overlapping-open regressions first failed, then proved that opening cannot invalidate or retarget queued placement |
| Minimum viewport | CS-02, Medium | FIXED; panel bounds and root height were measured; row/grid budgeting plus non-collapsing padding preserve the visible panels; populated 1280x720, 1366x768 and 1920x1080 assertions pass |
| Unsupported committed word context | CS-03, Medium | FIXED; Inspector derives Not supported wording from existing committed word data; UI/reload regression preserves intrinsic Power and supported-only Equipped Words |

No blocker was waived, no risk acceptance was inferred, and official acceptance criteria were not amended. The final review covers the intended Ticket 04 change and directly relied-upon boundaries, not every unrelated dirty file in the repository.

## Executable verification

| Check | Final observed result |
| --- | --- |
| Baseline typecheck and prior headless suite | PASS; 39 tests |
| Final strict TypeScript typecheck | PASS |
| Final allowed headless suite | 54/54 PASS in 13 files |
| Final Chromium suite on development server | 36/36 PASS in 12 files |
| Final production-build browser suite | 14/14 PASS in 3 files |
| Production build | PASS; 125 modules; `index-gOjWoNyh.js` and `index-Cij6j4pv.css` |
| Frozen final payload | 107 files checked; zero drift |
| Protected baseline files | 69 checked; zero unexpected changes |
| Official Ticket 04 acceptance text | Unchanged |
| Later tickets | 05-12 remain ON HOLD |
| Git index and HEAD | Empty index; original HEAD unchanged |

The fresh-player browser scenario fetches the actual compiled Build manifest through HTTP, creates a real Pilot, earns the eight tiles by legal keyboard actions in Pre-Run, finishes, places SHIP, and reloads the saved Build. It does not inject those rewards or use a fulfilled positive content response. Separate disposable fixtures establish migration and fault states. Native drag/drop, click and keyboard routes, preview/rejection, receipt failure/Retry, legacy compatibility and unsupported-word feedback have direct browser proof.

Tests use isolated browser contexts and loopback servers on ports 4181/4182 with existing-server reuse disabled. The frame-control helper only controls the test clock; gameplay actions use normal keyboard input and read-only DOM observations. Production minimum, populated SHIP and genuinely earned-tile screenshots were visually inspected. No personal browser profile or production save was used.

### Earlier failures and execution limits

Earlier logs are retained, not converted into passes. One combined run was interrupted when a review checkpoint copied `tsconfig.json` under Vite's watch root, causing a full reload to Pilot chooser. A disposable probe reproduced the exact websocket full-reload event; checkpoint construction and browser verification were then sequenced, and the unchanged Pre-Run regression passed three consecutive isolated runs. Another combined run hit Chromium `ERR_NO_BUFFER_SPACE` before loading the app in one test; no network/firewall settings were changed. The final fresh combined run passed all required checks with exit 0.

Existing regression inputs were updated for the explicitly approved current default/schema. A legacy migration fixture explicitly admits its real old pack before bootstrap, and a Retry assertion waits for the second actual durable attempt rather than merely a hidden button. Legacy artifact bytes and rollback/identity expectations were preserved. Provider/orchestration test files were intentionally excluded; this is not repository-wide or CI verification.

## Evidence and reproduction

Evidence root: `.scratch/ticket04-development/`.
Round records: `review-initial/`, `review-interim/`, `review-interim-2/`, `review-final/`, including briefs, separate raw axis reports, frozen files, inventories and tracked diffs.
Final combined log: `final-verification.log`, ending `TICKET04_FINAL_VERIFICATION_EXIT=0`.
Final fingerprint/scope check: `final-scope-check.json`.
Compilation proof: `compilation.json` and the two staging manifests.
Focused failure/diagnosis logs include content, Domain, Application, persistence, UI, admission, layout, unsupported feedback, checkpoint reload and intermediate combined verification records.
Screenshots: `browser-production/`.

```powershell
npm run typecheck
npm test -- --run tests/headless/ticket04-content.test.ts tests/headless/ticket04-build-domain.test.ts tests/headless/ticket04-build-application.test.ts
npm run test:e2e -- --config .scratch/ticket04-development/playwright.config.ts tests/e2e/ticket-04-migration.spec.ts tests/e2e/ticket-04-persistence.spec.ts tests/e2e/ticket-04-ui.spec.ts
npm run build
$env:TICKET04_BUILD = '1'
npm run test:e2e -- --config .scratch/ticket04-development/playwright.config.ts
Remove-Item Env:TICKET04_BUILD
```

The complete allowed-suite file lists and actual command output are preserved in the final log. Do not create review checkpoints or edit watched source/configuration while a Vite browser test is running.

For manual review, run `npm run dev` from the repository root. Create a new Pilot/Run, collect the SHIP starter, Finish Salvage, then place tiles in Build. Old pinned starter Runs intentionally cannot use the new Build definitions without a separately approved migration.

## Remaining boundary

Final user acceptance remains Pending. Return/Undo/Redo is Ticket 05; hull switching, combat, progression, Learning Entries/audio, full offline delivery, final art/balance, formal accessibility and release security certification are not delivered by this ticket. No later ticket was opened automatically.


## 2026-10-06 addendum - approved placement feedback fix

**Outcome: Implemented / Locally verified / ChatGPT tri-axis PASS for this bounded follow-up.** Final user acceptance remains Pending; Tickets 05-12 remain ON HOLD. The user approved fixing the stale occupied/outside-hull message observed during manual Ticket 04 testing. This addendum does not amend official acceptance criteria or relabel earlier tests as new evidence.

### Behavior delivered

| Situation | Result |
| --- | --- |
| A new target/tile preview follows an occupied/outside rejection | The obsolete command-error message clears; the new preview describes its own target |
| Escape after a target rejection | Selection and preview cancel; the obsolete target error clears |
| The current target is still invalid | Current invalid-preview feedback remains; a fresh rejected command is not immediately hidden |
| Placement succeeds | The Placement saved acknowledgment remains; it is not misclassified as an error |
| Saving fails | The diagnostic and Retry remain visible after hover/Escape; retry uses the same durable operation |
| Preview/cancellation | No positions, Cargo, words, Power, content pins or receipts are changed |

Only `src/presentation/BuildView.ts` and `tests/e2e/ticket-04-ui.spec.ts` changed in executable source/test scope. This dated report addendum is the only other non-scratch file changed. Application, Domain, save schema, dependencies, content and Rulesets are unchanged.

### Cause and remediation

Previously, preview/cancellation updated preview fields but left the last command error in `build-status`. The fix tracks only ordinary typed OCCUPIED/OUTSIDE_HULL rejections with their candidate identity. Generic storage/recovery messages and success acknowledgments are never dismissed by this rule.

Regression testing caught an intermediate fix hiding fresh errors: rebuilding the grid could emit pointerover under a stationary pointer. The isolated event probe recorded pointerover without pointermove after the new rejection. Changing the pointer-preview trigger to pointermove, together with guarding automatic focus restoration, preserved the fresh error while clearing it on actual new interaction. The same failing browser scenarios then passed. No gameplay input contract, timer, save guard or timeout was weakened. Temporary diagnostic instrumentation was removed from source/tests; the failed logs remain in the evidence directory.

### Review and verification

| Stage | Standards / Spec | Architecture | Security |
| --- | --- | --- | --- |
| Initial full tri-axis | PASS / FAIL: FB-01, Low, required scoped fix | PASS | PASS |
| Remediation and selective re-review | PASS / PASS | Not repeated; no port/ownership/transaction change | PASS; diagnostic handling checked |
| Final full tri-axis | PASS / PASS | PASS | PASS |

All rounds use fixed point `fd945fae4916b8500245e74d75d65e331fb6ba43` and separate frozen inventories. The review is sequential ChatGPT-only, with separate axes; no isolated dual reviewer or provider independence is claimed. No remaining finding is deferred within this fix's scope.

| Executable check | Actual result |
| --- | --- |
| Baseline typecheck and existing Ticket 04 UI scenarios | PASS; 7/7 browser tests |
| Original hover and Escape defects | Reproduced separately by failing browser assertions before their fixes |
| Focused final Ticket 04 UI suite | 11/11 PASS, including four new scenarios |
| Final strict TypeScript typecheck | PASS |
| Final allowed headless regression | 54/54 PASS in 13 files |
| Final development Chromium regression | 40/40 PASS in 12 files |
| Final production build | PASS; 125 modules |
| Final production-build browser regression | 18/18 PASS in 3 files |
| Final command result | TICKET04_FEEDBACK_FINAL_EXIT=0 |
| Scope and fingerprints | 95 protected files unchanged; 97 frozen files excluding this evidence report have zero drift |

Production screenshots of the valid preview after rejection and Escape cancellation were inspected. Browser runs used disposable contexts and dedicated loopback ports 4181/4182, not the user's browser profile or personal saves. Existing lower-level and end-to-end scenarios still verify real content loading, placement, reload, migration and fault recovery. This is not a claim of CI, full offline-milestone, formal accessibility or whole-codebase security verification.

The legacy manifest SHA-256 is still `99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe`; the Build manifest remains `d5e8541107f99c0facb95a9496fd664a14d440a5b7697af21b440e7ba0f7e7fc`, matching its production-build copy. Branch remains `tech-selection-poc`; HEAD is unchanged and the index is empty. No staging, commit, push, deployment, provider reviewer, review credentials, blocked orchestration, WFP or G-R/G-P action occurred.

Evidence: `.scratch/ticket04-feedback/initial/`, `interim/`, `final/`, `red-hover.log`, `red-escape.log`, `event-probe.log`, `focused.log`, `final-verification.log`, `scope-check.json`, and `browser-production/`. The final inventory uses `.snapshot` suffixes for source copies and does not create watched tsconfig files during tests.
