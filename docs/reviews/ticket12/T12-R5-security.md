# T12-R5 — Independent Security Review

**Mode:** Full diff review against the original immutable Ticket12 fixed point  
**Native Security verdict:** **GREEN**  
**Normalized result:** **PASS within the examined Security scope**  
**New confirmed application vulnerabilities:** **0**  
**Security blockers:** **0**  
**Open follow-up:** **T12-R5-SEC-01**, continuing **SEC-F01**, remains **Open / NON_BLOCKING**

This review covers the complete current Ticket12 change set, including offline delivery, update admission, content recovery, persistence boundaries, verification tooling, dependency changes and the final canonical-index repair. It is not limited to the latest nine-line worker correction.

The separate full executable gate after R5 and corrected production verification remain pending. This source-review verdict does not claim either has completed.

## 1. Scope, authority and frozen identity

### 1.1 Reviewed checkout

| Item | Independently observed value |
| --- | --- |
| Device | DESKTOP-DBD6QJO, `0bfdbd88-da2a-400d-b6cc-0951271002c5` |
| Checkout | `D:\01_DCMvn\Workspace\CrossDefense` |
| Branch | `fix/ticket12-cloudflare-index-repair` |
| Original fixed point | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Current HEAD | `5970b2049733e186fb3ed677d9faeb96ada44c31` |
| Commits after the fixed point | `bb17ece434e8625b3cddcaa66eb555d0a40ed1d4` and merge `5970b2049733e186fb3ed677d9faeb96ada44c31` |
| Index | Empty |
| Unrelated untracked paths | 502; excluded and left untouched |
| Full changed set against the original fixed point | 45 paths |
| Executable, configuration and test subset | 24 paths |

I independently reproduced the supplied hashes at entry and completion:

| Check | Entry, 2026-11-26T15:53:52.2941281Z | Completion, 2026-11-26T16:01:08.1609412Z |
| --- | --- | --- |
| Full 45-path SHA-256 | `fb99e865531e732c27dbc811fffb46023674ad577b8f4b11aae9adaf11b24669` | Same |
| Executable 24-path SHA-256 | `18de1d68f8c02ef4dc8a3c6eadda64faf46f901fcd87e05df357b80fa63e135c` | Same |
| HEAD, branch, empty index, 502 unrelated untracked paths | Confirmed | Confirmed |

The calculation used the specified Windows PowerShell `Sort-Object` culture order, concatenating relative path, NUL, lowercase SHA-256 of raw file bytes and LF, then hashing the UTF-8 concatenation. All inventories and hashes remained in memory.

There are eight working-tree modifications relative to the published HEAD: `AGENTS.md`, the active publication plan, review and verification records, the owned test server, `src/sw.ts`, the offline browser spec and the server-control helper. The complete original-fixed-point diff remained the review target.

### 1.2 Exact executable/configuration/test scope

The following 24 paths were examined through their current contents and relevant original-fixed-point changes. `package-lock.json` was examined structurally rather than reproduced as a complete textual listing.

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

The nine current documentation paths were examined for authority, security invariants, deployment boundaries and evidence interpretation:

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

The twelve archived reports, `docs/reviews/ticket12/T12-R{1,2,3,4}-{code-spec,architecture,security}.md`, were included in the full fingerprint and confirmed unchanged relative to the publication commit. Historical review material was consulted selectively for lineage and the existing dependency follow-up; it did not substitute for inspection of the current implementation. No current R5 peer findings were supplied or solicited.

### 1.3 Relevant supporting material

I also read the repository workflow and invariant-encoding guidance, architecture and ADR material concerning local authority, replaceable caches, immutable packs and coherent application updates. Relevant unchanged collaborators were traced:

- `ContentPackApplication.ts` and `ContentPackCodec.ts`.
- `LocalStorageContentPackRepository.ts` and `RenderPackBodyStore.ts`.
- `WorkspaceWriteLock.ts`.
- The authoritative database identity and relevant schema context in `DexieWorkspaceRepository.ts`.
- `wrangler.jsonc`.
- Installed Workbox `PrecacheController`, `PrecacheStrategy`, `PrecacheCacheKeyPlugin` and `StrategyHandler` behavior.
- Installed Workbox build traversal and resolved dependency versions.

Current authority recognizes accepted Ticket12 engineering work and explicit publication authorization. Historical no-publication statements were not treated as overriding that later authority. This reviewer nevertheless performed only the read-only review and the expressly permitted bounded dependency audit.

