# T12-R2 — Fresh Full Architecture Review

**Native Architecture verdict: FAIL.**  
**Normalized Architecture verdict: FAIL.**

The original **ARCH-T12-001** timeout/lifetime blocker is **Fixed and Verified** in the examined R2 result. This fresh review found one additional blocker, **ARCH-T12-002**: an outstanding content-recovery continuation can escape the host’s update-admission accounting and resume application work after an update has been admitted.

This review covers the complete Ticket12 change relative to the original baseline. It is not limited to the R1 corrections. Integrated verification and user acceptance remain separate and Pending.

## Review identity and method

| Field | Examined identity |
| --- | --- |
| Round | T12-R2, fresh final full Architecture review |
| Checkout | `D:\01_DCMvn\Workspace\CrossDefense` on DESKTOP-DBD6QJO |
| Original baseline | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Current HEAD | Independently observed as the same commit |
| Branch | Independently observed as `feature/ticket12-offline-recovery` |
| Frozen scope | 31 paths supplied by the orchestrator |
| Aggregate | `765addf4c46bf9f982b1c1ac7ceef305e602a6a510790efbeb08f3655b8b8e6f` |
| Independent aggregate check | Exact match at `2026-11-26T11:26:02.0365927Z` |

The aggregate was recomputed entirely in memory using the specified PowerShell `Sort-Object` culture ordering, relative path, NUL, lowercase raw-file SHA-256, LF, and UTF-8 outer hash. No inventory or source snapshot was written.

I used the `codebase-design` guidance and the repository’s accepted architecture, lifecycle, and invariant rules. All activity was read-only: source and diff inspection, existing-report parsing, and in-memory identity checks. I did not execute tests, builds, audits, browser operations, or publication actions. I did not read or solicit current R2 peer reports.

## New finding

### ARCH-T12-002 — Content Retry can outlive navigation and bypass safe-update admission

| Field | Assessment |
| --- | --- |
| Axis | Architecture |
| Native strength | **Strong** |
| Gate | **BLOCKER** |
| Confidence | **HIGH** for the source-level omission and continuation path; the adverse browser interleaving has not been reproduced in this review |
| Disposition | **OPEN** |
| Primary owner | Host lifecycle/admission coordination in `src/main.ts` |
| Affected collaborators | `renderPilotRun`, `enterBuild`, `showBuild`, `ReviewApplication.recover` |
| Introduced consequence | Ticket12 can admit an update while an earlier content/re-entry operation remains capable of starting application work |

#### Accepted rule

The current offline contract requires an entry point to be reached after bootstrap/recovery completes, and a Build point to be reached after Review preparation and preceding operations acknowledge. Pending Pilot/Run operations exclude activation. Admission must freeze the application before requesting the asynchronous worker transition. These requirements appear at `docs/product/TICKET12_OFFLINE_CONTRACT.md:39`, `:40`, `:42`, and `:43`.

The issue concerns that admitted application boundary. It is separate from the repaired lifetime of the worker request.

#### Direct source evidence

1. **Content recovery leaves navigation available.** The Content Required screen presents both Retry content and Back to Pilots. Its Retry handler simply awaits `retryContent(pilot)`; it does not disable Back, register pending work, or capture a navigation epoch. See `src/main.ts:485`, `:486`, and `:489`.

2. **Back can publish a safe entry screen while Retry is still running.** `bindBackToPilots()` awaits `application.getPilotChooser()` and calls `renderChooser()`. The latter sets `updateBoundary = 'entry'`. See `src/main.ts:559`, `:561`, and `:181`.

3. **The update guard does not account for Content Retry.** `canApplyUpdate()` relies on `entryOperations`, pending Start requests, Settings, dialogs, and the current entry/Build marker. Content Retry never increments `entryOperations`. See `src/main.ts:79` and `retryContent` at `:530`.

4. **The recovery continuation can enable admission before its re-entry completes.** After restoring/activating content, `retryContent()` sets `localContentReady` to true and then awaits `renderPilotRun(pilot)`. That function performs further asynchronous repository/content reads. The prior chooser can therefore remain the displayed entry point while this continuation is still outstanding. See `src/main.ts:551`, `:552`, and `:553`.

