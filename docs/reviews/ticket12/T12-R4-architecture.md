# T12-R4 Architecture Review

## Native Architecture verdict: PASS

**The complete Ticket12 change set passes this Architecture review within the approved development scope. No new Architecture blocker or actionable non-blocking Architecture defect was found.**

This is a fresh, full review against original fixed point `0fd3f7bf67c1662f01d8449f4623518b69f06a92`. It covers the production offline/update implementation, its Application and persistence boundaries, Content Retry ownership, the native verification harness, and the R4 Map-readiness correction. It is not a selective confirmation of the latest two-line test change.

**This verdict does not close the separate integrated verification gate.** A fresh complete ordered gate after R4 remains required. Ticket12 user acceptance remains **Pending**, and publication remains unauthorized.

### Review classification

| Field | Result |
| --- | --- |
| Round | T12-R4 |
| Axis | Architecture |
| Native verdict | **PASS** |
| Architecture blockers | **None found** |
| New actionable non-blocking Architecture findings | **None found** |
| Confidence | **High for the inspected source and recorded native scenarios; bounded by the execution limits below** |
| Original fixed point | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Reviewer execution | Read-only inspection; no tests, builds, servers, dependency changes, source changes, or report writes |
| Overall integrated gate | **Pending; not determined by this axis verdict** |

## 1. Frozen identity and independence

All repository inspection used the existing checkout:

`D:\01_DCMvn\Workspace\CrossDefense`

on `DESKTOP-DBD6QJO`, device ID `0bfdbd88-da2a-400d-b6cc-0951271002c5`, through Remote Desktop Commander.

I independently reproduced the frozen aggregates at the beginning and end of this review. The calculation used Windows PowerShell `Sort-Object` ordering of relative paths and concatenated:

`path + NUL + lowercase SHA256(raw file bytes) + LF`

before hashing the resulting UTF-8 text.

| Identity | Start observation | End observation |
| --- | --- | --- |
| Timestamp, UTC | `2026-11-26T13:04:09.0080057Z` | `2026-11-26T13:11:39.4833426Z` |
| Branch | `feature/ticket12-offline-recovery` | Unchanged |
| HEAD | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` | Unchanged |
| Staged paths | `0` | `0` |
| Tracked changed paths against the fixed point | `9` | `9` |
| In-scope untracked paths | `31` | `31` |
| Unrelated untracked paths | `502` | `502` |

The following aggregates matched the supplied R4 freeze at both observations:

| Frozen set | SHA-256 |
| --- | --- |
| Full 40-path scope | `d68a5c6b64027f73dc05df73cddd84dd82e02b4babbcf70611c12384d08436f1` |
| 24 executable/configuration paths | `dc30bd59c97de7041999415ccdc1654b516fa46243e9a8e4abb414ae49657dc8` |
| Original 23 executable/configuration paths, excluding `tests/e2e/ticket-06-ui.spec.ts` | `636ccebc32d53478d7375e1c9b630d87a8ebcb1d5f927c128e69da5248b89f4e` |

The original 23-path production/test/configuration aggregate therefore remains identical to the supplied R3 implementation identity. The additional existing test accounts for the R4 executable-scope increase.

No current R4 peer report or peer finding was consulted. Historical review outcomes and remediation evidence were read through the required verification and tri-axis ledgers. The nine historical raw reports were included in frozen identity verification; they were not used as substitutes for an independent examination of the current implementation.

## 2. Contract and scope examined

The review used the **diff-scoped Architecture contract** from `three-axis-review`, with the module, interface, depth, seam, adapter, leverage, and locality vocabulary from `codebase-design`. The broad whole-codebase architecture-survey workflow was not applied.

Authority examined included:

- `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, and `docs/patterns/encoding-invariants.md`.
- `docs/ARCHITECTURE.md`, relevant platform and technical architecture sections, and the testing strategy.
- Accepted ADRs 0001, 0002, 0009, and 0010.
- The approved Ticket12 breakdown and relevant implementation specification and UX state-matrix requirements.
- `docs/product/TICKET12_OFFLINE_CONTRACT.md`, the active Ticket12 plan, the complete current development-verification ledger, and the tri-axis record.

The full changed architecture was examined across these surfaces:

