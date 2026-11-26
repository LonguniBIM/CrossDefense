# T12-R5 Architecture Review

## Verdict

**Architecture: PASS.**

The full Ticket12 implementation, including the current canonical-index repair correction, preserves the accepted application, domain, delivery and persistence responsibilities. I found **no architecture blocker and no new actionable non-blocking architecture defect** within the reviewed scope.

The repair belongs at the Workbox fetch seam. It changes the network address for one precisely identified repair request while keeping the original manifest identity, cache key and integrity enforcement. Application update admission remains owned by the host and `BuildApplication`; native worker control remains owned by the delivery runtime and worker. The correction does not introduce another content activation owner or another Player Data writer.

This is an independent, read-only Architecture verdict. It does **not** certify the pending full post-R5 executable gate or corrected production verification.

| Decision surface | Result |
| --- | --- |
| Axis verdict | **PASS** |
| Native assessment | Strong evidence of appropriate ownership, locality and test seams; no confirmed architectural defect |
| New shared-gate `BLOCKER` findings | **0** |
| New shared-gate `NON_BLOCKING` findings | **0** |
| Confidence | **HIGH** for the reviewed source, dependency semantics and inspected evidence |
| Separate final executable gate | **Pending; not run by this reviewer** |
| Corrected production verification | **Pending; not performed by this reviewer** |

## 1. Frozen payload and identity

| Item | Independently observed value |
| --- | --- |
| Round | T12-R5, mandatory final full review after the corrective batch |
| Checkout | `D:\01_DCMvn\Workspace\CrossDefense` |
| Device | `0bfdbd88-da2a-400d-b6cc-0951271002c5` |
| Original immutable fixed point | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Branch | `fix/ticket12-cloudflare-index-repair` |
| HEAD | `5970b2049733e186fb3ed677d9faeb96ada44c31` |
| Commits since the fixed point | `bb17ece434e8625b3cddcaa66eb555d0a40ed1d4`, then `5970b2049733e186fb3ed677d9faeb96ada44c31` |
| Staged paths | None |
| Unrelated untracked paths | 502; counted, excluded and untouched |
| Full changed payload | 45 paths |
| Executable/configuration/test subset | 24 paths |
| Final independent identity check | `2026-11-26T15:58:34.3598903Z` |

I reproduced both supplied hashes at entry and again at completion:

| Scope | SHA-256 aggregate |
| --- | --- |
| Full 45-path payload | `fb99e865531e732c27dbc811fffb46023674ad577b8f4b11aae9adaf11b24669` |
| Executable 24-path subset | `18de1d68f8c02ef4dc8a3c6eadda64faf46f901fcd87e05df357b80fa63e135c` |

The calculation used Windows PowerShell `Sort-Object` order, followed by each relative path, NUL, lowercase SHA-256 of raw file bytes and LF, with the resulting UTF-8 sequence hashed in memory. No source inventory or snapshot was written.

The final check also confirmed:

- The same eight tracked paths remain modified relative to HEAD: `AGENTS.md`, the active publication plan, the verification record, the tri-axis review record, the production test server, `src/sw.ts`, the offline browser spec and the server-control helper.
- All twelve historical raw review reports are present and have no worktree difference from HEAD.
- The staged index remains empty.
- The full and executable aggregates still match the supplied R5 freeze.

## 2. Exact reviewed scope

### Executable, configuration and test paths

The review covered the complete Ticket12 change set from the original fixed point, rather than only the latest four executable-file changes.

| Area | Paths |
| --- | --- |
| Build and dependency configuration | `package.json`; `package-lock.json`; `vite.config.ts` |
| Production host and application admission | `src/main.ts`; `src/application/build/BuildApplication.ts` |
| Worker and browser delivery | `src/sw.ts`; `src/infrastructure/offline/protocol.ts`; `src/infrastructure/offline/BrowserOfflineRuntime.ts` |
| Presentation | `src/presentation/OfflineStatusView.ts`; `src/presentation/offline.css` |
| Browser verification configuration and server | `playwright.ticket12.config.ts`; `playwright.ticket12-regression.config.ts`; `scripts/testing/ticket12-production-server.mjs` |
| Headless admission verification | `tests/headless/ticket12-update-boundary.test.ts` |
| Native Ticket12 specifications | `tests/e2e/ticket-12-offline.spec.ts`; `tests/e2e/ticket-12-updates.spec.ts`; `tests/e2e/ticket-12-update-lifetime.spec.ts`; `tests/e2e/ticket-12-content-retry.spec.ts` |
| Existing regression adjustment | `tests/e2e/ticket-06-ui.spec.ts` |
| Scenario and fault fixtures | `tests/ticket12BrowserScenario.ts`; `tests/ticket12ServerControl.ts`; `tests/ticket12UpdateFixture.ts`; `tests/ticket12WorkerLifetimeFixture.ts`; `tests/ticket12ContentRetryFixture.ts` |