## 2. Project security profile

CrossDefense is a browser-local application whose authoritative Workspace, Pilots, Runs, settings and progression live in local Player Data. The hosting service delivers static application and content files; this change adds no remote account, save-sync service or application runtime credential.

The assets at issue are:

- Integrity and durability of acknowledged Player Data and immutable Run pins.
- Coherence of the application version running in an open page.
- Integrity and availability of cached executable resources and content.
- Preservation of validated active and Last Known Good content.
- Separation between published assets and privileged test controls.
- Integrity and availability of the dependency/build path.

The relevant less-trusted inputs are worker messages, network responses, replaceable cache contents, persisted content bodies and requests to the owned local test server. The compiled application/worker manifest, authorized build configuration and dedicated application origin remain trust anchors.

The review does not assume that origin checks or cache integrity headers defend against arbitrary hostile JavaScript already executing with the application’s same-origin privileges.

## 3. Trust boundaries checked

| Boundary | Source and sensitive sink | Examined controls | Result |
| --- | --- | --- | --- |
| Window → service worker | Message payload/source → cache repair, activation or claim | Exact command schema, actual client lookup, origin/scope/window checks, build identity and reply port | PASS |
| Compiled manifest → fetch/cache | Manifest URL/key/SRI → network request and cache write | Manifest-owned inputs, same-origin scope, bounded response reader, expected digest and serialized repair | PASS |
| Canonical index repair | Exact missing index request → canonical root fetch | Message-event GET guard, exact URL, retained `redirect: error`, cloned request and unchanged cache/SRI identity | PASS |
| Cached bytes → resource consumption | Stored response → application/content delivery | Actual SHA-256 verification; current build metadata; narrow retained hashed-resource route | PASS |
| Host lifecycle → worker activation | Update intent → `skipWaiting`, claim and reload | Safe entry/Build admission, pending-operation exclusion, synchronous hold, native terminal-state observation and worker-side window check | PASS |
| Content Retry → later commands | Asynchronous recovery → content publication, Review preparation and presentation | Shared operation count, captured owner, epoch cancellation and awaited re-entry | PASS |
| Replaceable storage → Player Data | Cache/content recovery → local persistence | Separate stores and owners; no worker Player Data deletion, migration or Run repinning | PASS |
| Test HTTP → filesystem/control | URL, token and control JSON → file read or fault selection | Loopback binding, token, POST, bounded payload, allowlisted state, realpath containment and constant redirect target | PASS |
| Dependency/configuration → build tooling | Fixed patterns and output directory → glob/pattern processing | Exact resolved versions and registry integrity; applicability assessment | OPEN follow-up, non-blocking |

## 4. Security analysis

### 4.1 Worker messages have bounded authority

`validRequest` rejects null values, arrays, unexpected properties, invalid build-identity types/formats and unsupported commands. State-changing commands require a build identity. The protocol does not accept a caller-selected resource URL, cache name, cache key, digest, database name or filesystem path.

The handler requires a reply port, checks `event.origin`, resolves the source through `self.clients.get`, and requires the actual client to be an in-scope window. Activation and claim additionally require the worker’s build identity, verified cache readiness, serialized control admission and a native window-list check including uncontrolled windows. Claim refuses a sender already controlled by a worker.

Evidence: `src/infrastructure/offline/protocol.ts:7-20`; `src/sw.ts:149-213`.

`CHECK_CACHE` intentionally permits inspecting another build, including a waiting candidate. Its response carries the worker’s identity; the host distinguishes that identity from the current application before declaring readiness. This does not grant activation or arbitrary-fetch authority.

Evidence: `BrowserOfflineRuntime.ts:98-138,150-166`.

The scope check is consistent with the configured dedicated root deployment. It should not be interpreted as isolation between mutually hostile applications intentionally hosted under that same root origin.

### 4.2 The canonical-index correction preserves strict redirect rejection

The new hook changes the network destination only when all of these conditions hold:

1. The strategy event is a `message`.
2. The request method is `GET`.
3. The request already has `redirect === 'error'`.
4. The request URL exactly equals `new URL('index.html', scope).href`.

It returns `new Request(scope.href, request)`. Other requests are returned unchanged. There is no caller-controlled destination and no general redirect-following exception.

Evidence: `src/sw.ts:15-23`.