| Surface | Examination |
| --- | --- |
| Composition and lifecycle admission | `src/main.ts`, including entry operations, Build admission, Content Retry, screen epochs, safe reload, and bootstrap/recovery |
| Application command boundary | `BuildApplication`, public update hold, queued/pending edits, Attempt exclusion, and history preservation |
| Browser delivery coordination | `BrowserOfflineRuntime`, production message protocol, registration, readiness, repair, staged updates, and activation lifetime |
| Worker ownership | `src/sw.ts`, Workbox precache integration, byte integrity, repair, retention, client checks, and explicit control transitions |
| Presentation | `OfflineStatusView`, `offline.css`, admission callbacks, status placement, and layout integration |
| Build and dependency integration | Vite/PWA configuration, package additions, and lockfile changes |
| Durable test seams | Four public Build-boundary tests; all four native Ticket12 test files; their scenario, update, lifetime, Content Retry, and server-control fixtures |
| Bounded harness | Both Ticket12 Playwright configurations and the owned production server |
| R4 correction | Exact baseline-to-current diff and surrounding Map/diagnostic geometry test |
| Existing relied-upon owners | ContentPackApplication, content registry/body storage, Review recovery, Settings pending-save ownership, Workspace Web Lock, and relevant Run/persistence contracts |

This was not a general review of unrelated gameplay, all historical migrations, the full MVP, or the 502 unrelated untracked paths.

## 3. Architectural strengths and evidence

### 3.1 Ownership remains explicit across Application, host, browser runtime, and worker

**Observed:** The change assigns different responsibilities to identifiable owners:

| Owner | Responsibility |
| --- | --- |
| `BuildApplication` | Determines whether its editing context can be frozen and rejects competing Build/Attempt commands |
| Host in `main.ts` | Determines whether the current screen and outstanding operations constitute an accepted entry/Build boundary |
| `BrowserOfflineRuntime` | Coordinates browser delivery status, waiting-worker repair, and the lifetime of an explicit activation request |
| Service worker | Verifies its own manifest/cache, requested build identity, and in-scope window population before changing control |
| `ContentPackApplication` and existing repositories | Retain validated immutable content identity and authoritative Player Data responsibilities |

The new worker/runtime code does not become a gameplay, reward, Run-pin, or Player Data owner. `BuildApplication` does not import a service worker, DOM, or browser cache API. The browser-specific update lifetime stays outside Domain.

**Evidence:** `src/application/build/BuildApplication.ts:88–120`; `src/main.ts:70–103`; `src/infrastructure/offline/BrowserOfflineRuntime.ts:14–25,175–201`; `src/sw.ts:156–204`; `docs/product/TICKET12_OFFLINE_CONTRACT.md:27–45`.

**Architectural assessment:** The division preserves the inward gameplay dependency shape and keeps browser infrastructure concerns from entering the deterministic Domain Core. The status view receives host admission/activation callbacks rather than owning the authoritative update decision.

### 3.2 The public Build hold is a small interface with substantial protection

**Observed:** `holdForAppUpdate()` performs synchronous admission before returning a release callback. Its predicate excludes missing context, pending saves, opening, queued commands, an Attempt hold, and another update hold. `enqueue()` and `open()` reject while held; Attempt admission also rejects.

The release callback is token-scoped. A callback from an earlier transition cannot release a later one. Admission does not reopen the Build, discard history, or create a persistence operation.

**Evidence:** `src/application/build/BuildApplication.ts:33–39,88–120`; `tests/headless/ticket12-update-boundary.test.ts:17–75`.

The public tests exercise both allowed and forbidden behavior:

- Commands are rejected while admitted.
- A same-turn queued edit prevents admission.
- A lost write acknowledgment blocks admission until exact Retry.
- A stale release callback cannot unfreeze a newer hold.
- Refusal permits subsequent edits on the same acknowledged Build.

**Architectural assessment:** This interface has good depth. Removing it would push knowledge of Build queues, uncertain writes, Attempt admission, and release ownership into browser callers. Its public Application seam is the appropriate durable test surface.

### 3.3 Activation lifetime is owned through a terminal outcome

**Observed:** The host acquires the Build hold, sets `applyingUpdate`, and makes the root inert before awaiting browser activation. A successful result triggers the explicit reload. A terminal refusal releases the same hold and UI.

`activateAndObserve()` treats the 15-second deadline as a status notification. It continues observing the native worker and retains the admission boundary through an indeterminate result. It finishes on native `activated`, `redundant`, a definitive refusal when activation has not already begun, or inability to send the request. A positive message alone does not complete the operation.

**Evidence:** `src/main.ts:86–99`; `src/infrastructure/offline/BrowserOfflineRuntime.ts:175–201,235–278`.

I independently decoded the current native report attachments:

