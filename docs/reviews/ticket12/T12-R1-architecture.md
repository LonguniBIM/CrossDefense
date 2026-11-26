# T12-R1 — Independent Architecture Review

**Architecture verdict: FAIL.** One architecture blocker was found in the lifetime of update admission. The remaining reviewed changes preserve the intended content, persistence, and deterministic-core ownership.

## Review identity and scope

- **Original fixed point and current HEAD:** `0fd3f7bf67c1662f01d8449f4623518b69f06a92`.
- **Branch independently observed:** `feature/ticket12-offline-recovery`.
- **Checkout:** `D:\01_DCMvn\Workspace\CrossDefense`.
- **Round:** `T12-R1`, using the supplied 25-file frozen scope and aggregate `e006738339d221e4c2bc406e1e1df191b15abe94214c1168dac5c5f3bd82d6e5`. I accepted the orchestrator’s repeated digest verification; I did not create a source inventory or snapshot.
- **Method:** Read-only source, diff, contract, and test inspection. No checkout mutation, browser operation, test execution, or publication occurred.

Reviewed the new worker/runtime/protocol, `src/main.ts` integration, Build admission changes, status view/CSS, Vite configuration, test server, both Playwright configurations, all new Ticket12 tests/helpers, and the changed authority/contract/evidence documents. For `package-lock.json`, review covered the root dependency declarations and change size, rather than auditing every transitive dependency entry.