For `package-lock.json`, the review examined the root dependency contract, resolved PWA/Workbox versions, integrity metadata and the package/version delta. It was not a source audit of every transitive dependency. The installed Workbox implementation was separately inspected where the new hook materially relies on its semantics.

### Documentation and historical records

The nine documentation paths in the frozen payload were included in scope, with substantive attention to authority, accepted boundaries, current corrective evidence and the distinction between historical and pending gates:

- `AGENTS.md`
- `docs/deployment/CLOUDFLARE_WORKERS.md`
- `docs/product/IMPLEMENTATION_BREAKDOWN.md`
- `docs/plans/completed/ticket12-offline-recovery.md`
- `docs/product/TICKET12_OFFLINE_CONTRACT.md`
- `docs/product/TICKET12_DEVELOPMENT_VERIFICATION.md`
- `docs/product/TICKET12_CHATGPT_TRI_AXIS_REVIEW.md`
- `docs/product/TICKET12_ACCEPTANCE_20261126.md`
- `docs/plans/active/ticket12-publication-live-verification.md`

The twelve historical report paths were included in payload verification:

| Round | Historical paths under `docs/reviews/ticket12/` |
| --- | --- |
| R1 | `T12-R1-code-spec.md`; `T12-R1-architecture.md`; `T12-R1-security.md` |
| R2 | `T12-R2-code-spec.md`; `T12-R2-architecture.md`; `T12-R2-security.md` |
| R3 | `T12-R3-code-spec.md`; `T12-R3-architecture.md`; `T12-R3-security.md` |
| R4 | `T12-R4-code-spec.md`; `T12-R4-architecture.md`; `T12-R4-security.md` |

These archival reports were treated as preserved provenance, not as a substitute for this source review. No current R5 peer verdict was supplied or solicited.

### Materially relied-upon supporting sources

I read `docs/WORKFLOW.md`, `docs/patterns/encoding-invariants.md`, the relevant glossary, implementation specification and UX matrix requirements, and the pertinent platform, technical and testing architecture. The accepted ADRs examined were 0001, 0002, 0004, 0005, 0009 and 0010.

The supporting implementation inspection included:

- `ContentPackApplication` validation, activation, pinned restoration and expected-digest checks.
- `LocalStorageContentPackRepository` immutable identity and active/LKG publication.
- `RenderPackBodyStore` separate replaceable body storage.
- The relevant Settings pending-save and Workspace Web Lock boundaries.
- Directly affected Build presentation callers.
- Installed `workbox-precaching/src/PrecacheStrategy.ts` and `workbox-strategies/src/StrategyHandler.ts`.

## 3. Findings and architecture assessment

**No actionable defect finding is opened.** The following `T12-R5-ARCH` records document the positive architectural conclusions and their evidence. They are informational assessment records, not deferrals or requests for additional scope.

### T12-R5-ARCH-01 — Canonical-index repair is localized at the correct fetch seam

| Field | Assessment |
| --- | --- |
| Native strength | **Strong positive** |
| Shared gate | `INFO` |
| Confidence | `HIGH` |
| Remediation | None required within this review |

**Evidence**

- `src/sw.ts:15–23`, `requestWillFetch`.
- `src/sw.ts:122–146`, `repairManifest`.
- `src/sw.ts:24–35`, response verification and cache validation.
- Installed `node_modules/workbox-precaching/src/PrecacheStrategy.ts:130–159`.
- Installed `node_modules/workbox-strategies/src/StrategyHandler.ts:148–202`.
- `tests/e2e/ticket-12-offline.spec.ts:244–349`.

**Observed design**

The hook applies only when all four conditions match: a message event, GET, `redirect: 'error'`, and the exact scope-relative `index.html` URL. It returns a request targeting the scope root and otherwise returns the request unchanged.