The original repair request remains manifest-owned, same-origin, scope-checked, `cache: 'reload'`, `credentials: 'same-origin'`, `redirect: 'error'` and attached to the repair abort signal. The correction changes neither the manifest entry nor its expected cache key or integrity.

Evidence: `src/sw.ts:122-146`.

I checked the installed Workbox implementation rather than relying only on the comment:

- `PrecacheStrategy._handleFetch` adds the manifest integrity to the fetch request and calls `cachePut` with the original strategy request.
- `StrategyHandler.fetch` applies `requestWillFetch` to the network request.
- `PrecacheCacheKeyPlugin` derives the write key from the original `params.cacheKey`.
- `StrategyHandler._ensureResponseSafeToCache` passes the original strategy request to `cacheWillUpdate`.

Evidence: installed `workbox-precaching/PrecacheStrategy.js:77-108`; `workbox-strategies/StrategyHandler.js:120-160,263-294,482-491`; `workbox-precaching/utils/PrecacheCacheKeyPlugin.js:15-25`.

This establishes the intended separation: the corrected fetch goes directly to the canonical root while the cache write and digest authority remain those of the original index entry.

The existing native negative evidence also tests a meaningful bypass attempt: the root returns a real 302 to a terminal 200 response with the exact expected document SRI, yet repair refuses it. The subsequent positive phase restores the original index key and bytes. Both phases preserve the other eight entries and complete Player Data.

Evidence: `tests/e2e/ticket-12-offline.spec.ts:244-351`; independently decoded attachments in `publication-index-green-01/browser-results.json`.

No strict-redirect regression was found.

### 4.3 Integrity and resource controls remain effective within their stated boundary

Build-time integrity comes from SHA-256 of actual output files. All six approved immutable pack manifests are mandatory precache inputs; absence causes the transform to fail. The configured 16 MiB limit accommodates the two large accepted manifests.

Evidence: `vite.config.ts:14-28,37-49`.

The worker verifies actual response bytes before cache acceptance, verifies cached bytes before use and separately walks the complete required manifest when reporting readiness. A missing entry, non-200 response, invalid expected SRI, failed read or digest mismatch cannot establish readiness.

The body reader checks both declared size and accumulated stream bytes against 16 MiB. Repair processes only missing entries from the worker’s own manifest and uses a 12-second request cancellation budget. Concurrent cache checks and repairs reuse their respective in-flight promises.

Evidence: `src/sw.ts:24-39,62-146`.

These controls bound the application validation reader and repair requests. They are not a claim that every native Fetch/SRI allocation is globally memory-bounded, that browser cache operations always complete within twelve seconds, or that unlimited historical builds can be retained without quota pressure.

### 4.4 Cache isolation and retention do not create a general resource fallback

Each build has a scope-derived cache prefix and build identity. Workbox activation cleanup is confined to that strategy’s own cache. The implementation does not delete older build caches or authoritative databases.

The retained-resource route is restricted to same-origin, version-addressed JS/CSS paths beneath `assets/`. It matches an exact requested URL after removing only the Workbox revision parameter from a retained key and verifies the stored response bytes before returning them. Navigation, unknown paths and source/environment/Git paths are not routed through a generic fallback.

Evidence: `src/sw.ts:8-13,40-60`; installed `PrecacheController.js:186-204`.

For older retained entries, the stored integrity header is same-origin provenance metadata. It is not an independent signature against an actor already able to write arbitrary same-origin Cache Storage. No newly reachable external poisoning path to that capability was established.

Conservative retention remains the accepted policy. Browser eviction and quota are residual availability constraints, not reasons to introduce an unauthorized garbage collector in this correction.

### 4.5 Safe update admission protects acknowledged state

The host requires Workspace ownership, validated local content, no applying update, no pending entry operation, no pending Start Run request, no pending Settings save, no open dialog and an accepted entry or acknowledged Build boundary.

Admission synchronously acquires the Build hold, when applicable, and makes the root inert before awaiting the worker. Build commands independently reject while the application update hold exists; the boundary is not solely visual. Queued edits, unacknowledged saves, opening and Attempt startup exclude admission. A token prevents a stale release callback from releasing a later hold.

Evidence: `src/main.ts:70-100`; `BuildApplication.ts:25-39,88-119`; `tests/headless/ticket12-update-boundary.test.ts:17-75`.

Activation observation retains that admission through an indeterminate acknowledgment deadline. Fifteen seconds updates the message; it does not cancel native activation or reopen writes. A positive reply still waits for the native `activated` state, and an already `activating` worker takes precedence over a contradictory late refusal.

