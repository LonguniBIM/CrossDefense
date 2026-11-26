# T12-R5 — Final Full Code/Spec Review

Date: 2026-11-26  
Reviewer: Independent Code/Spec axis  
Method: `spec-code-review`, with separate Standards and Spec assessments  
Mode: Review-and-revise; read-only review of the frozen candidate

## Standards

**Verdict: PASS, with one Low, non-blocking documentation finding.**

No blocking code, configuration, test-quality or repository-standard defect was identified in the examined full Ticket12 implementation.

### T12-R5-CS-STD-01 — Current reproduction recipe repeats a headless file that publication has made tracked

**Native severity:** Low  
**Gate:** NON-BLOCKING; documentation correction for closeout, not an executable-code blocker  
**Confidence:** High  
**Location:** `docs/product/TICKET12_DEVELOPMENT_VERIFICATION.md:359`, “Reproduce The Complete Ordered Gate”

**Evidence**

The current reproduction block constructs the headless selection as:

```powershell
$ticket12ProductTests = @(git ls-files -- 'tests/headless/*.test.ts') + @('tests/headless/ticket12-update-boundary.test.ts')
```

A direct, read-only evaluation in the frozen published checkout established:

- `git ls-files -- 'tests/headless/*.test.ts'` returns **37 files**.
- That tracked list already includes `tests/headless/ticket12-update-boundary.test.ts`.
- The documented expression therefore constructs **38 path arguments**, with that Ticket12 file appearing twice.

The same expression at line 161 belongs to the historical R3 execution checkpoint, where the document explicitly records **36 tracked files plus the new, then-untracked Ticket12 file**. That historical command is accurate for its checkpoint and should remain unchanged.

**Repository basis**

`docs/WORKFLOW.md`, “Completion Standard,” requires current repository truth and accurate validation reporting. The current reproduction block should express the intended tracked product selection for the published checkout. This is a documentation-accuracy finding, not an invented coding-style rule.

**Impact**

The current recipe contains a redundant selector and no longer corresponds directly to the intended 37-file selection. This complicates selection auditing and can mislead a maintainer comparing command arguments with the recorded file count.

This finding **does not establish duplicate Vitest execution**, an omitted test, weakened assertions or an invalid historical PASS. No test runner was launched to investigate deduplication behavior. Root separately states that the prepared R5 gate selects the 37 tracked files once; that prepared command has not been executed during this review.

**Remediation**

Change only the current reproduction recipe to:

```powershell
$ticket12ProductTests = @(git ls-files -- 'tests/headless/*.test.ts')
```

Preserve the historical line 161 command and its contemporaneous evidence. Root has acknowledged this correction for application after all frozen reviews return. The reviewed frozen file still contains the finding.

### Standards checks completed

- The worker, browser delivery adapter, application admission boundary and status view retain distinct responsibilities. The new worker hook does not take ownership of Player Data or content activation.
- The changed code follows the existing repository’s TypeScript/application conventions. No additional heuristic finding had a concrete enough consequence to report.
- The correction is bounded to canonical-document network repair and its test fixture. It introduces no Cloudflare policy change, content-manifest URL change, gameplay rule or dependency change.
- The native test fixtures operate through actual worker, storage and browser behavior. Their targeted scheduling and failure controls are explicitly distinguished from played gameplay proof.
- The Node-side server control remains token-protected and loopback-bound. The token is supplied from the test runner, not injected into the application page.
- `package.json` preserves all existing direct dependency versions. An in-memory semantic comparison of the full lockfile against the original fixed point found **334 added package locations, zero removed locations**, and only one changed existing package location: `@types/estree` from `1.0.9` to `1.0.11`, with its corresponding resolved URL and integrity fields.
- The scoped whitespace check excluding the twelve preserved raw historical reports exited **0**. Their documented Markdown hard-break preservation exception was not reclassified as an all-files whitespace PASS.

## Spec

**Verdict: PASS within the examined source and recorded-evidence scope.**

**No Spec findings.**

The separate fresh R5 executable gate and corrected production verification remain pending. This Spec verdict is a source/evidence review conclusion; it does not claim those pending executions have passed.

### Contract coverage