`repairManifest` still supplies the immutable manifest URL, original cache key and integrity to `controller.strategy.handleAll`. It still restricts repair to same-origin URLs inside the worker scope and retains the shared abort budget.

The installed Workbox source confirms the relevant ownership distinction. `StrategyHandler.fetch` replaces a fetch-local request with plugin results. `PrecacheStrategy._handleFetch` retains its original request for `cachePut` and applies the manifest integrity before fetching. The hook therefore changes delivery addressing without changing resource identity.

**Impact and rationale**

The provider-specific canonical-document behavior is absorbed inside the existing delivery adapter. The caller still asks the selected worker to repair its own build; neither the browser host nor content application needs to know the canonical route.

Deleting this hook would reintroduce the demonstrated incompatibility. Moving it into the page, manifest or content repository would spread provider knowledge and disturb an established identity boundary. The current placement has good locality and useful depth.

The unchanged redirect policy is material: this is an exact address translation, not a broader redirect-following policy.

**Verification evidence**

The durable test proves refusal of a further redirect even when its terminal document has the correct SRI, then proves successful normal repair of the original revisioned index key. The current focused result and actual-Wrangler result support this source-level conclusion; the full post-R5 gate remains separate.

### T12-R5-ARCH-02 — Update admission has explicit application and native-worker owners

| Field | Assessment |
| --- | --- |
| Native strength | **Strong positive** |
| Shared gate | `INFO` |
| Confidence | `HIGH` |
| Remediation | None required within this review |

**Evidence**

- `src/main.ts:70–99`, boundary state, `canApplyUpdate` and `applyAppUpdate`.
- `src/main.ts:102–114`, screen transition reset.
- `src/main.ts:331–390`, acknowledged Build entry and Review preparation.
- `src/application/build/BuildApplication.ts:88–125`.
- `src/infrastructure/offline/BrowserOfflineRuntime.ts:175–201,237–277`.
- `src/sw.ts:165–209`.
- `tests/headless/ticket12-update-boundary.test.ts:17–74`.
- `tests/e2e/ticket-12-update-lifetime.spec.ts:87–209`.

**Observed design**

The host decides whether the application is at an admitted entry/Build boundary. It includes Workspace ownership, local content, pending entry/Run operations, pending Settings, open dialogs and Build admission.

`BuildApplication` owns its queue, pending acknowledgments and transition hold. Its update admission is synchronous, and its release callback is token-specific. A stale release cannot release a newer transition. The host freezes the UI before awaiting native delivery work.

The delivery runtime observes worker outcomes. A notification timeout changes status text rather than releasing the application boundary. Native activation must reach `activated`; an indeterminate or still-activating state keeps the hold. The worker separately verifies build identity, complete cache bytes and the sole in-scope window before changing control.

**Impact and rationale**

The two owners enforce different invariants without sharing mutable internals. `BuildApplication` does not acquire browser knowledge, and the worker does not infer whether gameplay writes are complete.

The public hold interface is deep: the host learns a small admission/release contract while the application retains sequencing, queued-write and history knowledge. The existing admission tests cross that same interface with real application collaborators.

No new lifecycle abstraction is needed merely to relocate this bounded host orchestration. The current design keeps the accepted invariant near the state owner.

### T12-R5-ARCH-03 — Content Retry separates canceled presentation from outstanding operation ownership

| Field | Assessment |
| --- | --- |
| Native strength | **Strong positive** |
| Shared gate | `INFO` |
| Confidence | `HIGH` |
| Remediation | None required within this review |

**Evidence**

- `src/main.ts:227–253`, awaited projection and screen-epoch checks.
- `src/main.ts:537–596`, `retryContent`.
- `src/main.ts:599–642`, Back cancellation and candidate continuation.
- `src/main.ts:359–390`, acknowledged Review preparation before Build admission.
- `tests/e2e/ticket-12-content-retry.spec.ts:40–139`.
- `tests/ticket12ContentRetryFixture.ts:46–129`.

**Observed design**

Retry captures its content owner and originating screen epoch. Back invalidates the originating screen before yielding. Later presentation and commands are conditional on the captured screen/owner still being current.

The operation counter remains held until the admitted work and readiness reconciliation settle, even if the originating screen has been replaced. A current Retry awaits the complete Run/Build re-entry, including Review preparation, before admission can reopen.

**Impact and rationale**