Evidence: `BrowserOfflineRuntime.ts:175-201,235-278`.

The worker separately checks cache readiness and the native in-scope window list before changing control. The implementation does not claim that a window-list observation permanently reserves the origin against future windows. Retained version-addressed resources, absence of unconditional claim and the existing Workspace lock remain relevant controls for that race.

There is no unconditional `skipWaiting`, unconditional `clients.claim`, or automatic play-time reload.

### 4.6 Content Retry drains admitted work and prevents stale continuation

Content Retry owns one shared pending operation through content restoration, readiness reconciliation and the awaited Build/Review re-entry chain. Back invalidates the originating screen before the chooser read yields. Captured-owner and epoch checks stop stale continuation from issuing later content work or replacing the current presentation.

Already-started work is awaited; navigation is not treated as acknowledgment of an unfinished operation. The operation count is released only in the outer completion path.

Evidence: `src/main.ts:226-253,475-597,599-644`; native scheduling tests in `ticket-12-content-retry.spec.ts`.

The existing content authority still validates schema, compatibility, manifest digest and embedded asset bytes before activation. Pinned restoration requires the requested immutable version. Subsequent reads compare the validated pack digest with the retained expected identity.

Evidence: `ContentPackApplication.ts:16-50`; `ContentPackCodec.ts:142-178`.

### 4.7 Replaceable delivery remains separate from authoritative Player Data

The worker operates on application caches. It has no path that deletes or recreates the Player Data database, changes Run pins, migrates saves or resets progression.

The content repository retains active/LKG pointers and immutable digests. Large render bodies remain in `crossdefense-render-content-bodies`; authoritative data remains in `crossdefense-player-data`. The existing exclusive Web Lock owns Workspace writes. Failure and recovery continue through the established owners.

Evidence: `LocalStorageContentPackRepository.ts:37-70`; `RenderPackBodyStore.ts:9-34`; `DexieWorkspaceRepository.ts:39`; `WorkspaceWriteLock.ts:22-67`; `src/main.ts:652-701`.

The new delivery view uses a static HTML template. Worker/status/build text is written through `textContent`, `title` and dataset properties rather than interpolated into executable markup.

Evidence: `OfflineStatusView.ts:20-30,50-76`.

### 4.8 Test controls remain isolated from published assets

The owned server binds to `127.0.0.1`. Control requests require the per-run bearer token and POST, cap payload bytes at 4096, allow only available A/B variants and bound failure/corruption selections. The new `redirectRoot` input is optional and boolean; every control update resets it to false unless explicitly enabled.

The canonical `/index.html` redirect occurs after explicit injected failures. The additional terminal target is a constant local path, not a supplied URL, and returns 404 while the redirect fault is disabled.

File serving resolves the actual target using `realpath`, verifies relative-root containment and requires a regular file. The application has no SPA/source fallback.

Evidence: `scripts/testing/ticket12-production-server.mjs:7-101`.

The token originates in the Node-side configuration and is supplied through the API request fixture. It is not injected into the page. Test configurations use owned loopback origins, one worker, no retries and no existing-server reuse.

Evidence: `playwright.ticket12.config.ts:6-36`; `tests/ticket12ServerControl.ts:10-20`.

I independently checked the corrected compiled output for the control endpoint, terminal endpoint, control-token variable, lifetime fixture marker and Content Retry fixture marker. None appeared in its ten regular files.

## 5. Independent artifact and existing-evidence inspection

### 5.1 Corrected compiled output