| Native condition | Observed elapsed time | Observed state |
| --- | ---: | --- |
| Held before original `skipWaiting` | `16,515 ms` | Root inert; Build Phase; A document; B installed; native call count zero |
| Held during actual activation | `16,523 ms` | Root inert; Build Phase; A document; native active/controller state activating |
| Held before real window enumeration/refusal | `16,508 ms` | Root inert; Build Phase; waiting worker installed; original window check not yet called |

The corresponding tests also retain real pointer-input probes, full native Player Data comparisons, terminal reload checks, and refusal/Undo-history assertions.

**Evidence:** `tests/e2e/ticket-12-update-lifetime.spec.ts:91–210`; `tests/ticket12WorkerLifetimeFixture.ts:29–115`; `r2-remediation-full-01/browser-results.json`, lifetime attachments.

**Architectural assessment:** A communication deadline no longer masquerades as cancellation of a native operation. This closes the earlier lifetime ownership defect without adding an unrelated global cancellation framework.

### 3.4 Content Retry now owns its full asynchronous continuation

**Observed:** Content Retry uses one shared pending owner and increments `entryOperations` before asynchronous work. It captures both the originating screen epoch and content owner, checking them before later commands and presentation publication.

Back navigation invalidates the originating screen synchronously before its chooser read can yield. An already-started content operation is allowed to settle; cancellation stops subsequent work rather than pretending the operation was acknowledged. Shared local content readiness is reconciled through the captured current owner before admission can reopen.

The Retry promise now awaits:

`renderPilotRun → renderRunProjection → enterBuild → showBuild → Review.recover`

Consequently, a genuine Review preparation operation remains inside the pending lifetime until acknowledged. Safe Build admission is published after that chain.

**Evidence:** `src/main.ts:227–253,331–390,475–500,530–643`; `src/application/review/ReviewApplication.ts:49–85`.

The native evidence distinguishes the two relevant schedules:

- **Canceled continuation:** One trusted content completion remains held after Back. After release, the trace still contains exactly one content publication and no Review write; the chooser and Player Data are preserved before safe B activation.
- **Current continuation:** One genuine `ensure-review` write has committed, with one link/occurrence/operation and no reward, while its acknowledgment remains held. Build and update admission remain unavailable until that acknowledgment is delivered.

**Evidence:** `tests/e2e/ticket-12-content-retry.spec.ts:40–140`; `tests/ticket12ContentRetryFixture.ts:46–129`; current report attachments `content-retry-held-after-back.json`, `content-retry-canceled-and-drained.json`, and `content-retry-review-committed-awaiting-ack.json`.

**Architectural assessment:** Operation ownership, screen ownership, and application-owner identity are explicit. The correction stays local to the existing host continuation and preserves the existing Review Application as the durable operation owner.

### 3.5 Cache readiness and repair have a coherent manifest owner

**Observed:** Vite generates one application/worker build identity, requires all six shipped manifest paths, adds SHA-256 integrity to every precache entry, and explicitly accommodates the large accepted manifests with a 16 MiB per-file limit.

The worker checks actual cached bodies against expected integrity and bounds body reads. Repair accepts a build identity; it derives resource addresses, cache keys, and integrity from its own immutable manifest. A waiting worker repairs its own cache. The caller cannot supply an arbitrary repair URL or substitute the active worker’s manifest.

**Evidence:** `vite.config.ts:8–49`; `src/infrastructure/offline/protocol.ts:3–20`; `src/sw.ts:11–30,53–138`; `src/infrastructure/offline/BrowserOfflineRuntime.ts:141–173`.

The waiting-cache test damages only the staged cache, checks A remains ready, observes explicit refusal, repairs the same installed waiting worker with unchanged script bytes, then verifies safe activation and offline preservation.

**Evidence:** `tests/e2e/ticket-12-updates.spec.ts:334–383`.

**Architectural assessment:** Manifest ownership gives the repair interface high leverage and prevents cache-coordination knowledge from spreading into the status view or content application. Keeping staged identity separate from staged readiness also makes an incomplete candidate actionable without treating it as activatable.

### 3.6 Replaceable delivery resources remain separate from content activation and Player Data

**Observed:** The new worker code operates on application caches and browser control. Content validation remains behind `ContentPackApplication`. Immutable identity conflicts are handled by the existing registry/body owners, and pinned lookup still validates the requested version and digest.

The application retains existing recovery behavior for unavailable content instead of rewriting Run pins or replacing a Pilot/Run. No new Player Data schema, save migration, reward policy, or content garbage collector appears in this change.