| Requirement | Source examined | Assessment and proof boundary |
| --- | --- | --- |
| Complete production preparation, including all six immutable packs | `vite.config.ts:addIntegrity`, `src/sw.ts:verifyCache`, `src/infrastructure/offline/protocol.ts` | Required pack membership is enforced during manifest generation. Every entry receives SHA-256 integrity. The 16 MiB limit includes the two large accepted manifests. Readiness verifies stored response bytes rather than cache-name presence. |
| Factual readiness and explicit recovery | `BrowserOfflineRuntime.ts:inspect`, `BrowserOfflineRuntime.ts:retry`, `OfflineStatusView.ts:render`, `src/sw.ts:repairManifest` | Failed preparation and incomplete active/waiting caches remain distinguishable from readiness. The contacted worker repairs its own manifest and build identity. |
| Canonical-index recovery without weakening redirect rejection | `src/sw.ts:15`, `src/sw.ts:122`, `ticket12-production-server.mjs:control` and request handler, `ticket-12-offline.spec.ts:244` | The hook changes only the repair network request for the exact scope index document. Original cache identity, manifest integrity, strict redirects, scope and resource bounds remain intact. The focused regression proves both refusal and successful repair. |
| Safe activation only at entry/Build after preceding work settles | `src/main.ts:canApplyUpdate`, `src/main.ts:applyAppUpdate`, `BuildApplication.ts:holdForAppUpdate` | Ownership, local content, pending entry/start operations, Settings saves, dialogs and Build command state participate in admission. Build and the current UI are frozen synchronously before asynchronous activation. |
| An indeterminate acknowledgment must not reopen play | `BrowserOfflineRuntime.ts:activateAndObserve`, `tests/e2e/ticket-12-update-lifetime.spec.ts` | The 15-second deadline changes status only. Native activation, genuine refusal or redundancy determines completion. The full source retains the corrected lifetime behavior. |
| Worker-side identity, readiness and sole-window checks | `src/sw.ts:validRequest`, `src/sw.ts:isOnlyWindow`, message handler | A caller cannot choose a repair URL. Control changes require the intended build, ready cache and sole in-scope window. No unconditional activation or automatic play-time reload was found. |
| Canceled Content Retry must not publish a stale screen or start later Review work | `src/main.ts:537`, `src/main.ts:599`, `renderPilotRun`, `renderRunProjection`, `showBuild` | Retry owns `entryOperations` through awaited recovery/re-entry. Screen/content-owner checks cancel later work. Already-started writes settle before admission can reopen. |
| Preserve authoritative Player Data, immutable pins and Last Known Good | `src/main.ts` content-recovery paths, unchanged `ContentPackApplication`, unchanged `LocalStorageContentPackRepository`, worker cache handling | Content validation/publication remains application-owned. Recovery uses the pinned identity and existing retention owner. No Player Data deletion, save migration or content garbage collection is added. |
| Keep older required app resources and content available | `src/sw.ts` build-specific cache naming and retained hashed-resource route | Earlier caches are retained. The fallback is confined to same-origin, scope-relative hashed JS/CSS resources and verifies bytes before use. It does not provide an arbitrary navigation/source fallback. |
| Offline played slice and durable interruption recovery | `tests/e2e/ticket-12-offline.spec.ts`, `tests/ticket12BrowserScenario.ts` | The full source includes keyboard-earned Pre-Run, Build, actual Combat victory, settlement, Salvage, Review, durable reload and separate interruption recovery assertions. Historical gate04 evidence supports these unchanged behaviors; the new full R5 execution is still required. |
| Deterministic browser/headless outcome parity | `tests/ticket12BrowserScenario.ts:proveTicket12Parity` | Observed ordered inputs replay through the public `CombatApplication` seam. The semantic comparison excludes only `recordedAt` wall-clock metadata. |
| Accepted layout/readability and native state proof | `src/presentation/offline.css`, lifetime layout assertions, offline Combat layout assertions, `tests/e2e/ticket-06-ui.spec.ts` | The delivery layout corrections and clipping assertions remain present. The Map-readiness correction waits for the actual Map before measuring unchanged bounds. Historical numerical geometry was independently rechecked; no new pixel inspection was performed by this reviewer. |

### Canonical-index correction: detailed assessment

The new `requestWillFetch` hook at `src/sw.ts:15` requires all four conditions:

1. The originating event is `message`.
2. The method is `GET`.
3. The request uses `redirect: 'error'`.
4. The URL exactly equals `new URL('index.html', scope).href`.

It then constructs `new Request(scope.href, request)`. Other requests pass through unchanged.

The caller remains `repairManifest`, which:

