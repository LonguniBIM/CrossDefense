# Ticket12 R4 — Independent Security Review

**Security verdict: GREEN**  
**Axis result: PASS within the reviewed scope**  
**Blocking security findings: 0**  
**New confirmed application vulnerabilities: 0**  
**Retained non-blocking dependency follow-up: SEC-F01 — OPEN**

This is a fresh full Security review of the Ticket12 changes against the original fixed point. I independently inspected the current implementation, relevant unchanged storage and content owners, installed dependency code, generated production bytes, and native verification reports. Earlier review verdicts were not used as evidence of current security correctness.

The separate complete executable gate after R4 remains pending. This Security verdict does not establish integrated verification PASS, user acceptance, publication authority, or deployment readiness.

## 1. Scope, authority, and frozen identity

**Mode:** Full diff review against the original fixed point, including tracked changes and all identified untracked Ticket12 files.

**Checkout:** `D:\01_DCMvn\Workspace\CrossDefense`  
**Device:** `DESKTOP-DBD6QJO`  
**Branch:** `feature/ticket12-offline-recovery`

**Original fixed point and current HEAD:**

`0fd3f7bf67c1662f01d8449f4623518b69f06a92`

I independently verified the supplied freeze at both review boundaries:

| Verification | UTC |
|---|---|
| Start | `2026-11-26T13:04:26.1554280Z` |
| End | `2026-11-26T13:10:34.8065777Z` |

| Frozen set | Count | SHA-256 at both boundaries |
|---|---:|---|
| Complete R4 payload | 40 | `d68a5c6b64027f73dc05df73cddd84dd82e02b4babbcf70611c12384d08436f1` |
| Executable/configuration subset | 24 | `dc30bd59c97de7041999415ccdc1654b516fa46243e9a8e4abb414ae49657dc8` |
| Original executable/configuration subset, excluding the newly changed existing Ticket06 test | 23 | `636ccebc32d53478d7375e1c9b630d87a8ebcb1d5f927c128e69da5248b89f4e` |

The calculation used Windows PowerShell `Sort-Object` ordering and the specified concatenation: relative path, NUL, lowercase SHA-256 of raw file bytes, LF, then SHA-256 of the complete UTF-8 text. No source inventory or snapshot was written to disk.

The final check also confirmed:

- HEAD and the original fixed point still match.
- The index contains zero changes.
- There are zero commits after the fixed point.
- There are 31 in-scope untracked paths and 502 unrelated untracked paths.
- There are no tracked changes outside the frozen scope.
- `git diff --check` returned exit 0. Git separately printed its existing line-ending conversion warnings.