**Evidence:** `src/application/content/ContentPackApplication.ts:16–51`; `src/infrastructure/content/LocalStorageContentPackRepository.ts:24–70`; `src/infrastructure/content/RenderPackBodyStore.ts:7–35`; `src/main.ts:38–45,475–500,546–590`; `docs/architecture/TECHNICAL_ARCHITECTURE.md:131–149,228–244`.

The native suite covers invalid candidates/LKG, missing old pins, active-cache corruption, failed installation, quota exhaustion, and old-Run preservation through update and offline reload.

**Architectural assessment:** The Ticket12 delivery layer does not introduce a second content activation authority or conflate replaceable material with committed player state.

### 3.7 Conservative retention is consistent with the approved bounded slice

**Observed:** Each App build uses a separate cache. The implementation retains prior build caches and all shipped pack versions. A narrowly matched older hashed JS/CSS route can satisfy an old-build resource request from a retained cache; navigation and arbitrary missing/source paths do not use that fallback.

**Evidence:** `src/sw.ts:8–49`; `docs/product/TICKET12_OFFLINE_CONTRACT.md:29–35`; `tests/e2e/ticket-12-offline.spec.ts:23–30`; `tests/e2e/ticket-12-updates.spec.ts:154–193`.

**Architectural assessment:** This is the accepted retention tradeoff for Ticket12. Long-term cache reclamation would require its own ownership and reference-safety policy. Its absence is not a new defect under the current release bar, and this review does not create a garbage-collection requirement.

### 3.8 The verification harness crosses real boundaries without adding production hooks

**Observed:** The harness serves compiled output from an owned loopback server, refuses reuse of an existing server, uses bounded token-protected control input, and returns real 404 responses. Native Ticket12 tests enable service workers; legacy HTTP-response fixtures preserve their existing worker-blocked seam.

The worker lifetime fixture delays original browser operations or extends an actual activate event. The Content Retry fixture holds the application acknowledgment after a genuine native commit and later delivers the original trusted event. These fixtures do not manufacture successful worker states or persistence receipts.

**Evidence:** `playwright.ticket12.config.ts:15–36`; `playwright.ticket12-regression.config.ts:13–35`; `scripts/testing/ticket12-production-server.mjs:18–85`; `tests/ticket12WorkerLifetimeFixture.ts:29–63`; `tests/ticket12ContentRetryFixture.ts:46–129`.

The complete played-loop scenario earns starter tiles through the production UI and compares the observed ordered-input workload through the public `CombatApplication` seam with an in-memory repository adapter. It explicitly excludes only `recordedAt` from semantic outcome comparison.

**Evidence:** `tests/ticket12BrowserScenario.ts:27–42,87–130`; `tests/e2e/ticket-12-offline.spec.ts:41–166`.

**Architectural assessment:** The combination respects the repository’s two testing seams: public headless Application behavior and real browser/platform integration. No speculative production abstraction was introduced merely to support tests.

## 4. R4 Map-readiness correction

The baseline-to-current diff for `tests/e2e/ticket-06-ui.spec.ts` adds exactly one explanatory comment and one exact heading visibility assertion after Choose Map:

```ts
await expect(
  page.getByRole('heading', { name: 'Map and difficulty', exact: true }),
).toBeVisible();
```

The existing minimum/reference viewport loops, document width/height bounds, diagnostic end-control bound, and diagnostic readiness assertion remain intact.

**Evidence:** `tests/e2e/ticket-06-ui.spec.ts:195–210`, compared directly with the original fixed point.

The production host explicitly publishes a loading view before awaiting Map selection and mounts the actual Map only afterward. Waiting for the Map’s own visible heading is therefore a direct observation of the intended view boundary.

**Evidence:** `src/main.ts:373–383`.

**Architectural assessment:** The correction improves the test’s public presentation seam. It adds no production synchronization hook, sleep, timeout relaxation, CSS concealment, geometry relaxation, or alternative application behavior. It does not reduce the previously asserted layout contract.

I independently audited `r4-map-ready-green-01/browser-results.json`: all 15 cases in the affected file passed once, including CS06-03, with one worker, retries zero, repeatEach one, and no skipped, unexpected, flaky, global, or per-result errors. The preceding full production failure remains a failed run.

## 5. Findings and historical dispositions

### New R4 Architecture findings

**None.** No finding ID is created merely to restate the pending integrated gate or an accepted bounded-scope tradeoff.

### Previously identified Architecture defects