Directly relied-on existing modules traced were `ContentPackApplication`, `LocalStorageContentPackRepository`, `SettingsApplication`, `WorkspaceApplication`, and `WorkspaceWriteLock`. Governing material included `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, the invariant-encoding pattern, approved implementation specification/Ticket12, technical/platform/testing architecture, and ADR 0009.

## Finding

### ARCH-T12-001 — An indeterminate worker transition releases the safe update boundary

| Field | Assessment |
|---|---|
| **Axis** | Architecture |
| **Native strength** | **Strong** |
| **Gate** | **BLOCKER** |
| **Confidence** | **HIGH** for the source-level execution path; occurrence frequency is unmeasured |
| **Disposition** | **OPEN** |
| **Primary symbols** | `BrowserOfflineRuntime.activateWaiting`, `askWorker`, `waitForActivation`, `applyAppUpdate`, worker message handler |

**Exact evidence**

- `src/infrastructure/offline/BrowserOfflineRuntime.ts:169–177`: `activateWaiting()` catches failures from both the activation request and the activation-state wait, calls `failed()`, returns `false`, and clears `state.applying`.
- `src/infrastructure/offline/BrowserOfflineRuntime.ts:199–207`: after 15 seconds, `askWorker()` closes the page’s message port and rejects. It neither cancels the worker request nor establishes that the worker refused it.
- `src/infrastructure/offline/BrowserOfflineRuntime.ts:210–218`: `waitForActivation()` similarly rejects after 15 seconds and removes its listener, even though its own message says the update is **still activating**.
- `src/main.ts:85–97`: any completion that does not initiate reload releases the Build hold, clears `applyingUpdate`, and makes the application root interactive again.
- `src/sw.ts:131,149–160`: the worker’s `event.waitUntil()` task independently continues through cache verification, the window check, and `skipWaiting()`. There is no request cancellation, terminal-state reconciliation, or acknowledgment establishing that this transition cannot occur after the page times out.

**Observed versus inferred**

The above control flow is directly observed in the frozen source. The following reachable schedule is inferred from that asynchronous control flow; I did not run a browser reproduction:

1. At a valid Build boundary, the player explicitly requests the update. The host correctly freezes Build commands and the UI.
2. Worker-side cache verification or activation takes longer than the page’s 15-second timeout.
3. The page treats that timeout as a refused update and releases the hold.
4. The player resumes editing or starts an Attempt.
5. The still-running worker task completes and invokes `skipWaiting()`, or an already-requested activation reaches its terminal state.

**Impact and architectural rationale**

The caller cannot distinguish **“the worker refused”** from **“the transition remains in progress but its acknowledgment is missing.”** A boolean therefore hides a state distinction that the host must know to preserve the safe boundary.

This splits ownership of one concurrency invariant: the page owns the lifetime of the Build/UI freeze, while the worker owns an operation that can outlive that freeze. The worker can consequently activate after the application has resumed gameplay or accepted another write.

This finding does **not** claim that the path demonstrably loses Player Data or automatically reloads the page. It establishes that the explicit safe-activation contract is not maintained for delayed or indeterminate transitions.

**Accepted rule**

`docs/product/TICKET12_OFFLINE_CONTRACT.md`, **Safe Update Admission**, requires:

- activation only at the defined entry/Build points;
- exclusion of pending writes and Attempt transitions;
- synchronous freezing before the asynchronous worker request; and
- release of the same Build **on refusal**.

The technical architecture also requires a coherent App version and safe reload/restart. A local timeout is not evidence of refusal.

**Expected remediation**

Make the activation result and admission lifetime represent an indeterminate transition explicitly. Keep the admitted boundary held until one of these is established:

- the worker definitively refuses or cancels the operation; or
- the intended build finishes activation and the host performs the admitted reload.

On acknowledgment timeout or delayed activation, reconcile the real worker/operation state or obtain an explicit cancellation acknowledgment before releasing interaction. Keep this policy behind the offline runtime’s interface; do not require the host to infer it from message-port behavior. Increasing the timeout alone would leave the same race.

**Proof required**

Add a focused production-browser case using a real waiting worker and a controlled delay that exceeds the page timeout:

1. Delay worker processing **before** `skipWaiting()`.
2. Verify that the UI/Build cannot resume a new write or Attempt while the request remains indeterminate.
3. Release the delay and establish either safe activation/reload or definitive refusal/cancellation.
4. Repeat for delayed completion **after** activation has been requested.
5. Verify that a genuine refusal still restores the same acknowledged Build, including its history, and preserves Player Data.

The existing public Build tests should remain green. The current browser suite covers immediate refusal, pending Build/Settings writes, failed preparation, quota failure, and second-window refusal, but it does not cover this operation-lifetime boundary.

## Architecture observations without additional findings

- **Build edit ownership remains local.** `BuildApplication.holdForAppUpdate()` reuses the existing serialized edit owner, rejects queued/pending edits synchronously, and uses a token so an obsolete release callback cannot unfreeze a later transition. Its public Application tests exercise meaningful behavior.
- **Content activation remains application-owned.** The worker deals with replaceable delivery bytes. `ContentPackApplication` retains compatibility, integrity, activation, restoration, and immutable identity responsibility. The new code does not introduce a second active/default/LKG registry.
- **Player Data remains separate.** The new worker/runtime does not modify the authoritative Dexie workspace store. Conservative cache retention and the older hashed-resource route align with the bounded retention decision.
- **The deterministic Domain core is unchanged.** Browser/headless parity crosses the public `CombatApplication` seam using the same startup and ordered inputs. The wall-clock exclusion is explicit.
- **The delivery module provides useful depth.** Registration, worker observation, cache verification, repair, and staging sit behind the browser runtime instead of spreading through individual gameplay views. No generic framework or speculative control plane was introduced.
- **Verification seams are appropriate to the change.** The isolated server serves compiled builds and supplies bounded faults; the Ticket12 browser tests use native service workers, storage, and Web Locks.

## Evidence and limits

The supplied verification record reports passing typecheck/build, 336 headless tests, real offline play/recovery, content failure cases, geometry correction, and five of six initial update-variant cases. Those results are **orchestrator-supplied evidence**, not independent executions by this reviewer. The known remaining Build-label assertion and final regression gates remain separate from this architecture finding.

I did not examine peer reports, the 502 unrelated untracked paths, unrelated historical debt, production deployment behavior, every transitive dependency, or the full implementation of unchanged persistence/domain modules. No claim is made about final integrated acceptance or publication readiness.
