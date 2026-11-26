# Ticket12 — T12-R3 Independent Full Code/Spec Review

**Standards: PASS. Spec: PASS.** No new Standards or Spec blocker was established in this fresh review of the complete Ticket12 implementation against the original baseline.

The prior exact-tile assertion, waiting-worker cache repair, and Build viewport findings are **fixed** in the examined source and current recorded native evidence. The update-lifetime and Content Retry corrections are also corroborated within this reviewer’s Code/Spec scope.

**Integrated verification remains INCOMPLETE.** The separate, fresh, ordered executable gate is still pending and must follow the full review round. This report does not convert the current focused/native runs into that final gate, infer user acceptance, or authorize publication.

This was **one isolated Code/Spec reviewer**, returning separate Standards and Spec assessments. I did not read or solicit any current R3 peer findings.

Repository paths below are relative to:

`D:\01_DCMvn\Workspace\CrossDefense`

## Standards

**Native verdict: PASS. Normalized verdict: PASS.**

**No Standards findings.**

The reviewed implementation follows the applicable repository requirements:

- Application/Domain ownership remains intact. The browser host admits updates; `BuildApplication` synchronously freezes its editing boundary; the delivery runtime and worker handle browser delivery. No gameplay rule or authoritative save ownership moved into the worker.
- `ContentPackApplication` remains the content validation and activation owner. Immutable identity, active/default and Last Known Good publication remain with the existing content repository. Player Data remains in the existing Workspace repository.
- New repository prose, comments and user-facing text are English.
- The test strategy uses public Application scenarios for the Build boundary and actual production bundles, native workers, IndexedDB and Web Locks for browser integration.
- Existing tracked product tests were not edited or weakened. The new regression configuration explicitly selects tracked product files and does not pull suspended untracked orchestration tests into unrestricted discovery.
- The active plan and records retain development-only authority, Pending acceptance, the earlier failures, and the distinction between completed selective proof and the unexecuted final gate.

These assessments are grounded in `AGENTS.md`, `docs/WORKFLOW.md`, `docs/patterns/encoding-invariants.md`, `docs/architecture/TESTING_STRATEGY.md`, the approved implementation specification and the Ticket12 contract. I did not treat weak naming, formatting or abstraction preferences as repository violations.

### Dependency and delivery configuration review

I independently compared the complete baseline/current lockfile structures in memory.

| Inspection | Result |
|---|---|
| Existing direct dependency versions | Preserved |
| Added direct development dependencies | `vite-plugin-pwa` **2.0.0**; `workbox-build`, `workbox-precaching`, `workbox-routing`, `workbox-window` **7.4.1** |
| Added resolved package locations | **334** |
| Removed resolved package locations | **0** |
| Changed existing resolved version | `node_modules/@types/estree`: **1.0.9 → 1.0.11** |
| New locations without npm registry HTTPS resolution or integrity metadata | **0** |
| New locations marked with an installation script | **0** |

This was a structural dependency review, not a fresh audit execution or a transitive-source security audit. The documented non-clean audit remains disclosed; I do not relabel it as clean or infer user acceptance of that risk.

## Spec

**Native verdict: PASS. Normalized verdict: PASS.**

**No Spec findings.**

### Requirement coverage