| Historical ID | Current source/evidence assessment | Historical verdict handling |
| --- | --- | --- |
| `ARCH-T12-001` — indeterminate activation releases admission | **Fixed and verified within the inspected source and retained native lifetime/refusal evidence** | Original R1 FAIL and Strong/BLOCKER classification remain unchanged |
| `ARCH-T12-002` — Content Retry outlives navigation without complete operation ownership | **Fixed and verified within the inspected source and retained canceled/current continuation evidence** | Original R2 FAIL and Strong/BLOCKER classification remain unchanged |

These dispositions follow the current code and native evidence examined in this review. They do not retroactively convert earlier failed rounds or failed test executions into passes.

The existing dependency follow-up and non-clean audit remain recorded in the repository. This Architecture review neither independently regrades the Security findings nor infers user risk acceptance.

## 6. Verification evidence independently inspected

All results below were read from existing evidence. **I did not execute these suites during this review.**

Evidence root:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126`

| Existing report | Independently observed result | Interpretation |
| --- | --- | --- |
| `r2-remediation-full-01/browser-results.json` | **19/19 passed**, four files, 19 result attempts, zero result/global errors; one worker, retries 0, repeatEach 1; `192381.885 ms` | Complete current native cohort, including lifetime and Content Retry cases |
| `r4-map-ready-green-01/browser-results.json` | **15/15 passed**, one file, 15 attempts, zero result/global errors; one worker, retries 0, repeatEach 1; `50867.496 ms` | Complete affected production UI file after R4 correction |
| `final-development-03/browser-results.json` | **217/217 passed**, 36 files, 217 attempts, zero result/global errors; one worker, retries 0, repeatEach 1 | Successful third-gate development stage |
| `final-production-03/browser-results.json` | **129 passed, 1 failed**, 130 attempts, 13 files; CS06-03 is the single unexpected case | Failed full production stage remains failed |
| `final-headless-01/headless-results.json` | **336/336 passed**, 37 file results, success true | Historical first headless stage |
| `final-headless-02/headless-results.json` | **335/336 passed, 1 failed**, 37 file results, success false | Historical failed headless stage remains failed |
| `final-headless-03/headless-results.json` | **336/336 passed**, 37 file results, success true | Successful third-gate headless stage |

The current native parity attachment reports:

- App build: `ticket12-a`.
- Terminal outcome: victory at tick `3673`.
- Browser and headless semantic digest:  
  `c5462479c310b8e1a813f68fba5da1c450bcd53f065e1570bdc76f8282efb7dc`.

This is the digest of the inspected current native report. It is not substituted for the distinct digests retained from earlier successful runs.

The complete ledgers preserve the original installation, layout, waiting-cache, activation-lifetime, Content Retry, wrapper-launch, and later deadline failures. Their presence was not treated as an unresolved architectural defect when the current mechanism and appropriate remediation proof were available. Conversely, focused successes were not combined into a manufactured complete-gate result.

## 7. Confidence and limits

**High-confidence conclusions:** The current source makes update admission, native activation lifetime, Content Retry continuation ownership, content activation, and cache ownership explicit. The frozen start/end identities match, the relevant public and native tests were inspected, and the retained native reports contain the expected single-attempt results and concrete timing/transaction observations.

The review has these limits:

- No tests, builds, browser sessions, servers, dependency installation, or deployment commands were run.
- No source, documentation, report, inventory, snapshot, bundle, or exported source copy was written.
- Native evidence was inspected as retained reports and selected decoded JSON attachments. I did not independently inspect every screenshot pixel or every trace event.
- I did not independently rebuild the compiled variants or reproduce the recorded build/dry-run execution.
- The earlier development setup deadline failure and headless slowdown remain retained observations. Their underlying latency cause remains unproven; this review does not claim to have solved it.
- Ordinary browser data, production Player Data, the live Ticket11 deployment, suspended operations, and provider review systems were outside the review.
- Full-MVP readiness, general release readiness, content/asset-rights acceptance, and user acceptance are not established by this report.

## 8. Handback

**Architecture permits this frozen R4 candidate to proceed to the separately required complete ordered verification gate. No Architecture remediation is requested.**

That subsequent gate must establish its own fresh result for typecheck, the explicit intended headless selection, the full development selection, fresh build and deployment dry-run, the full production selection, fresh A/B variants, the complete native cohort, current evidence/screenshots, and owned-resource cleanup.

The Architecture verdict is **PASS**. Ticket12 integrated verification and user acceptance remain separate, and publication remains unauthorized.