5. **The old continuation is neither canceled nor rejected after update admission.** `retryContent()` does not compare `screenEpoch`; `renderPilotRun()` does not check `applyingUpdate`. Its Build route calls `enterBuild()`, which establishes a fresh loading epoch. The stale operation can thus become the owner of a new screen instead of being discarded.

6. **Build re-entry can perform a durable write.** `showBuild()` calls `review.recover()` before publishing Build. `ReviewApplication.recoverSaved()` explicitly handles settled outcomes that have no Review link, constructs `ensure-review`, and awaits persistence. See `src/main.ts:358`, `:359`, and `src/application/review/ReviewApplication.ts:69`, `:78`, `:81`. `persist()` invokes `repository.ensureReview()`.

7. **An admitted entry update does not hold that future Build object or future Review operation.** `applyAppUpdate()` takes a Build hold only when the boundary is currently Build, then makes the root inert and waits for the worker. Inert prevents new user input; it does not stop asynchronous work already in flight. The worker’s valid cache/window checks do not inspect application operations. See `src/main.ts:85` and `src/sw.ts:188`.

#### Reachable schedule

The following schedule is inferred from those inspected asynchronous paths. It is not claimed as a native reproduction:

1. A saved current Review-capable Run needs content recovery. A settled but unlinked result is a legitimate recovery state explicitly handled by `ReviewApplication.recoverSaved()`.
2. The player starts Retry content, then uses the still-available Back to Pilots action while the retry is awaiting storage, network, or validation.
3. The chooser becomes the current entry screen. `entryOperations` remains zero.
4. Retry restores the content and sets `localContentReady = true`, then waits inside `renderPilotRun()`. The chooser’s update action can now pass `canApplyUpdate()`, even though the earlier recovery/re-entry operation is unresolved.
5. The player applies staged build B. The entry screen is made inert and the real activation request begins.
6. The outstanding Retry continuation completes its reads, enters Build, and can start Review recovery. Neither `page()` nor the re-entry path prevents this work during `applyingUpdate`.
7. Worker activation can complete and cause reload while that preceding operation is writing or awaiting acknowledgment.

The problematic precondition is not limited to future content: the shipped current Review pack and its explicit settled-result recovery path provide the necessary collaborators. Missing content can be restored through the existing current-pack Retry path.

This finding does **not** assert observed data loss or duplicated rewards. The existing transactional and idempotent repositories may preserve their own data invariants. The established failure is that the host does not maintain its accepted “recovery completed / preceding operations acknowledged” admission rule.

#### Architectural rationale

The host treats the current screen marker as sufficient evidence that relevant work has quiesced, while `retryContent()` owns a continuation that can survive that screen’s replacement and initiate further application operations.

This leaves the lifetime of one operation outside the owner of the update-admission decision. The worker lifetime correction cannot close this gap: it keeps an already-admitted transition pending correctly, but cannot establish that admission itself occurred without outstanding application work.

#### Expected correction

Keep content recovery and its re-entry continuation represented in the host’s pending-work/admission state until it either finishes safely or is explicitly canceled before it can initiate further application work. A navigation epoch should prevent stale continuations from taking over a newer screen where appropriate. Do not rely on inert UI alone to cancel work already running.

The correction should remain local to the existing host/admission owner; no generic command framework or broad routing redesign is required by this finding.

#### Required proof

Add a targeted browser case that:

- Uses the real production app and native A/B workers.
- Starts a controlled, delayed content Retry, then navigates back to the chooser through the normal UI.
- Establishes a legitimate recovery state capable of pending Review preparation, rather than substituting an unrelated fabricated mutation.
- Proves that staged activation remains unavailable while the original recovery/re-entry work can still perform or await a write.
- Releases and acknowledges that work, then demonstrates a safe explicit update with unchanged native Player Data and pins.
- Checks that stale navigation/recovery continuations cannot replace the admitted screen or start a new operation after admission.

The current 17-case suite tests content recovery and update admission individually. Its inspected source does not exercise this overlapping Retry → Back → update schedule.

## Prior finding disposition

### ARCH-T12-001 — Indeterminate activation lifetime

**Disposition: Fixed and Verified for the examined R2 source and current native evidence.**

| Field | Preserved assessment |
| --- | --- |
| Original classification | **Strong / BLOCKER / HIGH** source-trace confidence |
| Original issue | A communication/activation timeout released the Build/UI hold while native activation could still complete |
| R2 disposition | **Fixed and Verified** |
| Historical classification | Preserved; the successful correction does not regrade the original finding |