| Required behavior | Source and evidence assessed | Assessment |
|---|---|---|
| Complete production offline preparation | `vite.config.ts:14–49`; worker precache setup and `verifyCache()` at `src/sw.ts:94`; actual compiled manifests and current native preparation cases | All six shipped packs are included; readiness depends on checked stored bytes. |
| Separate delivery readiness from usable local content | `src/main.ts:74–83`, bootstrap readiness at `688–690`, and `OfflineStatusView.render()` | Cached delivery alone does not produce the combined Ready offline indication when local content needs attention. |
| Cache failure preserves authoritative Player Data | Worker cache verification/repair; unchanged content and Workspace storage ownership; failed initial preparation, corruption repair and quota cases | No cache operation deletes or replaces Player Data. |
| Complete offline played loop and deterministic agreement | `ticket-12-offline.spec.ts`, `ticket12BrowserScenario.ts`, current native report and decoded diagnostics | Offline creation, earned Pre-Run, Build, Combat, settlement, Salvage, Review and reload completed with matching semantic outcomes. |
| Safe interruption recovery | Existing lifecycle remains authoritative; current offline interruption case and diagnostic | Committed loot survives; recovery occurs once without victory or automatic Review grants. |
| Coherent running App and staged updates | `BrowserOfflineRuntime.activateWaiting()` at line 175; `activateAndObserve()` at line 238; host admission and worker checks | Staging does not automatically reload active play. Explicit activation uses an admitted boundary. |
| Pending operation exclusion | `src/main.ts:80–99`; `BuildApplication.canHoldForAppUpdate()` / `holdForAppUpdate()`; current Build, Settings and Content Retry native cases | Queued/unacknowledged edits and preceding operations prevent activation. |
| Indeterminate activation lifetime | `activateAndObserve()` and three native worker-lifetime cases | The notification deadline does not release the Build/UI hold. Activation or a definitive terminal refusal determines release/reload. |
| Repair an already installed waiting build | `BrowserOfflineRuntime.retry()` at line 141; `src/sw.ts:113`, `repairManifest()`; same-worker native recovery case | Retry repairs the contacted waiting worker’s own manifest without requiring different worker-script bytes. |
| Content Retry cancellation and complete operation ownership | `src/main.ts:227–254`, `331–390`, `475–477`, `530–643`; both new native Content Retry cases | Back cancels later work/publication; admitted operations drain; the current retry remains owned through Build/Review re-entry. |
| Preserve LKG and Run pins | Existing content validation/retention owners; invalid HTTP candidate, unavailable old pin, safe update and offline Continue cases | No silent pack substitution, Run migration or speculative garbage collector was introduced. |
| Required viewport fit | `OfflineStatusView.attach()` at line 39; `offline.css:9–20,25–28`; strengthened native geometry and unchanged Pre-Run/Build regressions | The prior document/bottom-panel overflow is resolved at all three approved viewports. |
| URL entry and optional installation | `manifest: false`; native URL/bootstrap and offline reload proof | No unsupported claim of browser installation UI is made. |

### Compiled precache independently checked

I read the existing `sw.js` precache manifests and recomputed each entry’s SHA-256 against the actual file bytes in:

- `dist`
- `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\build-r3-2-a`
- `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\build-r3-2-b`

Each output contains **nine precache entries**, including **all six immutable pack manifests**. Every one of the **27 inspected entry/hash comparisons matched**.

The two large required files were present in every output:

| Required manifest | Actual bytes |
|---|---:|
| `development-review-ship-v1/manifest.json` | **14,006,953** |
| `development-rendered-combat-ship-v1/manifest.json` | **14,006,431** |

Both fit the explicit **16 MiB** limit. The remaining entries are the other four packs, HTML, JavaScript and CSS. This check establishes the contents and integrity metadata of the existing compiled artifacts; I did not rebuild them during review.

### Safe update and Content Retry trace

The host admits an update synchronously before awaiting the worker: it acquires the Build hold where applicable, sets `applyingUpdate`, and makes the application root inert (`src/main.ts:86–99`). The worker separately verifies the requested build, complete cache and sole in-scope window before changing control.

`activateAndObserve()` retains the pending boundary after its 15-second notification deadline. Missing or unreadable acknowledgment is treated as indeterminate. A native `activating` state takes precedence over a contradictory negative reply. The implementation waits for native activation or a definitive terminal outcome and cleans up its owned observation resources on completion.

Content Retry now has a shared pending owner and increments `entryOperations` before yielding. Its epoch/owner checks prevent a canceled screen from starting later recovery commands or replacing the current screen. The `finally` reconciliation checks shared local readiness before admission can reopen. The current chain explicitly awaits:

`retryContent → renderPilotRun → renderRunProjection → enterBuild → showBuild → Review recovery`

The correction therefore covers more than the shallow content-fetch promise. The current native fixture holds a genuine content or Review transaction completion callback after actual native commit; it does not fabricate successful writes or acknowledgments.

## Prior Code/Spec findings and dispositions

Historical verdicts and classifications remain unchanged in their original reports.