Cancellation does not masquerade as storage acknowledgment. Conversely, a completed storage operation does not grant an obsolete screen permission to publish a new view or start Review work.

These concerns are related but distinct, and the code represents both explicitly. The durable browser tests verify the observable separation through genuine committed transactions and their held acknowledgments, rather than by directly setting host flags.

The fixture is internal to tests. It does not add a production test hook or another application interface.

### T12-R5-ARCH-04 — Delivery remains separate from content identity and authoritative Player Data

| Field | Assessment |
| --- | --- |
| Native strength | **Strong positive** |
| Shared gate | `INFO` |
| Confidence | `HIGH` |
| Remediation | None required within this review |

**Evidence**

- `vite.config.ts:14–27,37–49`.
- `src/sw.ts:8–60,87–146`.
- `src/infrastructure/offline/BrowserOfflineRuntime.ts:141–171`.
- `src/presentation/OfflineStatusView.ts:50–75`.
- `src/application/content/ContentPackApplication.ts:16–51`.
- `src/infrastructure/content/LocalStorageContentPackRepository.ts:37–70`.
- `src/infrastructure/content/RenderPackBodyStore.ts:7–35`.
- `docs/product/TICKET12_OFFLINE_CONTRACT.md:27–45`.

**Observed design**

The build explicitly requires all six shipped manifests and generates SHA-256 integrity from the emitted bytes. The worker checks stored bytes, uses build-specific caches, and repairs the manifest belonging to the contacted active or waiting worker.

The offline status view combines delivery readiness with the host's validated-content readiness. It delegates activation to the host instead of inferring admission from the visible screen.

Content validation and immutable identity remain owned by `ContentPackApplication` and its repository. Pinned restoration retains the requested version without silently changing active/default pointers. The active/LKG/digest registry remains singular; large render bodies retain their separate replaceable store.

The worker imports no Player Data repository and contains no content activation, Run migration or gameplay mutation. Previous application caches and shipped versions are conservatively retained.

**Impact and rationale**

Delivery recovery cannot become a hidden save-reset operation. A waiting worker repairs its own cache, avoiding page-level fetches that could repair the controlling build instead. The limited historical hashed-resource route addresses old-document resource needs without introducing a general navigation or source fallback.

This respects ADRs 0002, 0004, 0005 and 0009 and the technical architecture's persistence-domain separation. Conservative retention has a storage cost, but it is the explicitly accepted bounded policy; speculative garbage collection would expand the change and require additional retention proof.

### T12-R5-ARCH-05 — Durable tests exercise the public behavior and real adapter variation

| Field | Assessment |
| --- | --- |
| Native strength | **Strong positive** |
| Shared gate | `INFO` |
| Confidence | `HIGH` |
| Remediation | None required within this review |

**Evidence**

- `scripts/testing/ticket12-production-server.mjs:19–49,52–100`.
- `tests/ticket12ServerControl.ts:3–19`.
- `playwright.ticket12.config.ts:15–35`.
- `playwright.ticket12-regression.config.ts:13–35`.
- `tests/e2e/ticket-12-offline.spec.ts:43–241,244–349`.
- `tests/ticket12BrowserScenario.ts:87–130`.
- `tests/ticket12WorkerLifetimeFixture.ts:29–89`.
- `tests/e2e/ticket-06-ui.spec.ts:195–204`.

**Observed design**

The native suite uses compiled output, real workers and browser storage. The host fixture models the observed canonical 307 after existing explicit failure injection. Its optional `redirectRoot` fault is a bounded boolean, token-protected and reset on every control update. The terminal document exists only while that fault is active.

The new regression uses the public Retry button. It independently records the cache entries, actual body hashes, controller identity and complete Player Data. It verifies both the prohibited further redirect and the allowed canonical repair, followed by an offline Pilot reload.

The broader suite preserves the distinction between a played offline loop and targeted historical storage fixtures. The deterministic comparison replays observed inputs through the public `CombatApplication` seam. Worker lifetime fixtures defer original native calls or extend a native event lifetime; they do not fabricate activation outcomes.

The existing Map test adjustment waits for the actual target screen before retaining its original geometry assertions.

**Impact and rationale**

These are justified adapter and scheduling seams. They create the specific variation needed to test observable guarantees while keeping production interfaces free of test-only controls.

