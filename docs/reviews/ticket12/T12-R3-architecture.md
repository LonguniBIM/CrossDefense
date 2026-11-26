# T12-R3 — Fresh Full Architecture Review

**Native Architecture verdict: PASS.**  
**Normalized Architecture verdict: PASS.**

No remaining architecture blocker was found in the complete Ticket12 change against the original fixed point. **ARCH-T12-001 and ARCH-T12-002 are Fixed and Verified for the examined R3 source and existing native evidence.** Their original Strong / BLOCKER classifications remain preserved.

This is an Architecture-axis result. The separate final ordered executable gate remains **Pending**. Ticket12 user acceptance and publication authorization also remain Pending.

## 1. Review identity and method

| Field | Independently examined state |
| --- | --- |
| Round | T12-R3, fresh full Architecture review |
| Checkout | `D:\01_DCMvn\Workspace\CrossDefense` on DESKTOP-DBD6QJO |
| Original fixed point | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Current HEAD | Same commit |
| Branch | `feature/ticket12-offline-recovery` |
| Frozen scope | 36 paths |
| Full aggregate | `7fd10923c8a1b683533fe39382f96446ac348fcaa44cf1f3461e0d5f6c88cb7e` |
| Executable/configuration scope | 23 paths |
| Executable aggregate | `636ccebc32d53478d7375e1c9b630d87a8ebcb1d5f927c128e69da5248b89f4e` |
| Latest independent identity verification | `2026-11-26T12:00:26.2865843Z` |
| Index | Empty |
| Untracked paths | 530: the supplied 502 unrelated paths plus 28 in-scope additions |

Both aggregates were independently reproduced twice using the supplied PowerShell culture-order sorting and raw-file hashing convention. All computation remained in memory.

I applied the three-axis review contract and `codebase-design` vocabulary to the changed architecture and directly affected collaborators. The review covered the entire current Ticket12 implementation relative to the original baseline, including earlier fixes.

All repository access used Remote Desktop Commander on the authorized device. No source, report, inventory, snapshot, or other artifact was written. No tests, builds, servers, audits, browser sessions, publication actions, or Cloudflare changes were started. No current R3 peer report was read or solicited.

## 2. Findings and dispositions

### New R3 findings

**None.** No additional Strong architecture defect or other architecture finding requiring remediation was established within the reviewed scope.

### Previous Architecture findings

| Finding | Original native classification | Original gate | Confidence | R3 disposition |
| --- | --- | --- | --- | --- |
| **ARCH-T12-001 — An indeterminate worker transition releases the safe update boundary** | Strong | BLOCKER | HIGH source-trace confidence, subsequently supported by native reproduction | **FIXED — independently verified in current source and existing native evidence** |
| **ARCH-T12-002 — Content Retry can outlive navigation and bypass safe-update admission** | Strong | BLOCKER | HIGH source-trace confidence, subsequently supported by native reproduction | **FIXED — independently verified in current source and existing native evidence** |

Successful correction does not regrade either original finding.

### ARCH-T12-001: the admitted boundary now lasts through the native transition

The runtime now keeps transition uncertainty behind its own interface:

- `activateAndObserve()` owns the outstanding native activation and does not resolve on the 15-second notification deadline. That deadline only changes status text.
- A positive acknowledgment still waits for the worker’s native `activated` state.
- A missing or unreadable acknowledgment remains indeterminate.
- Native `activating` takes precedence over a contradictory negative reply.
- A terminal outcome removes the listener, clears the timer, closes the owned message ports, and resolves the operation.

These properties are directly visible at `src/infrastructure/offline/BrowserOfflineRuntime.ts:238`, `:242`, `:252`, `:255`, `:258`, `:265`, and `:268`.

Consequently, `applyAppUpdate()` retains the same Build hold and inert application root until the awaited operation either permits reload or establishes refusal. The host does not reconstruct worker uncertainty from a message timeout. See `src/main.ts:86` and the runtime call at `src/infrastructure/offline/BrowserOfflineRuntime.ts:191`.