- Enumerates the worker’s immutable precache manifest.
- Repairs only entries found missing or invalid.
- Checks same-origin and scope membership.
- Supplies the original manifest cache key and integrity to the Workbox strategy.
- Uses `cache: 'reload'`, same-origin credentials, strict redirect rejection and an abort signal.
- Retains the existing 12-second request budget and 16 MiB body bound.
- Rechecks stored bytes after the attempted repair.

I inspected the installed primary implementation in:

- `node_modules/workbox-precaching/PrecacheStrategy.js:_handleFetch`
- `node_modules/workbox-strategies/StrategyHandler.js:fetch`
- `node_modules/workbox-precaching/PrecacheController.js:install`
- `node_modules/workbox-precaching/PrecacheController.js:activate`

Workbox’s network plugin operates on the request used by `handler.fetch`; `_handleFetch` subsequently calls `handler.cachePut` with the original strategy request. Therefore the hook does not replace the manifest/cache identity with `/`. The explicit manifest integrity remains attached to the network fetch and the product cache-validation plugin still validates against the original expected digest.

The server correction places its canonical `/index.html` → `/` 307 **after** `failPaths`, preserving existing explicit failure injection. Its additional root redirect is an optional boolean in token-protected test state, resets when omitted, and enables its correct-body terminal route only while that fault is active.

The new regression is materially diagnostic:

- It first establishes a real current worker and nine valid cached entries.
- It removes only the original revisioned index key.
- It proves that a further root 302 is rejected even though its terminal 200 body has the exact expected index SRI.
- It checks that the other eight entries, complete Player Data snapshot and controlling worker remain unchanged.
- It removes the injected fault and uses public Retry.
- It requires restoration of the exact original index key, status, bytes and integrity.
- It verifies the same worker/build and preserved Pilot after an offline reload.

This is an appropriately narrow correction to `T12-PUB-INDEX-01`. It does not substitute permissive redirect following or change the provider’s hosting policy.

## Frozen Scope And Identity

All relative source paths below resolve inside:

`D:\01_DCMvn\Workspace\CrossDefense`

Device: `0bfdbd88-da2a-400d-b6cc-0951271002c5`

### Comparison point

- Original immutable fixed point: `0fd3f7bf67c1662f01d8449f4623518b69f06a92`
- Reviewed HEAD: `5970b2049733e186fb3ed677d9faeb96ada44c31`
- Reviewed branch: `fix/ticket12-cloudflare-index-repair`
- The merge base of original fixed point and HEAD is the original fixed point.
- Commits inspected in the range:
  - `bb17ece` — Ticket12 implementation publication
  - `5970b20` — PR #6 merge
- The full review includes the working-tree correction above HEAD; it is not limited to the already-committed merge or the narrow repair hunk.
- Index: empty.
- Unrelated untracked paths: **502**, preserved.
- Tracked working-tree changes since publication: the supplied eight paths, with no additional tracked change observed.

### Independent raw-byte aggregate confirmation

Aggregation reproduced in memory using Windows PowerShell `Sort-Object` culture ordering, then concatenating:

`relative path + NUL + lowercase SHA256(raw file bytes) + LF`

The resulting UTF-8 sequence was hashed with SHA-256.

| Check | UTC timestamp | Full scope | Executable/config/test scope |
| --- | --- | --- | --- |
| Entry | `2026-11-26T15:53:26.6584520Z` | 45 paths; matched | 24 paths; matched |
| Completion identity check | `2026-11-26T15:58:43.4264394Z` | 45 paths; matched | 24 paths; matched |

**Full 45-path SHA-256**

```text
fb99e865531e732c27dbc811fffb46023674ad577b8f4b11aae9adaf11b24669
```

**Executable/configuration/test 24-path SHA-256**

```text
18de1d68f8c02ef4dc8a3c6eadda64faf46f901fcd87e05df357b80fa63e135c
```

The later examination of the documentation selector was read-only. No source inventory file, snapshot, source export or copied-source review workspace was created.

### Executable/configuration/test scope — 24 paths

```text
package.json
package-lock.json
vite.config.ts
src/main.ts
src/application/build/BuildApplication.ts
src/sw.ts
src/infrastructure/offline/protocol.ts
src/infrastructure/offline/BrowserOfflineRuntime.ts
src/presentation/OfflineStatusView.ts
src/presentation/offline.css
playwright.ticket12.config.ts
playwright.ticket12-regression.config.ts
scripts/testing/ticket12-production-server.mjs
tests/headless/ticket12-update-boundary.test.ts
tests/e2e/ticket-12-offline.spec.ts
tests/e2e/ticket-12-updates.spec.ts
tests/e2e/ticket-12-update-lifetime.spec.ts
tests/e2e/ticket-12-content-retry.spec.ts
tests/ticket12BrowserScenario.ts
tests/ticket12ServerControl.ts
tests/ticket12UpdateFixture.ts
tests/ticket12WorkerLifetimeFixture.ts
tests/ticket12ContentRetryFixture.ts
tests/e2e/ticket-06-ui.spec.ts
```