The redirect test is particularly discriminating: a terminal response with correct bytes means the negative phase can detect an accidental switch to redirect-following. Its positive phase then detects failure to restore the original Workbox identity. Merely obtaining a successful HTTP response would not establish either property.

## 4. Evidence actually inspected

All results below were read from existing artifacts. **I did not execute these tests or reproduce their runtime actions.**

| Existing evidence | Independent read-only observation |
| --- | --- |
| `final-headless-04/headless-results.json` | Success; 336 passed, 0 failed/pending/todo, 37 files |
| `final-development-04/browser-results.json` | 217 expected/passed; one result each; worker 1, retries 0, repeat 1; no skipped/flaky/unexpected/global errors |
| `final-production-04/browser-results.json` | 130 expected/passed with the same clean result accounting |
| `final-native-04/browser-results.json` | 19 expected/passed with the same clean result accounting |
| `publication-index-red-01/browser-results.json` | One failed result at the exact required index-repair assertion: `/index.html` remained missing |
| `publication-index-green-01/browser-results.json` | One passed result, one attempt, retry 0; case 2.632 seconds, report 3.801477 seconds; no skipped/flaky/unexpected/global errors |
| Focused GREEN refusal diagnostic | Correct-SRI terminal document was available, but Retry left the index missing and the cache at eight entries |
| Focused GREEN repair diagnostic | Same controller, `ticket12-index-repair`, nine ready entries, original index restored, other eight entries equal, complete Player Data equal |
| `publication-repair-diagnosis-01/red-result.json` | Actual local Wrangler canonical 307; initial readiness; exact local index loss; public Retry remained unready |
| `publication-repair-diagnosis-01/probe-result.json` | `redirect:error` failed; `follow` reached the correct 417-byte/SRI document; the read-only probe did not repair the cache |
| `publication-repair-diagnosis-01/green-01-result.json` | Actual local Wrangler public Retry requested `GET /`, restored the original revisioned index key and expected body/SRI, and reported ready |

The independently computed SHA-256 of the Wrangler GREEN JSON is:

`edaed307f69ace74e064f22ee45bd774d14d4336796ae3bd4a759275bf1c494e`

It matches the supplied evidence identity. That result also records closed browser/context resources and free owned HTTP/inspector ports. I did not perform a new port or process-liveness audit.

The historical gate04 results remain evidence for the accepted pre-correction candidate. They are not relabeled as a full gate for the R5 executable aggregate.

## 5. Read-only checks performed

The review used:

- Repository status, branch, HEAD, immutable-base resolution and commit inventory.
- Full changed-path inventory and current tracked-difference inspection.
- Bounded source/document reads, `git grep`, `git ls-files`, and source diffs from the original fixed point.
- In-memory raw-byte aggregate hashing at entry and completion.
- In-memory lockfile comparison and installed Workbox source inspection.
- Read-only parsing of the existing headless/browser reports and focused inline diagnostics.
- Direct reading and hashing of the retained Wrangler diagnosis results.

No source, documentation, report, inventory, snapshot or bundle was written. No tests, builds, servers, browsers or production actions were run. No Git mutation, dependency installation, audit fix, provider review, credential action or suspended operation was performed.

## 6. Unexamined limits and carried boundaries

This review does not establish:

- The result of the forthcoming ordered R5 gate, including the now twenty-case native selection.
- The corrected deployment's live HTTPS/offline/recovery result.
- A fresh visual inspection of screenshots or replay of every retained trace.
- Universal browser, storage-eviction, quota or performance behavior.
- A comprehensive vulnerability audit of the dependency tree.
- Independent release signing; manifest SRI still relies on the accepted build/hosting provenance.
- Full-MVP completion, general release readiness, complete asset-rights acceptance or Ticket02/03 final acceptance.

`SEC-F01` remains the supplied **Open/non-blocking** security follow-up. This Architecture review neither closes it nor infers risk acceptance.

Indeterminate activation intentionally retains the admitted hold when neither a definitive refusal nor a terminal native state is observable. Conservative cache retention intentionally preserves required prior resources. Both are accepted contract choices, not newly introduced review deferrals.

## 7. Handback

**T12-R5 Architecture PASS applies to the exact frozen full Ticket12 payload and executable hashes recorded above.** No architectural remediation is required before the orchestrator proceeds to the separately required executable gate.

The next proof remains the fresh ordered gate on the corrected candidate, followed by the authorized corrected publication and actual production verification. This report does not supply those results.