The revised `activateAndObserve()` keeps the activation promise unresolved across the 15-second notification deadline. A positive acknowledgment still waits for native `activated`; unreadable/missing acknowledgments remain indeterminate; native `activating` takes precedence over a contradictory negative reply. Terminal resolution removes the state listener, closes the owned ports, and clears the timer. See `src/infrastructure/offline/BrowserOfflineRuntime.ts:238`, `:242`, `:251`, `:255`, and `:263`.

The host therefore retains its existing admitted hold until successful activation and reload, or a terminal negative outcome. The uncertainty stays behind the browser runtime’s interface rather than being reconstructed by `main.ts`.

I directly inspected the decoded current evidence in:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r1-remediation-full-01`

| Native scenario | Independently observed evidence |
| --- | --- |
| Before original `skipWaiting` | At **16,522 ms**, B remained installed, the original native call count was zero, the A document remained on Build, and `inert` remained true. Real Undo/Map input preserved the acknowledged native save. Release led to one native call and a new B chooser document. |
| During native activation | At **16,513 ms**, the active/controller worker was genuinely `activating`, the A Build remained inert, and real input preserved the native save. Release led to an activated B chooser with a new document time origin. |
| Delayed genuine refusal | At **16,509 ms**, the real window check had not run and the A Build remained inert. After release, the actual two-window refusal appeared; the same document and Build were restored. Undo then increased receipts from one to two and revision from five to six. |

For both activation cases, I compared the decoded post-input native save against the acknowledged save in memory; the serialized snapshots matched. The corresponding tests additionally assert post-reload save equality and actual worker identity.

The intentionally conservative case—an acknowledgment permanently lost while the worker remains installed with no terminal observation—continues to hold interaction. That disclosed availability limitation is not silently treated as cancellation.

## Full-scope architecture assessment

The remaining examined architecture supports the intended bounded slice:

- **Delivery has a useful, concentrated interface.** Registration, observation, cache checking, repair, staging, and native transition observation sit behind `BrowserOfflineRuntime`. Individual gameplay views do not coordinate service-worker ports or native states.

- **Build mutation remains with its existing owner.** `BuildApplication.holdForAppUpdate()` synchronously excludes queued, pending, opening, and Attempt-start work. Its tokenized release prevents an obsolete callback from releasing a later hold. Existing command methods reject while the hold is active. The four new public-seam tests target these behavioral properties.

- **Content identity and activation retain one owner.** `ContentPackApplication` validates content and resolves immutable identities. `LocalStorageContentPackRepository` retains the active/default, LKG, and digest registry; `RenderPackBodyStore` remains a separate replaceable body store. The worker does not introduce another content-activation registry.

- **Player Data remains separate from replaceable delivery.** The new worker/runtime has no authoritative Workspace mutation path. Cache preparation, corruption repair, quota failure, and conservative retention operate on delivery resources.

- **Waiting-cache repair is local to the correct worker.** Retry contacts the installed waiting worker, which enumerates its own immutable manifest. Candidate identity and readiness are separate status fields, so an incomplete waiting candidate exposes Retry and cannot be applied. This addresses the recovery locality problem without routing B’s repair through A’s page fetch behavior.

- **App coherence is supported by per-build caches and explicit reload.** No unconditional `skipWaiting`, unconditional `clients.claim`, or play-time automatic reload is introduced. The retained-resource fallback is limited to exact older hashed JS/CSS resources; it does not supply navigation or arbitrary missing-path fallback.

- **The deterministic core remains unchanged.** The browser scenario replays acknowledged startup and ordered input through the public `CombatApplication` seam. The only semantic outcome exclusion in that comparison is documented wall-clock `recordedAt`.

- **The test infrastructure remains outside the shipped application.** The owned server serves compiled output on loopback, uses bounded authenticated controls, rejects occupied-port reuse through the Playwright configuration, and returns real missing-path responses. The native suite permits real workers. Legacy regression fixtures keep their existing HTTP seam with workers blocked; their results must not be represented as native-worker proof.

These observations do not supersede ARCH-T12-002.

## Examined and unexamined scope

### Frozen product, delivery, and test paths

I examined the complete current implementations and relevant original-baseline differences for:

- `src/main.ts`
- `src/application/build/BuildApplication.ts`
- `src/sw.ts`
- `src/infrastructure/offline/protocol.ts`
- `src/infrastructure/offline/BrowserOfflineRuntime.ts`
- `src/presentation/OfflineStatusView.ts`
- `src/presentation/offline.css`
- `vite.config.ts`
- `package.json`
- `playwright.ticket12.config.ts`
- `playwright.ticket12-regression.config.ts`
- `scripts/testing/ticket12-production-server.mjs`
- `tests/headless/ticket12-update-boundary.test.ts`
- `tests/e2e/ticket-12-offline.spec.ts`
- `tests/e2e/ticket-12-updates.spec.ts`
- `tests/e2e/ticket-12-update-lifetime.spec.ts`
- `tests/ticket12BrowserScenario.ts`
- `tests/ticket12ServerControl.ts`
- `tests/ticket12UpdateFixture.ts`
- `tests/ticket12WorkerLifetimeFixture.ts`

For `package-lock.json`, examination covered the baseline/current root declarations and resolved dependency shape. All existing direct pins remained unchanged. The only version change at an existing package location was `@types/estree` from `1.0.9` to `1.0.11`; there were 334 new locations and none removed. I did not inspect every transitive package implementation or conduct an audit.

### Frozen documentation and historical records

Examined:

- `AGENTS.md`
- Changed hunks and relevant authority/deployment sections of `docs/deployment/CLOUDFLARE_WORKERS.md`
- Changed hunks and relevant approved ticket sections of `docs/product/IMPLEMENTATION_BREAKDOWN.md`
- `docs/plans/active/ticket12-offline-recovery.md`
- `docs/product/TICKET12_OFFLINE_CONTRACT.md`
- `docs/product/TICKET12_DEVELOPMENT_VERIFICATION.md`
- `docs/product/TICKET12_CHATGPT_TRI_AXIS_REVIEW.md`
- `docs/reviews/ticket12/T12-R1-architecture.md`

The frozen historical `T12-R1-code-spec.md` and `T12-R1-security.md` files were included in the independent aggregate check, but their raw contents were not reviewed. The already-published R1 synthesis in the tri-axis record was read. No current R2 peer report was read.

### Necessary unchanged collaborators and authority

Directly traced:

- `ContentPackApplication`
- `LocalStorageContentPackRepository`
- `RenderPackBodyStore`
- `WorkspaceApplication`
- `SettingsApplication`
- `WorkspaceWriteLock`
- `RunApplication`
- `AttemptApplication`
- `ReviewApplication`
- `BuildView`
- `SettingsView`

Governing material included `docs/WORKFLOW.md`, `CONTEXT.md`, the invariant-encoding pattern, approved implementation specification, UX state matrix, Technical Architecture, Platform Architecture, Testing Strategy, accepted technology-selection material, and ADR 0009.

The full unchanged persistence/domain implementations, unrelated historical debt, and 502 unrelated original untracked paths were outside this bounded review.

## Existing execution evidence and limits

I independently parsed the current combined `browser-results.json`:

- **17 expected tests, each with one passed result**
- **Zero skipped, unexpected, flaky, or global errors**
- **One worker**
- Every recorded result had retry zero
- Reported duration: **182.940 seconds**

I also directly read the lifetime, waiting-cache refusal, quota, and offline scenario diagnostic records. The offline scenario identifies build `ticket12-a`, Chromium `153.0.8010.12`, 21 input batches, 198 ordered inputs, victory at tick 3673, and matching browser/headless digest:

`728e3411b552c50db8004712b999980be74b67104b6ec09fca207e5b4b28f507`

Those are inspected existing results, not executions performed by this reviewer. Build provenance tying the supplied compiled A/B variants to the current source was supplied by the orchestrator; I did not rebuild them.

The new ARCH-T12-002 interleaving is established by source tracing and requires the targeted executable proof described above. The existing successful cases do not cover it. No data-loss claim is made.

The separate final ordered gate—typecheck, complete intended headless selection, 217 development browser cases, build, deployment dry-run, 130 production regression cases, and the native-worker selection—remains Pending. The disclosed non-clean dependency audit also remains separate; this review neither re-audited it nor inferred risk acceptance.

**Architecture closeout is blocked by ARCH-T12-002. ARCH-T12-001 remains independently closed as Fixed and Verified.**