| Historical finding | R3 disposition | Current basis |
|---|---|---|
| **T12-R1-CS-STD-01** — Incorrect broad tile-label count | **Fixed** | `ticket-12-updates.spec.ts:211–227` checks exact `combat-run:starter:0`, empty A3, eight retained tiles, revision 5, one receipt, candidate activation and full native-state equality. The complete case passes in the current 19-case run. |
| **T12-R1-CS-SPEC-01** — Waiting cache has no effective Retry repair | **Fixed** | Retry contacts the waiting worker’s own repair protocol; the native case damages B only, observes refusal, verifies the same waiting worker and unchanged script, repairs, activates B and continues offline with preserved pins/data. |
| **T12-R2-CS-SPEC-01** — Build update status overflows the viewport | **Fixed** | Delivery status is placed alongside the Build title/actions, the layout uses the actual remaining height, and all 15 state/viewport records pass document, panel and selected essential-child bounds. Existing Pre-Run/Build production regressions also pass. |
| **T12-R1-CS-VER-01** — Final integrated gate incomplete | **Still pending as a separate gate** | The current records correctly require a fresh complete ordered gate after the full review round. This is not an additional production defect. |

The update-lifetime and Content Retry corrections associated with the earlier Architecture findings are corroborated by this review’s source/evidence trace. That corroboration is not a replacement verdict for the independent Architecture reviewer.

## Verification independently examined

### Complete current browser reports

I parsed the complete reports, including every test/result entry, rather than relying on their headline totals.

| Existing execution | Cases/files | Duration | Independently observed counters |
|---|---:|---:|---|
| `r2-remediation-full-01` | **19/19**, four files | **192,381.885 ms** | One worker; retries 0; repeat 1; exactly one passed result per case; no skipped, unexpected, flaky, result errors or global errors |
| `r2-layout-regression-02` | **15/15**, two unchanged files | **68,101.844 ms** | Same strict result properties |