I parsed the existing generated worker without executing it and recomputed the manifest entries against actual bytes in:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\publication-repair-build-01`

Observed results:

- Application and worker build identity: `ticket12-index-repair`.
- Ten regular files.
- Nine precache entries, all nine matching their embedded SHA-256 SRI.
- All six approved pack manifests present.
- Large manifests: 14,006,431 and 14,006,953 bytes.
- Every entry below 16,777,216 bytes.
- HTML’s JS/CSS references point to the inspected precached resources.
- The compiled hook retains the exact message/GET/error/index guard.
- No inspected test-control or scheduling-fixture marker appears in the output.

This is static inspection of an existing focused build, not a newly executed build or the pending full R5 gate.

### 5.2 Existing reports independently inspected

All paths below are relative to the existing Ticket12 evidence root.

| Evidence | Independently observed result |
| --- | --- |
| `final-headless-04/headless-results.json` | 336 passed, zero failed, 37 files |
| `final-development-04/browser-results.json` | 217 single passed cases, 36 files |
| `final-production-04/browser-results.json` | 130 single passed cases, 13 files |
| `final-native-04/browser-results.json` | 19 single passed cases, four files |
| `publication-index-red-01/browser-results.json` | One selected case, one failed result; preserved RED |
| `publication-index-green-01/browser-results.json` | One selected case, one passed result; 3,801.477 ms report duration |
| `publication-repair-diagnosis-01/red-result.json` | Actual local Wrangler canonical 307; Retry leaves the index missing |
| `publication-repair-diagnosis-01/probe-result.json` | `redirect: error` fails; the diagnostic `follow` probe receives the expected 417-byte document |
| `publication-repair-diagnosis-01/green-01-result.json` | Corrected public Retry requests `GET /`, restores the original revisioned index key/SRI and reports ready |
| `publication-live-01/browser-results.json` | One failed case, two unrun/skipped cases; runner stopped after the configured maximum failure |

The three accepted gate04 browser reports and focused index GREEN use one worker, retries zero, repeat one, one passed result per selected case and zero skipped/flaky/global errors. These historical complete results were not combined with the new focused case to manufacture a post-R5 complete-gate PASS.

The actual local Wrangler GREEN report independently matches SHA-256:

`edaed307f69ace74e064f22ee45bd774d14d4336796ae3bd4a759275bf1c494e`

It records no request failures, page exceptions or console errors, and records closure of its owned browser/context/server and free HTTP/inspector ports. I did not independently launch another server or browser.

The focused native report’s two inline JSON diagnostics were decoded only in memory. I independently compared complete Player Data, the other eight cache entries and the restored index record. All recorded preservation comparisons held. The negative diagnostic has root status 302, terminal status 200 and matching terminal SRI, while readiness remains false with `/index.html` missing.

The failed live report remains failed. Its global error is the runner’s “Testing stopped early after 1 maximum allowed failures” message. The pending corrected live run is not claimed as executed.

## 6. Findings

### T12-R5-SEC-01 — PWA build dependency chain retains the open SEC-F01 advisory follow-up

- **Disposition:** **OPEN**, continuing existing **SEC-F01**.
- **Native application severity:** **Info / dependency follow-up** for this bounded change.
- **Upstream severity:** **Moderate** for the new glob/minimatch advisory chain. The complete audit separately retains two inherited **High** package entries.
- **Shared gate:** **NON_BLOCKING**.
- **Confidence:** **High** for resolved versions, audit observations and the inspected current build path.
- **Newly demonstrated application exploit:** None.

#### Evidence and current scanner result

I ran the permitted bounded read-only command:

```text
npm.cmd audit --json --ignore-scripts --fetch-retries=0 --fetch-timeout=15000
```

The audit completed at approximately **2026-11-26T15:56:00.6195634Z**, process **25652**, with native **exit 1** and no audit transport error.

| Package entry | Audit severity | Relationship to Ticket12 |
| --- | --- | --- |
| `@vitest/mocker` | Moderate | Inherited test-tool chain |
| `vitest` | Moderate | Inherited |
| `vite` | High | Inherited |
| `zod` | High | Inherited |
| `glob` | Moderate | Added PWA build chain |
| `minimatch` | Moderate | Added PWA build chain |
| `workbox-build` | Moderate | Propagated dependency advisory |
| `vite-plugin-pwa` | Moderate | Propagated dependency advisory |

Total: **eight affected package entries, six Moderate, two High, zero Critical**. This is not eight independently demonstrated CrossDefense exploits.

The current lockfile and installed package metadata agree on:

- `vite-plugin-pwa` 2.0.0.
- `workbox-build` 7.4.1.
- `glob` 11.1.0.
- `minimatch` 10.2.6.

Precise locations: `package.json:25-37`; the corresponding `package-lock.json` `packages["node_modules/..."]` entries; installed package metadata; audit result above.

#### Reachable source, sink and existing controls

The build supplies fixed repository-controlled glob patterns and ignores to Workbox. Installed `getFileDetails` passes those values and the configured output directory to `globSync`, without an `AbortSignal`.

Source → sink:

```text
Trusted Vite/Workbox configuration
→ fixed glob pattern and ignore values
→ Workbox getFileDetails
→ globSync / pattern processing over build output
```

Evidence: `vite.config.ts:45-48`; installed `node_modules/workbox-build/build/lib/get-file-details.js:19-27`.

No path from browser messages, public gameplay input or local test-control payloads to those glob patterns or a cancellation-based traversal authority was found.

#### Impact and why the finding remains open

The affected versions remain installed. Their upstream availability advisories are unresolved dependency debt. A future tool accepting untrusted patterns or directory inputs, or relying on the affected cancellation behavior as a resource boundary, would require renewed applicability analysis.

The present fixed-pattern build path did not establish a new attacker-reachable application compromise, Player Data exposure or Security blocker. That bounded conclusion does not close the upstream advisories, reclassify the inherited High audit entries as harmless, or establish general release readiness.

#### Remediation target and validation

Carry SEC-F01 into a separately bounded dependency-maintenance change. Establish a compatible resolved tree that addresses the applicable advisories, then repeat:

- Resolved-tree and audit inspection.
- Production build and generated manifest/SRI verification.
- Native offline preparation, repair and update behavior.
- Relevant existing application and browser verification.

The audit’s suggested downgrades or version replacements were not applied or endorsed automatically.

No dependency was installed, upgraded or fixed; the lockfile remained unchanged. This report records neither user risk acceptance nor an approved blanket deferral.

### Lockfile provenance observations

Independent structural comparison against the original fixed point found:

- 334 added package nodes.
- No removed package nodes.
- One changed existing package version: `@types/estree`, 1.0.9 → 1.0.11.
- Integrity fields on every added node.
- `registry.npmjs.org` resolved URLs for every added node.
- No added node carrying `hasInstallScript`.

These observations support reproducibility and package-source review. They are not an exhaustive security audit of all transitive source.

## 7. Needs evidence and explicit limits

No unresolved candidate was identified that requires additional evidence to determine a new Security blocker in the examined Ticket12 change set.

The following limits remain material:

1. **The separate complete executable gate after R5 has not run.** This review does not replace typecheck, all intended headless/development/production cases, fresh default/A/B builds, deployment dry-run or the now twenty-case native selection.
2. **Corrected production verification remains pending.** I made no production request, accessed no provider account and did not independently reverify current provider settings or deployment state.
3. **Browser and hosting trust remain prerequisites.** Build-generated SRI verifies correspondence with trusted compiled metadata; it is not independent release signing against a malicious authorized build or compromised hosting authority.
4. **Same-origin compromise is not solved by these controls.** Retained-cache integrity headers and origin checks do not isolate arbitrary hostile code already granted the application origin.
5. **Storage is finite and evictable.** Retention, quota and eviction remain availability considerations. The bounded implementation does not promise unlimited historical caches.
6. **Indeterminate activation intentionally keeps the hold.** A permanently lost acknowledgment without a terminal native worker observation can leave the UI paused. Reopening writes merely because a notification deadline elapsed would violate the accepted boundary.
7. **Inherited application and dependency code were not exhaustively audited.** Unchanged collaborators were inspected where needed to trace Ticket12’s boundaries; the two inherited High audit entries remain disclosed.
8. **The 502 unrelated untracked paths were not examined.** No suspended provider-review, credential, orchestration, WFP/G-R/G-P or refused snapshot operation was attempted.
9. **No broad release or product acceptance is inferred.** Optional installation UI, full MVP completion, complete asset-rights acceptance, Ticket02/03 acceptance and general release readiness remain outside this verdict.

## 8. Review conduct and final verdict

This was an independent read-only Security review. No source or documentation edits, report writes, source snapshots, copied source bundles, exports, replacement on-disk source inventories, Git mutations, dependency installations, tests, builds, application servers, browser sessions, production requests or active exploitation were performed. The only scanner execution was the expressly permitted bounded `npm audit`, which returned **exit 1**.

The complete frozen source identity, HEAD, branch, empty index and unrelated-untracked count remained unchanged through the final check.

**Final native Security verdict: GREEN.**  
**Normalized result: PASS within the examined Security scope.**

The complete current Ticket12 review found no new confirmed application vulnerability or Security blocker. The final canonical-index repair preserves strict redirect rejection, manifest-owned URL/key/SRI authority, cache isolation and Player Data boundaries.

**T12-R5-SEC-01 / SEC-F01 remains Open and non-blocking. The audit is not clean, and no dependency-risk acceptance is inferred.**

**The separate full post-R5 executable gate and corrected production verification remain pending.**