### Current and historical project records — nine paths

```text
AGENTS.md
docs/deployment/CLOUDFLARE_WORKERS.md
docs/product/IMPLEMENTATION_BREAKDOWN.md
docs/plans/completed/ticket12-offline-recovery.md
docs/product/TICKET12_OFFLINE_CONTRACT.md
docs/product/TICKET12_DEVELOPMENT_VERIFICATION.md
docs/product/TICKET12_CHATGPT_TRI_AXIS_REVIEW.md
docs/product/TICKET12_ACCEPTANCE_20261126.md
docs/plans/active/ticket12-publication-live-verification.md
```

The current authorization notices, acceptance, publication record and pending R5/live-verification status were distinguished from their retained historical checkpoints.

### Preserved historical review records — twelve paths

```text
docs/reviews/ticket12/T12-R1-code-spec.md
docs/reviews/ticket12/T12-R1-architecture.md
docs/reviews/ticket12/T12-R1-security.md
docs/reviews/ticket12/T12-R2-code-spec.md
docs/reviews/ticket12/T12-R2-architecture.md
docs/reviews/ticket12/T12-R2-security.md
docs/reviews/ticket12/T12-R3-code-spec.md
docs/reviews/ticket12/T12-R3-architecture.md
docs/reviews/ticket12/T12-R3-security.md
docs/reviews/ticket12/T12-R4-code-spec.md
docs/reviews/ticket12/T12-R4-architecture.md
docs/reviews/ticket12/T12-R4-security.md
```

All twelve are included in the confirmed full aggregate and have no working-tree change since publication. Their historical findings and dispositions were treated as provenance, not substituted for the current source review. This review does not claim to have independently repeated every historical investigation in those reports.

## Verification Actually Performed

### Repository and source inspection

Read-only inspection covered:

- Fixed-point validity, merge base, commit range, current HEAD and branch.
- Full diff scope and current working-tree correction.
- Index state and unrelated untracked count.
- Entry/completion source aggregates.
- Full executable slice and relevant unchanged application/content collaborators.
- Semantic lockfile delta.
- Current headless file selection and the documented reproduction expression.
- Scoped whitespace verification.
- Relevant repository authorities:
  - `AGENTS.md`
  - `docs/WORKFLOW.md`
  - `docs/patterns/encoding-invariants.md`
  - Ticket12 contract, acceptance, verification and plans
  - Ticket12 in the approved implementation breakdown
  - Relevant implementation-specification and UX state-matrix requirements
  - Technical/platform architecture and testing strategy
  - Accepted ADR 0009
  - Deployment runbook

No current Architecture or Security reviewer finding or verdict was supplied or consumed. This was one isolated Code/Spec reviewer returning two distinct assessments.

### Existing raw evidence inspected