Evidence root:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126`

The native report covers all four Ticket12 browser files, including both Content Retry cases. The unchanged regression report covers all selected cases in `ticket-03-ui.spec.ts` and `ticket-04-ui.spec.ts`.

### Current scenario and recovery evidence

The current offline scenario diagnostic reports:

- App **0.1.0**, build **`ticket12-a`**
- Chromium **153.0.8010.12**
- Content **`development-review-ship-v1`**
- Ruleset **`development-combat-ruleset-v1`**
- Content digest **`1b496a087a3c9f576164c83653736dbd40f6d749eeea9adffa5cda3fc127b9b6`**
- Seed **`00000007-0000-4000-8000-000000000004`**
- **21 batches / 198 ordered inputs**
- Victory at tick **3673**
- Matching browser/headless digest:  
  **`c5462479c310b8e1a813f68fba5da1c450bcd53f065e1570bdc76f8282efb7dc`**
- Only **`recordedAt`**, wall-clock metadata, excluded from semantic comparison

The interruption diagnostic records **four committed payloads at tick 15**, one interrupted outcome after repeated recovery, unchanged economy and no Review occurrence.

The current controlled-worker probes return **404** for the absent application path, `/src/main.ts`, `/.env` and `/.git/config`.

The native quota diagnostic records an actual **`QuotaExceededError`** under a temporary Chromium origin quota override while A remains the current build. The test retains the original offline-reload/data-preservation assertions and resets the override in its cleanup.

### Native update lifetime and content ownership

The recorded holds remain inert after:

- **16,515 ms** before native `skipWaiting`
- **16,523 ms** during native activation
- **16,508 ms** before the genuine two-window refusal check

For both activation cases, I independently compared the recorded post-input native state to the acknowledged pre-hold state: Undo and Map/Start inputs leave it unchanged. Release subsequently reaches build B and a new chooser document. The refusal case preserves the A document, releases inertness and completes a valid Undo with the expected additional receipt.

For canceled Content Retry:

- The original content completion event is trusted.
- Exactly one content publication is recorded.
- No later Review write occurs.
- The canceled/drained Player Data equals the held-before-drain Player Data.

For current Content Retry:

- One genuine `ensure-review` operation, link and occurrence is committed while acknowledgment is held.
- No Review reward is granted.
- The relevant Run, economy, settlement and Review tables remain equal after B activation and offline Continue.

### Viewport evidence

I inspected all five Build state geometry files, each containing the three approved viewports: staged and held before `skipWaiting`, staged and held during activation, and restored refusal.

All **15 captures** report:

- Document dimensions equal to the configured viewport.
- All five panels within the viewport.
- No clipping failures among the **11 asserted essential elements**.
- Existing **23 px** grid lettering.

| Viewport | Document | Bottom Cargo/Equipped/Words boundary |
|---|---|---:|
| **1280 × 720** | **1280 × 720** | **704 px** |
| **1366 × 768** | **1366 × 768** | **752 px** |
| **1920 × 1080** | **1920 × 1080** | **1064 px** |

I also inspected the current Combat geometry records: the complete nine-entry Harvest and footer remain within their panels, the receipt remains 15 px high, and the camera/well bottoms align.

I visually inspected the existing **1280 × 720 held-update Build** PNG and the corrected **minimum Pre-Run** PNG. The Pre-Run regression configuration intentionally blocks service workers to preserve its original response-fault seam; its screenshot establishes layout, not native offline preparation. Native offline proof comes from the separate Ticket12 suite.

## Frozen identity and scope

I independently reproduced both frozen aggregates twice:

- Initial verification: **2026-11-26T11:55:06.9137410Z**
- Final verification: **2026-11-26T12:00:46.7903748Z**

| Identity | Verified value |
|---|---|
| Branch | `feature/ticket12-offline-recovery` |
| Original baseline/current HEAD | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Commits beyond baseline | None |
| Staged changes | **0** |
| Tracked changed files | **8** |
| Total untracked paths | **530**, including **28** assigned Ticket12 additions and the **502** preserved unrelated paths |
| Frozen scope | **36 paths** |
| Executable/configuration subset | **23 paths** |

Full aggregate:

`7fd10923c8a1b683533fe39382f96446ac348fcaa44cf1f3461e0d5f6c88cb7e`

Executable aggregate:

`636ccebc32d53478d7375e1c9b630d87a8ebcb1d5f927c128e69da5248b89f4e`

The supplied PowerShell `Sort-Object` culture ordering and path + NUL + lowercase raw-byte SHA-256 + LF convention were used, with a UTF-8 outer hash. Computation remained in memory.

The comparison was the complete scoped uncommitted implementation against the original baseline, including the assigned new files. The empty committed range was not mistaken for an empty implementation.

### Inspected material

- All **23 executable/configuration/test paths**, including the complete new delivery runtime, worker, UI, host integration, Build boundary, both Playwright configurations, owned server, all four browser suites, headless boundary test and helpers.
- The seven current authority, deployment/breakdown, contract, plan, verification and tri-axis record files.
- Both prior Code/Spec raw reports for historical finding dispositions.
- Relevant existing content, Settings, Workspace lock and presentation collaborators and approved implementation/UX/testing authorities.
- Complete current native and affected legacy reports; decoded behavioral/geometry evidence; selected actual PNGs; existing compiled precache bytes.

All 36 frozen paths were hash-covered. Archived peer reports were preserved within that identity; they were not used as substitute evidence for this reviewer’s current verdict.

## Execution limits and residual risks

- I launched **no browser, test, build, typecheck, audit, installation, server or deployment dry-run**. Executable results above are independently inspected recorded executions.
- The earlier **336/336 headless** result and current typecheck/build success remain coordinator/verification-record evidence; their complete command logs were not independently audited in this review.
- The fresh ordered gate remains pending: typecheck, intended headless selection, complete development browser regressions, production build, deployment dry-run, complete selected production regressions, fresh A/B builds and the native Ticket12 suite.
- Current Chromium proof does not establish cross-browser certification, target-hardware performance, arbitrary future content scale, or every possible inventory/viewport combination. Bounded Build-region scrolling remains permitted by the accepted presentation contract.
- A permanently lost activation acknowledgment without a terminal native observation deliberately retains the hold. The code does not guess that the operation was canceled.
- Browser quota and eviction remain external storage limitations. Conservative retention avoids content loss but does not claim unlimited storage.
- The disclosed dependency audit remains non-clean and retains its bounded follow-up.
- No source or documentation writes, source copies/snapshots/exports, on-disk inventories, Git mutations, provider operations or Player Data changes were performed.

## Verdicts

| Area | Native result | Normalized result | Findings |
|---|---|---|---:|
| **Standards** | **PASS** | **PASS** | **0** |
| **Spec** | **PASS** | **PASS** | **0** |
| **Final integrated verification** | **INCOMPLETE / Pending** | **INCOMPLETE / Pending** | Existing separate gate remains open |
| **User acceptance** | **Pending** | **Pending** | No acceptance or publication authority inferred |

The supported prior Code/Spec corrections are resolved in the frozen R3 implementation and examined evidence. The next required step is the separately ordered complete executable gate after the coordinator has received and synthesized every R3 axis report.