Authority was established from `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, the active Ticket12 plan, `TICKET12_OFFLINE_CONTRACT.md`, Ticket12 in `IMPLEMENTATION_BREAKDOWN.md`, ADR 0009, and the relevant technical/deployment requirements. Ticket12 remains development-only, with user acceptance Pending and publication unauthorized.

### Security-relevant coverage

The review covered all changed runtime and build surfaces:

- `vite.config.ts`, `package.json`, and `package-lock.json`.
- `src/sw.ts` and the offline protocol.
- `BrowserOfflineRuntime.ts`.
- The changed bootstrap, navigation, content recovery, update-admission, and reload paths in `src/main.ts`.
- The Build application update hold.
- The delivery-status presentation and CSS.
- The owned production server and both Ticket12 Playwright configurations.
- All four native Ticket12 test files, the new headless update-boundary file, and the Ticket12 fixtures.
- The R4 change to the existing Ticket06 geometry test.
- Current authority and verification documentation relevant to Security.

Supporting unchanged owners were inspected where needed: content validation/activation, immutable identity retention, render-body storage, Workspace locking, and Player Data storage boundaries. Historical review documents were not treated as replacement evidence, and no current R4 peer findings were read.

## 2. Project security profile

CrossDefense is a browser-local game distributed as static application resources. The assets relevant to this change are authoritative Player Data, immutable Run/content identities, the integrity and coherence of executable application resources, and availability of offline recovery.

Ticket12 introduces a persistent browser delivery component with Cache Storage and service-worker control capabilities. It does not introduce cloud accounts, a remote Player Data API, external synchronization, or a new authorization model. The governing separation is that delivery resources and content bodies are replaceable, while `crossdefense-player-data` remains authoritative. This is explicit in ADR 0009 and `docs/architecture/TECHNICAL_ARCHITECTURE.md:133-149`.

The review considered different-origin messages, malformed worker requests, missing or corrupted delivery bytes, faulty downloads, update/control races, concurrent windows, pending local operations, and requests to the development test server. Arbitrary code execution already obtained within the application origin, a compromised browser profile, and a malicious authorized deployment are outside the protection provided by this feature.

## 3. Trust boundaries checked

| Boundary | Source and sensitive operation | Result |
|---|---|---|
| Build inputs → production delivery manifest | Build identity, output enumeration, required pack inclusion, generated SHA-256 integrity | PASS; fixed inputs, explicit required-pack checks, verified generated bytes |
| Page → service worker | Request payload and actual client identity → cache repair, claim, activation | PASS; schema, origin, live client, window type, scope, and relevant build checks |
| Cached/network response → trusted delivery response | Response bytes → cache readiness and returned resources | PASS; expected integrity and bounded validation; repair uses immutable worker manifest |
| Update UI → native worker lifetime → reload | Pending operations and user intent → `skipWaiting`, completed activation, reload | PASS; synchronous admission and retained hold through indeterminate activation |
| Replaceable storage → authoritative Player Data | Cache/content repair and update → local save integrity | PASS; distinct owners and stores, with no worker Player Data deletion or migration path |
| Content candidate → active/LKG/pinned content | Candidate bytes and version → publication or restoration | PASS; existing validation and immutable identity owner retained |
| Local HTTP request → test server filesystem/control | URL/token/body → compiled-file read or bounded fault selection | PASS within owned loopback testing scope |

### 3.1 Worker message validation and control authority

`src/sw.ts:147-154` rejects null values, arrays, unexpected properties, invalid build-identity types/formats, and unsupported command types. State-changing requests require a build identity.

The message handler requires a reply port, validates the event origin, resolves the claimed source through `self.clients.get`, and checks that the actual sender is a same-origin, in-scope window. The relevant checks are in `src/sw.ts:162-179`.

For activation or claim, the worker additionally checks the requested build identity, serializes control changes, verifies required cached bytes, and checks the native window list including uncontrolled windows. `CLAIM_CURRENT` refuses a sender already controlled by a worker before invoking `clients.claim`. These controls appear in `src/sw.ts:181-200`.

`CHECK_CACHE` intentionally permits querying a worker whose build differs from the current page. That supports inspection of a waiting candidate; the response identifies the worker’s build, and the page checks it before treating the current application as offline-ready. It is not an activation authorization bypass.

No caller-provided resource URL, cache key, digest, database name, or filesystem path is accepted by the worker protocol.

The scope check is appropriate for the configured root deployment. This conclusion does not assume that origin checks would isolate a hostile application deliberately hosted under the same root origin.

### 3.2 Cache integrity, repair, response limits, and retained assets

The current build’s expected integrity values originate from the compiled precache manifest. `cacheWillUpdate` verifies bytes before accepting a response and records the expected integrity; `cachedResponseWillBeUsed` verifies cached responses before use. Readiness separately walks every required manifest entry and verifies the actual stored bytes. See `src/sw.ts:11-30` and `src/sw.ts:78-103`.

The body reader checks both declared size and accumulated streamed bytes against 16 MiB. Invalid status, missing or malformed expected integrity, read failure, and digest mismatch cannot establish readiness. This is a bound on the application’s validation reader; it is not a claim that every internal browser allocation or native Fetch/SRI buffering operation is globally memory-bounded.

Explicit repair is restricted to missing resources from the worker’s own immutable manifest. It rechecks same-origin/scope constraints and uses `redirect: 'error'`, same-origin credentials, a cancellation signal, and the manifest’s cache key and integrity. The caller cannot select a resource. See `src/sw.ts:113-137`.

Installed Workbox code confirms that this use of the precache strategy carries the manifest integrity into the network request and only repairs its cache under the integrity conditions implemented by `PrecacheStrategy`. I also verified that the installed controller’s install and activate methods own their `event.waitUntil` calls; the short event handlers in `src/sw.ts:50-51` therefore do not omit the required lifecycle extension.

The retained-resource route is constrained to same-origin version-addressed JS/CSS under `assets/`. It compares the exact requested URL to a retained cache entry and verifies that entry’s bytes. Unknown resources fall through to ordinary fetch behavior; this route does not provide a source-file or generic navigation fallback. See `src/sw.ts:32-49`.

For older retained entries, the stored integrity header is provenance within same-origin Cache Storage, not an independent signature against an attacker who already has arbitrary same-origin cache-writing authority. No newly reachable external cache-poisoning path was established.

### 3.3 Safe activation, claim, multi-window behavior, and operation lifetime

There is no unconditional `skipWaiting`, unconditional `clients.claim`, or automatic play-time reload.

The host’s admission check requires Workspace ownership, validated local content, no pending entry operation or Start Run request, no pending Settings save, no open dialog, and an accepted entry or acknowledged Build boundary. `applyAppUpdate` synchronously freezes the Build when applicable and makes the root inert before awaiting the worker. See `src/main.ts:80-100`.

The Build hold is enforced at the application command boundary, not solely by disabled controls. It excludes opening, queued edits, pending acknowledgments, Attempt startup, and another App update. A token prevents a stale release callback from releasing a later hold. See `src/application/build/BuildApplication.ts:25-30,87-119`.

`activateAndObserve` keeps the hold through the notification deadline. A 15-second deadline changes status text; it does not cancel native activation or release the admitted boundary. Successful acknowledgment still waits for the native `activated` state. An `activating` worker takes precedence over a late contradictory refusal. See `BrowserOfflineRuntime.ts:235-278`.

The worker’s second-window guard is separately enforced through the native client list. The implementation does not pretend that an observed client list is a permanent reservation against every subsequently opened window. Retained version-addressed resources, the absence of unconditional claim, and the existing Workspace lock preserve the intended boundaries for that race.

### 3.4 Content Retry and authoritative state

The current Content Retry implementation retains an operation count until the complete admitted chain settles, including readiness reconciliation and Build/Review re-entry. Navigation invalidates the originating screen before the chooser read yields. Epoch and captured-owner checks prevent stale continuation from initiating later content work or replacing the current screen. An already-started operation is awaited rather than treated as canceled merely because the user navigated away. See `src/main.ts:533-644`, together with the awaited `renderPilotRun` and `renderRunProjection` paths.

Content activation remains owned by `ContentPackApplication`. Invalid candidates return without activation; restoration validates the requested pinned version; subsequent reads validate the body and compare its digest against the retained expected identity. See `ContentPackApplication.ts:16-50`.

The existing content repository continues to retain active/LKG pointers and immutable digests. Render bodies remain in `crossdefense-render-content-bodies`, separate from `crossdefense-player-data`. No cache repair operation erases the Player Data database, creates a replacement Workspace, changes Run pins, or introduces a save migration. Relevant evidence includes:

- `LocalStorageContentPackRepository.ts:37-70`.
- `RenderPackBodyStore.ts:9-34`.
- `DexieWorkspaceRepository.ts:39`.
- `WorkspaceWriteLock.ts:22-67`.
- `src/main.ts:652-701`.

The new delivery UI writes variable messages and build identifiers through text APIs. Its `innerHTML` template is static; it does not interpolate worker-supplied text into executable markup. See `OfflineStatusView.ts:20-30,50-76`.

### 3.5 Owned test server and fixture exposure

The test server binds to `127.0.0.1`. Its configured roots are resolved from trusted test-process configuration, and requested targets are checked using `realpath` and relative-root containment before file serving. Directories and unresolved paths return 404. See `scripts/testing/ticket12-production-server.mjs:7-16,46-85`.

Controls require the ephemeral bearer token and POST, limit payload bytes, allow only the configured build variants, bound the failure-path lists, and restrict corrupted responses to exact pack-manifest paths. The token is supplied by the Node-side test fixture and is not injected into the page. See server lines 18-43, `playwright.ticket12.config.ts:6`, and `tests/ticket12ServerControl.ts:9-18`.

The configurations use owned loopback origins and refuse existing-server reuse. The native Ticket12 suite permits real service workers; the separate legacy regression suite blocks them to preserve its existing response-interception seam. That distinction is explicit and does not substitute mocked registration for the native offline evidence.

The delayed-lifetime and acknowledgment fixtures operate on disposable test contexts. They preserve the real native operations/events and are absent from the inspected production bundle. They were not treated as ordinary user data or production hooks.

## 4. Independent generated-artifact verification

I parsed the existing compiled worker without executing it and recomputed every manifest entry’s SHA-256 against the actual file bytes.

**Observed build ID:**

`0.1.0-2026-11-26T12-48-19-375Z-0d536d02`

Results:

- All **9 of 9** precache entries match their embedded SHA-256 integrity.
- All six required pack manifests are present.
- The rendered manifest is **14,006,431 bytes**.
- The Review manifest is **14,006,953 bytes**.
- Every precache entry is below **16,777,216 bytes**.
- The generated HTML references the existing precached JS and CSS assets.
- The application JS contains the same build identity as the worker.
- The output contains **10 regular files and 9 directories**.
- The inspected application assets and worker do not contain the Ticket12 control token variable or the content-retry/lifetime fixture markers.

I also compared the current production JS/CSS with the retained `build-r3-2-a` and `build-r3-2-b` variants. The JS is byte-identical after substituting only the build-ID string, and the CSS is identical. This supports use of the existing native evidence for the unchanged production implementation. It does not claim that the new complete post-R4 gate has run.

## 5. Findings

### SEC-F01 — New PWA build dependency chain retains availability advisories

**Disposition:** OPEN  
**Application severity:** Info for this bounded change  
**Upstream severity:** Moderate for the two underlying new dependency advisories  
**Confidence:** High for affected versions and the inspected build path  
**Gate:** NON_BLOCKING

#### Evidence

The current resolved chain includes:

- `vite-plugin-pwa` **2.0.0**.
- `workbox-build` **7.4.1**.
- `glob` **11.1.0**.
- `minimatch` **10.2.6**.

`vite.config.ts:45-48` supplies fixed repository patterns and ignores. Installed `node_modules/workbox-build/build/lib/get-file-details.js:19-27` passes those values to `globSync` over the configured output directory. That call does not supply an `AbortSignal` or cancellation budget.

The maintainer’s glob advisory concerns traversal continuing after cancellation when an application relies on that cancellation to bound work over attacker-influenced inputs. The minimatch advisory concerns amplification from attacker-controlled patterns. Those prerequisites were not established in the current fixed-pattern Ticket12 build path. genui{"citation":{"refs":["turn224715068view0","turn224715068view1"]}}

Primary references:

- [glob cancellation advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4).
- [minimatch pattern amplification advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249).

#### Asset and trust boundary

Build-tool availability and resource use when configuration or directory inputs enter filesystem traversal and pattern processing.

#### Practical exploit prerequisites and impact

An applicable path would require attacker influence over relevant patterns or directory inputs, with the affected cancellation behavior used as a resource boundary for the glob advisory. The present build uses trusted fixed configuration; it exposes neither a browser-supplied glob pattern nor a remote traversal service.

No new browser-runtime exploit, Player Data compromise, or release-blocking application path was established. Future tooling that accepts untrusted build patterns or relies on cancellation budgets could change that conclusion.

#### Remediation target and validation

Resolve the chain through a bounded compatible dependency-maintenance change. Verify the resolved tree and audit result, production build, generated integrity manifest, and native offline/update behavior after that change.

Recommended tracking point: the next authorized dependency-maintenance phase, with applicability reassessed before publication. This is not recorded as accepted risk, an approved deferral, or a new Ticket12 blocker. Retaining vulnerable packages leaves dependency debt; expanding their input trust surface could make that debt materially more significant.

### Fresh audit observation

I independently ran read-only `npm audit --json --ignore-scripts`. The npm audit result was **exit 1**, with:

| Package entry | Audit severity | Relationship to Ticket12 |
|---|---|---|
| `@vitest/mocker` | Moderate | Inherited test-tool chain |
| `vitest` | Moderate | Inherited |
| `vite` | High | Inherited |
| `zod` | High | Inherited |
| `glob` | Moderate | Added PWA build chain |
| `minimatch` | Moderate | Added PWA build chain |
| `workbox-build` | Moderate | Propagated dependency advisory |
| `vite-plugin-pwa` | Moderate | Propagated dependency advisory |

This reproduces the recorded **8 package entries: 6 Moderate, 2 High, 0 Critical**. The count includes propagated entries; it is not eight independently demonstrated CrossDefense exploits.

The lockfile comparison found 334 added package nodes, no removed nodes, and one changed existing package version: `@types/estree` from `1.0.9` to `1.0.11`. All added nodes have integrity fields and registry.npmjs.org package URLs; none carries an added `hasInstallScript` flag. These are useful integrity observations, not a claim that every transitive package’s source has been exhaustively audited.

No dependency was installed, upgraded, fixed, or otherwise modified. The inherited High audit entries remain disclosed; this diff review does not reclassify them as remediated or accepted.

## 6. Verification evidence inspected

I did not execute tests, builds, application servers, or browsers. I inspected existing reports and selected native diagnostic attachments.

| Evidence | Independently observed result |
|---|---|
| `r2-remediation-full-01/browser-results.json` | 19 tests, 19 single passed results, four files, one worker, retries 0, repeat 1, zero skipped/flaky/global errors; duration 192,381.885 ms |
| Native activation lifetime attachments | Holds observed for 16,515 ms before `skipWaiting`, 16,523 ms during activation, and 16,508 ms before genuine multi-window refusal; root remained inert |
| Native Content Retry attachments | Trusted native content completion held after Back; no stale Review write; canceled operation drained; genuine Review preparation acknowledgment separately exercised |
| Native waiting-cache attachment | One entry removed from the waiting build, current build retained, waiting build reported the exact missing pack |
| Native offline parity attachment | Browser and headless digests both `c5462479c310b8e1a813f68fba5da1c450bcd53f065e1570bdc76f8282efb7dc`; explicit exclusion is `recordedAt` wall-clock metadata |
| `final-headless-03/headless-results.json` | 336/336 passed in 37 files, including all four Ticket12 update-boundary cases |
| `final-development-03/browser-results.json` | 217/217 single passed results in 36 files; zero skipped/flaky/global errors |
| `final-production-03/browser-results.json` | 129 passed, 1 failed, 130 single results; the CS06-03 geometry failure remains a failed complete run |
| `r4-map-ready-green-01/browser-results.json` | 15/15 single passed results in the affected Ticket06 file, one worker, retries 0, repeat 1, zero skipped/flaky/global errors; duration 50,867.496 ms |

The earlier failed headless report also remains present at 335/336. These results were not combined into a fictitious complete-gate PASS.

The R4 test diff adds an exact `Map and difficulty` heading-visibility assertion and explanatory comment before the existing geometry loop. It does not relax the viewport bounds, remove geometry assertions, change production code, alter dependencies, or change timeouts. This change introduces no new security-sensitive runtime surface. Evidence: `tests/e2e/ticket-06-ui.spec.ts:195-200` and its diff against the original fixed point.

The detailed native failure-trace interpretation for the previous Map case was supplied in the current verification record and orchestrator brief. I independently checked the failed report and correction, but did not re-decode that trace in this Security pass.

## 7. Needs evidence and explicit limits

No unresolved candidate requiring additional evidence was identified as a potential new Security blocker within this scope.

The following limits remain:

- The fresh complete ordered executable gate after R4 has not run.
- The underlying cause of the earlier broader timing slowdown remains unproven; no attacker-driven security consequence was established from that evidence.
- Browser storage eviction and quota behavior can still affect offline availability. Conservative retention is the accepted bounded policy, not a guarantee of unlimited storage.
- SHA-256 checks establish correspondence with trusted compiled metadata. They do not authenticate a malicious authorized release independently of its hosting/build trust.
- The retained-cache integrity metadata is not a defense against arbitrary code execution already obtained within the same origin.
- This was not a comprehensive security audit of all inherited application code or every transitive dependency.
- Production hosting configuration, provider accounts, CI secrets, real browser profiles, and production Player Data were not accessed or tested.
- No active exploitation, scanner-driven attack, external provider review, installation UI assessment, or production rollout assessment was performed.
- The 502 unrelated untracked paths and suspended operations were outside the review.

## 8. Review conduct and final verdict

The review was read only. No source or documentation file was edited, no report was written by this reviewer, and no source snapshot, bundle, export, replacement inventory, stage, commit, push, merge, deployment, dependency mutation, test run, build, or server launch occurred. No credentials or normal browser data were read.

The frozen payload remained unchanged from entry through the final verification.

**Final Security verdict: GREEN / PASS within the reviewed scope.**

The full review against the original fixed point found no confirmed new application vulnerability or Security blocker. **SEC-F01 remains OPEN and non-blocking**, with the fresh audit accurately retained as eight package entries, including two inherited High entries.

**Integrated verification, user acceptance, and publication remain separate. The complete post-R4 executable gate is still pending, user acceptance remains Pending, and publication remains unauthorized.**