Evidence root:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126`

| Evidence | Independently observed result | Attribution limit |
| --- | --- | --- |
| `publication-index-red-01/browser-results.json` | One case, one failed attempt; failure at the exact missing-index recovery assertion, `tests/e2e/ticket-12-offline.spec.ts:336` | Preserved RED against the pre-correction build |
| `publication-index-green-01/browser-results.json` | One passing attempt; case 2.632 seconds, report 3.801477 seconds; worker 1, retries 0, repeat 1; zero skips, unexpected/flaky/global errors | Focused correction proof, not the new full gate |
| GREEN inline `canonical-index-redirect-refused.json` | Canonical 307; further root 302; terminal 200 has correct SRI; cache remains not-ready with only `/index.html` missing; eight other entries and Player Data preserved | Actual negative phase |
| GREEN inline `canonical-index-repair-result.json` | Original index exactly restored; other entries and full Player Data equal; same controller; ready with no missing entries | Actual positive phase; offline reload assertions also completed in the passing case |
| `publication-repair-diagnosis-01/red-result.json` | Actual Wrangler canonical 307; initial ready; exactly one index entry removed; public Retry remains not-ready | Actual provider-runtime reproduction |
| `publication-repair-diagnosis-01/probe-result.json` | Strict redirect fails; following returns the correct 417-byte/SRI response; read-only probe does not repair the cache | Causal diagnosis, not an approved production redirect policy |
| `publication-repair-diagnosis-01/green-01-result.json` | Public Retry performs `GET /`; original revisioned index key restored with matching SRI; ready true; no recorded request/page errors; owned cleanup recorded | Actual local Wrangler GREEN |
| `final-headless-04/headless-results.json` | 336 passed tests, 37 files, zero failed/pending | Historical accepted executable candidate |
| `final-development-04/browser-results.json` | 217 passed attempts in 36 files | Historical accepted executable candidate |
| `final-production-04/browser-results.json` | 130 passed attempts in 13 files | Historical accepted executable candidate |
| `final-native-04/browser-results.json` | 19 passed attempts in four files | Historical accepted executable candidate; current suite adds the index regression |
| `publication-artifacts-01/artifact-verification.json` | PASS; 10 exact-byte matches, nine SRI matches, six valid packs, ten MIME matches, eight 404 boundaries; no failed recorded check | Initial published artifact, not the corrected deployment |
| `publication-live-01/browser-results.json` | One failed attempt; two unexecuted cases; intentional 404 request-audit failure retained | Failed live run |
| `publication-live-02/browser-results.json` | Three discovered entries, zero result attempts | Prepared/discovery evidence; no executed live PASS |

The actual-Wrangler GREEN file’s raw SHA-256 independently matches:

```text
edaed307f69ace74e064f22ee45bd774d14d4336796ae3bd4a759275bf1c494e
```

The historical browser report audits confirmed one worker, zero retries and one repeat, with exactly one passed result per case and no skipped, flaky, unexpected or global errors in the accepted gate04 browser stages.

The historical native diagnostic records matching browser/headless outcome digest:

```text
88eb704dd088d32c86d16a26aba48d97d75884b95426544af2d64099940cd43f
```

That diagnostic uses the same approved content/ruleset, seed, **21 input batches / 198 ordered inputs**, and victory at tick **3673**, excluding only `recordedAt`.

I also recalculated the numerical bounds from all **five historical Build geometry attachments / fifteen state-and-viewport captures**. No violation of their documented document, panel, essential-element clipping or minimum 23 px grid-lettering assertions was found.

### Executions not performed

This reviewer did **not** run:

- Typecheck, product tests, builds, deployment dry-runs or a browser.
- New servers or worker experiments.
- Production requests or provider operations.
- A fresh dependency audit.
- Staging, commits, pushes, merges or any other Git mutation.
- Source/file edits, snapshot/export operations or replacement on-disk inventories.
- Provider reviewers, credentials, suspended orchestration or WFP/G-R/G-P operations.

Focused typecheck/build PASS is recorded in the verification ledger; it was not rerun by this reviewer. Current screenshots were not independently inspected as pixels by this reviewer.

## Pending Gates And Preserved Dispositions

The next required executable proof remains the fresh ordered R5 gate on the reviewed executable candidate:

1. Typecheck.
2. The **37 tracked headless product files selected once**.
3. All 217 selected development browser cases.
4. Fresh production build and deployment dry-run.
5. All 130 selected production browser cases.
6. Fresh A/B builds.
7. All **20** current native cases, including the new canonical-index regression.
8. Actual verification of the subsequently corrected deployment.

The historical R4/gate04 PASS and the focused repair PASS must not be combined into a claim that this new full gate has already passed.

The historical `T12-R1-CS-VER-01` resolution remains attributed to gate04. The new R5 gate is a separate current obligation. `T12-PUB-INDEX-01` is supported as corrected by source and focused local proof, while its final full and corrected-deployment proof remains pending.

`SEC-F01` remains **Open/non-blocking**. This report neither regrades that finding nor claims a clean audit or blanket dependency-risk acceptance.

Ticket12 user acceptance and explicit publication authorization remain valid. No additional acceptance for Ticket02/03, full MVP completion, complete asset/content-rights acceptance, optional installation UI or general release readiness is inferred.

## Final Review Disposition

- **Standards: PASS — one Low, non-blocking documentation finding, `T12-R5-CS-STD-01`; no blocking executable defect.**
- **Spec: PASS — zero findings within the examined full Ticket12 source/evidence scope.**
- **Frozen source identity: independently confirmed unchanged.**
- **Fresh R5 ordered executable gate: pending.**
- **Corrected production verification: pending.**