I independently parsed the current native records in:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r2-remediation-full-01`

| Existing native scenario | Independently observed current evidence |
| --- | --- |
| Before original `skipWaiting` | At **16,515 ms**, the original native call count remained zero, B remained installed, and the A Build remained inert in the same document. |
| During native activation | At **16,523 ms**, the actual active/controller worker was `activating`, while the A Build remained inert in the same document. |
| Genuine delayed refusal | At **16,508 ms**, the window check had not run and Build remained inert. Releasing the real check produced the two-window refusal and restored the same A document and Build. |

For both successful activation cases, I compared the decoded native save after Undo and Map/Start input against the acknowledged save. Both comparisons matched. Release led to an activated B worker and a new B chooser document.

The refusal record retained the original document time origin. After refusal, Undo remained usable and increased the Build operation count from one to two, supporting preservation of the acknowledged editing history.

The relevant artifacts include `lifetime-held-before-skip-waiting.json`, `lifetime-inputs-before-skip-waiting.json`, `lifetime-held-during-activation.json`, `lifetime-inputs-during-activation.json`, `lifetime-refusal-pending.json`, and `lifetime-refusal-restored-history.json`.

This satisfies the accepted lifetime requirement in `docs/product/TICKET12_OFFLINE_CONTRACT.md:43`.

### ARCH-T12-002: content recovery now remains owned through quiescence

The correction addresses both pending-work accounting and stale continuation ownership.

**One pending owner.** `retryContent()` rejects duplicate intents, increments `entryOperations` before asynchronous work, and decrements it only in the outer `finally`. The same shared flag disables replacement Retry buttons. See `src/main.ts:530`, `:537`, `:540`, and `:592`.

**Synchronous navigation invalidation.** Back to Pilots calls `renderLoading()` before awaiting the chooser. This advances the screen epoch before the old continuation can resume. See `src/main.ts:599` and `:602`, with epoch advancement in `page()` at `:102`.

**Cancellation before subsequent commands.** The retry captures its content owner and screen epoch. It checks currency after asynchronous reads/fetches and before subsequent restoration or activation work. `refreshDevelopmentCandidate()` also captures its owner and checks currency before `activateCandidate()`. See `src/main.ts:543`, `:550`, `:553`, `:559`, `:562`, `:564`, `:614`, `:634`, and `:635`.

**Already-started work drains.** Navigation does not pretend to cancel an admitted persistence operation. The inner `finally` reconciles shared local readiness through the captured owner even when the original screen has been replaced. Update admission stays excluded while this reconciliation awaits completion. See `src/main.ts:579`, `:581`, `:582`, and `:583`.

**The full re-entry chain is awaited.** The current path awaits `renderPilotRun → renderRunProjection → enterBuild → showBuild → ReviewApplication.recover`. Build is marked as an update boundary only after Review preparation and the remaining reads finish. See `src/main.ts:251`, `:353`, `:363`, `:389`, and `:475`.

These changes remain local to the existing host’s lifecycle/admission responsibility. They add no generic routing, cancellation, or command framework.

I independently examined the preserved `r2-content-retry-red-01` report and native attachments. Its failed case recorded:

- A trusted content completion held after Back.
- A premature Apply affordance, established by the failed assertion.
- After release, **two** content body writes and a real `ensure-review` operation.
- One Review operation, link, and occurrence, with no Review reward.
- Four assertion failures in the case.

That reproduction establishes the stale continuation defect; it does not establish data loss or an activation during the overlap.

The current combined native run records the corrected behavior:

| Case | Current evidence |
| --- | --- |
| Retry followed by Back | One content write; the original trusted acknowledgment is drained; zero later Review writes; no second content publication. |
| Current Retry without navigation | One genuine `ensure-review` operation/link/occurrence; native completion is held before acknowledgment; Build/update admission remains excluded. |
| After safe completion | Genuine B activation and offline continuation preserve the asserted native state and immutable Run pins. |

The first case’s passing test explicitly checks disabled Apply while content acknowledgment is held, unchanged chooser after drain, and full saved-state equality through B activation. The second checks that Build is not published before the genuine Review acknowledgment. See `tests/e2e/ticket-12-content-retry.spec.ts:40`, `:79`, `:80`, `:97`, `:107`, `:114`, and `:135`.

The fixture calls the original native `put`/`add`, captures the original trusted completion event, and later delivers that event to the installed callback. It does not fabricate a successful application command or a native commit. Cleanup restores the wrapped methods and verifies that no held callback remains. See `tests/ticket12ContentRetryFixture.ts:66`, `:74`, `:85`, `:95`, `:103`, and `:121`.

This satisfies the recovery/admission ownership requirement in `docs/product/TICKET12_OFFLINE_CONTRACT.md:39`, `:40`, and `:42`.

## 3. Full-scope architecture assessment

### Delivery has useful module depth

`BrowserOfflineRuntime` concentrates registration, worker observation, cache inspection, repair, staging, and activation observation behind a small interface. Gameplay views do not handle native worker ports or reconstruct transition states.

The host retains the distinct responsibility it actually owns: deciding whether the current application state is a safe entry/Build boundary. The worker separately validates its own identity, cache, and window conditions. This is an appropriate division of ownership rather than two competing owners of the same state.

The new status view consumes runtime status and host callbacks. Its 400 ms refresh is an affordance update; the actual admission decision is checked synchronously when Apply is requested. See `src/presentation/OfflineStatusView.ts:31` and `src/main.ts:80`.

### Build mutation remains with the existing Application owner

`BuildApplication.holdForAppUpdate()` synchronously excludes pending, queued, opening, and Attempt-start work. Its tokenized release prevents an obsolete callback from releasing a later hold.

New edits and Attempt admission reject while that hold exists. The queued count is incremented before the promise-chain work starts, covering same-turn admission races. See `src/application/build/BuildApplication.ts:90`, `:101`, `:106`, `:110`, `:114`, and `:117`.

The four new headless tests exercise the public Application seam: hold/refusal, same-turn queued edits, lost acknowledgment followed by exact retry, and obsolete release callbacks. They do not mirror private implementation functions.

### Content identity, activation, and retention retain their owners

`ContentPackApplication` still validates compatibility and integrity before activation or restoration. `LocalStorageContentPackRepository` remains the sole active/default, Last Known Good, and digest registry. Render bodies remain in their separate replaceable database.

The worker has not acquired a second content activation registry or a Player Data mutation path. Run projections continue to resolve the Run’s exact pinned content and return Content Required when that content is unavailable. See `ContentPackApplication.activateCandidate/getPack/restorePinned`, `LocalStorageContentPackRepository.publish`, `RenderPackBodyStore.stage`, and `RunApplication.projectRun`.

The conservative retention policy is explicit: each App build gets its own cache, all six shipped pack manifests are required build inputs, and no content garbage collector or save migration is introduced. The older-resource route is limited to exact hashed JS/CSS paths and verifies the retained response bytes. See `vite.config.ts:14`, `src/sw.ts:13`, `:34`, and the contract at `docs/product/TICKET12_OFFLINE_CONTRACT.md:29` and `:33`.

### Repair is owned by the correct worker

Retry contacts the active or installed waiting worker as appropriate. The contacted worker enumerates its own immutable manifest and repair keys; the caller supplies no arbitrary URL.

Candidate identity and candidate readiness remain separate, so an incomplete staged build can expose Retry without becoming admissible. See `BrowserOfflineRuntime.retry`, `src/sw.ts:107`, `:113`, and `:127`.

The current waiting-cache evidence identifies B’s damaged cache, preserves ready A, and records refusal for the missing legacy manifest. The passing case then verifies repair of the same waiting worker with unchanged script bytes before safe activation. This supports the repair seam’s locality.

### Player Data and deterministic behavior remain separate from delivery

No new production change modifies Domain rules or the authoritative Dexie schema. Cache operations remain confined to replaceable delivery resources.

Workspace ownership still uses the existing exclusive Web Lock before writable bootstrap. Attempt recovery continues through its existing idempotent Application path before the chooser becomes available. See `WorkspaceWriteLock.acquire`, `AttemptApplication.recoverAtStartup`, and `src/main.ts:697`.

The browser/headless parity helper replays acknowledged startup and ordered input through the public `CombatApplication` seam. It excludes only `recordedAt` wall-clock metadata from the semantic outcome comparison. This preserves the accepted testing architecture.

### Native testing and deployment boundaries remain bounded

The dedicated server serves compiled output on loopback, rejects out-of-root paths, supplies real 404 responses, and exposes bounded token-protected controls. Its controls are outside the production bundle.

The native Ticket12 configuration allows actual service workers and rejects reuse of an occupied test server. Legacy regressions keep service workers blocked because their existing response-fault fixtures depend on the HTTP seam; their results are not presented as native-worker evidence.

The source introduces neither mandatory installation nor an install manifest. URL entry remains supported. Existing root-relative deployment and static-host configuration remain consistent; no provider change is required by this review.

## 4. Examined scope and exclusions

### Executable and configuration scope

Examined all 23 frozen executable/configuration paths:

- `package.json`, `package-lock.json`, `vite.config.ts`
- `src/main.ts`
- `src/application/build/BuildApplication.ts`
- `src/sw.ts`
- `src/infrastructure/offline/protocol.ts`
- `src/infrastructure/offline/BrowserOfflineRuntime.ts`
- `src/presentation/OfflineStatusView.ts`
- `src/presentation/offline.css`
- `playwright.ticket12.config.ts`
- `playwright.ticket12-regression.config.ts`
- `scripts/testing/ticket12-production-server.mjs`
- `tests/headless/ticket12-update-boundary.test.ts`
- The four `tests/e2e/ticket-12-*.spec.ts` files
- `tests/ticket12BrowserScenario.ts`
- `tests/ticket12ServerControl.ts`
- `tests/ticket12UpdateFixture.ts`
- `tests/ticket12WorkerLifetimeFixture.ts`
- `tests/ticket12ContentRetryFixture.ts`

Lockfile inspection covered root declarations and resolved dependency shape. Existing direct pins remain unchanged; there are 334 added package locations, none removed, and one changed existing package version, `@types/estree` from `1.0.9` to `1.0.11`. I did not inspect every transitive dependency implementation or run an audit.

### Documentation and collaborators

Examined the current AGENTS authority, workflow, glossary, invariant pattern, Ticket12 contract/plan/verification/review record, relevant deployment and ticket changes, approved implementation specification, UX state matrix, technical/platform/testing architecture, ADR 0009, and both prior Architecture reports.

Necessary unchanged collaborators were traced, including Content application/storage, Workspace/Run/Attempt/Review/Settings applications, the Workspace write lock, Settings view, and relevant Build view input paths. Installed Workbox lifecycle implementation was checked where needed to confirm that its install/activate methods own the event lifetime.

The four frozen historical Code/Spec and Security reports were included in aggregate verification but their raw contents were not reviewed. Historical synthesis in the task records was read. No current R3 peer report was examined.

The full unchanged Domain/persistence implementation, unrelated historical debt, and 502 unrelated untracked paths remain outside this bounded review.

## 5. Existing execution evidence and limits

I independently parsed the existing reports; these were **not executions performed by this reviewer**.

| Existing report | Independently observed result |
| --- | --- |
| `r2-remediation-full-01/browser-results.json` | 19 expected tests in four files, exactly one passed result per test, one worker, retry zero, repeat one, zero skipped/unexpected/flaky/global errors; **192.382 seconds** |
| `r2-layout-regression-02/browser-results.json` | 15 expected existing production UI tests, exactly one passed result per test, one worker, retry zero, repeat one, zero skipped/unexpected/flaky/global errors; **68.102 seconds** |
| `r2-content-retry-red-01/browser-results.json` | Preserved meaningful baseline: one failed case with four errors and one passed case; no retries, skips, flaky results, or global errors |

The current offline scenario diagnostic records Chromium `153.0.8010.12`, build `ticket12-a`, 21 input batches, 198 ordered inputs, and victory at tick 3673. Browser and headless digests both equal:

`c5462479c310b8e1a813f68fba5da1c450bcd53f065e1570bdc76f8282efb7dc`

The current interruption diagnostic records four committed payloads at tick 15, one interrupted outcome across repeated recovery, unchanged economy, and no Review occurrence.

I also inspected the native lifetime, content retry, waiting-cache, and Build geometry attachments. The 15 Build state/viewport geometry records remain within their configured document bounds, with 23 px grid lettering. I did not perform independent pixel inspection of the PNGs; the orchestrator’s visual checks remain separately supplied evidence.

Build provenance linking the supplied compiled A/B variants to the reviewed source was supplied by the orchestrator. I did not rebuild them.

## 6. Residual risks and gate boundary

These limits do not constitute new Architecture findings:

- If an activation acknowledgment is permanently lost and no terminal worker state can be observed, the application intentionally remains held. This conservative availability tradeoff is explicit in the current contract.
- Browser/user storage eviction and quota pressure remain possible. Conservative retention can accumulate cache storage; no broader cleanup policy is inferred from this bounded slice.
- Existing native evidence is Chromium-specific and does not establish general browser/platform certification.
- The disclosed non-clean dependency audit remains a separate follow-up. This review neither re-audited it nor inferred user risk acceptance.
- The complete final ordered gate—typecheck, intended 336 headless tests, 217 development browser cases, build, deployment dry-run, 130 production regressions, fresh A/B builds, and the 19 native cases—has not yet completed after this review.

**Architecture is PASS for the frozen T12-R3 candidate. Both prior Architecture blockers are closed as Fixed and Verified. The orchestrator should retain the separate Pending executable, acceptance, and publication gates when synthesizing the three axes.**