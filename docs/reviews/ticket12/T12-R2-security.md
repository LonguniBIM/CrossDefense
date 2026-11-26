# Ticket12 — Final Full Independent Security Review T12-R2

**Native verdict: GREEN. Normalized verdict: PASS for the reviewed Security axis.**

**Confirmed new security vulnerabilities: 0. Security blockers: 0.**

The current Ticket12 implementation preserves the security boundaries examined in this full review against the original accepted Ticket11 baseline. The earlier exact-tile Build proof gap is resolved by the completed native case and the combined 17-case run. The non-blocking dependency follow-up remains open and disclosed.

**The separate final ordered executable gate remains pending.** This Security-axis result does not establish Ticket12 integrated verification PASS, user acceptance, publication authorization, production approval, or general release readiness.

## 1. Scope, identity and independence

**Mode:** Full scoped diff review of Ticket12 against the original accepted baseline, including its relevant tracked changes and assigned untracked additions. This was not restricted to the R1 remediation delta.

| Identity | Observed value |
|---|---|
| Device | DESKTOP-DBD6QJO |
| Device ID | `0bfdbd88-da2a-400d-b6cc-0951271002c5` |
| Repository | `D:\01_DCMvn\Workspace\CrossDefense` |
| Branch | `feature/ticket12-offline-recovery` |
| Original and current HEAD | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Frozen set | 31 explicitly assigned paths |
| Independent freeze verification | `2026-11-26T11:25:44.7612484Z` |
| Aggregate SHA-256 | `765addf4c46bf9f982b1c1ac7ceef305e602a6a510790efbeb08f3655b8b8e6f` |
| Index changes | 0 |
| Current untracked count | 525, consistent with the recorded 502 pre-existing paths plus 23 task additions |

The aggregate was computed entirely in memory using the assigned convention: PowerShell `Sort-Object` culture order, relative path followed by NUL, lowercase SHA-256 of raw file bytes and LF, followed by UTF-8 outer SHA-256. The result matches the supplied R2 freeze.

Repository source and generated artifacts were read only on the authorized Windows device. No files were written. No source snapshots, exports, copied source bundles or replacement disk inventories were created. No tests, builds, audit commands, browsers, active exploits, provider reviews, Git publication actions, deployment actions or production configuration changes were executed.

The historical **R1 Security report** was read for disposition tracking. No current R2 peer report was read or solicited; the current source paths and evidence were evaluated independently.

## 2. Project security profile

The protected assets are authoritative browser-local Player Data, acknowledged Build operations and history, immutable content identities and Run pins, the validated Last Known Good content registry, and a coherent application build capable of completing the offline slice.

The new trust boundaries are:

- Browser-window messages entering a service worker with cache and lifecycle capabilities.
- Network/cache bytes entering the executable offline delivery path.
- Application lifecycle admission leading to explicit activation and reload.
- Replaceable delivery caches interacting with the existing authoritative persistence and content owners.
- Loopback HTTP request paths and test controls reaching compiled files and fault-selection state.
- New dependency resolution entering the build and bundled worker paths.

The relevant threat model includes unrelated origins, malformed control input, corrupted or incomplete delivery resources, and request-controlled paths into the test server. Arbitrary same-origin JavaScript execution already carries access to that origin’s browser stores; that prerequisite alone was not treated as a new Ticket12 vulnerability.

## 3. Examined scope

| Area | Material examined |
|---|---|
| Authority and accepted requirements | `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, invariant guidance, Ticket12 plan/contract/verification, relevant implementation specification and breakdown, UX error/update requirements, technical/platform architecture references, testing strategy and ADR 0009 |
| Production delivery | `vite.config.ts`, `src/sw.ts`, offline protocol, `BrowserOfflineRuntime.ts`, `OfflineStatusView.ts`, `offline.css` |
| Application admission and persistence interaction | Original-baseline diff and relevant current host paths in `src/main.ts`; complete `BuildApplication.ts`; supporting `WorkspaceApplication`, `SettingsApplication`, `ContentPackApplication` and `LocalStorageContentPackRepository` |
| Dependencies | Complete structural old/current lockfile comparison; package sources, integrity and install-script metadata; installed Workbox precache strategy/controller, routing initialization/cache listener, and build glob call |
| Local testing surfaces | Both Ticket12 Playwright configurations, production server, three Ticket12 E2E files, headless update-boundary tests and the assigned scenario/control/update/lifetime helpers |
| Generated artifacts | Current `dist/sw.js` and its nine manifest-referenced assets; corresponding manifests/assets in `build-r2-a` and `build-r2-b` |
| Existing executable evidence | Raw `r1-remediation-full-01/browser-results.json`, bounded in-memory decoding of relevant native attachments, existing audit output and historical R1 Security dispositions |

Historical peer-review document contents were not used as a basis for the Security verdict. Their assigned files remained covered by the frozen-set identity.

## 4. Trust boundaries and source-to-sink results

| Boundary | Source → sink and verified controls | Result |
|---|---|---|
| Window → application worker commands | `src/sw.ts:147–174` rejects invalid shapes/extra fields, constrains build identities, checks `event.origin`, resolves the source through `clients.get`, and requires an in-scope window and reply port. | PASS |
| Worker request → activation/claim | `src/sw.ts:156–204` checks exact build identity, serializes control transitions, verifies current required cached bytes and requires the sender to be the only in-scope window before the lifecycle action. | PASS |
| Repair command → network/cache write | `src/sw.ts:106–139` accepts a build identity, then enumerates the contacted worker’s own manifest. The caller cannot supply URLs, cache names, keys, integrity values or replacement bodies. Requests remain same-origin/in-scope, reject redirects, use the Workbox strategy’s exact cache key/integrity and have a 12-second request budget. | PASS |
| Network/cache body → readiness or executable response | `src/sw.ts:16–27,53–104` checks response status, digest format, actual bytes and the 16 MiB body limit. Required readiness derives from the manifest and stored responses, not a readiness flag or cache name. | PASS |
| Current build → staged build | `BrowserOfflineRuntime.ts:98–174` distinguishes candidate identity from candidate readiness and repairs the installed waiting worker’s own cache. An incomplete candidate keeps Retry available and Apply unavailable. | PASS |
| Application boundary → reload | `src/main.ts:79–103` requires Workspace ownership, local validated content, entry/Build admission, no pending entry/Run work, no pending Settings save and no open dialog. It synchronously holds Build and makes the root inert before awaiting worker activation. | PASS |
| Build command → durable write | `BuildApplication.ts:101–124` synchronously excludes queued, pending, opening and Attempt-transition states, rejects edits while held, and uses a unique release token so an old callback cannot release a later hold. | PASS |
| Outstanding activation → release of admission | `BrowserOfflineRuntime.ts:175–205,238–278` waits for native `activated`, definitive refusal or `redundant`. The 15-second deadline changes status only. An indeterminate result remains held. | PASS |
| Background refresh → transition state | Inspection rechecks applying state after awaits, and pending/refusal text is preserved. Refresh cannot release the host’s admitted Build/UI boundary. | PASS |
| Retained cache → older executable resource | `src/sw.ts:32–49` restricts the route to same-origin hashed JS/CSS under `assets/`, compares exact normalized URLs and checks bytes against the recorded integrity header. There is no general navigation/source-file fallback. | PASS within the stated threat model |
| Delivery cache → Player Data/content registry | New worker code operates on Cache Storage and worker control. Content validation, immutable identity checks, active/LKG publication and native Player Data remain with their existing owners. | PASS |
| HTTP URL → filesystem | Server `:48–81` parses/decodes the URL, resolves real paths, checks containment using `relative` and Windows separators, requires an actual file and returns ordinary 404s. | PASS |
| HTTP caller → fault-selection controls | Server `:19–43,85` binds loopback and requires the per-run bearer token, POST, bounded JSON and bounded predefined variant/fault inputs. Test configuration refuses existing-server reuse. | PASS |
| Dependencies → build/runtime authority | Exact direct pins are maintained; new lock entries use npm HTTPS sources and integrity metadata. The new advisory path reaches trusted fixed build glob patterns. | Non-blocking dependency follow-up |

### Important limits on these conclusions

The retained-cache integrity header is **not an independent authenticity root**. Its protection derives from insertion using the build manifest’s digest and checking those bytes again on retrieval. An actor capable of replacing both cache bodies and headers through arbitrary same-origin script already possesses broader origin authority.

The installed Workbox router also registers its standard `CACHE_URLS` listener. I inspected that path rather than assuming the application command validator controls every library message. It routes requests through the registered route handlers; it does not introduce an activation command, Player Data operation, arbitrary filesystem operation or unrestricted cross-origin fetch route in this configuration. No new cross-boundary exploit was established from that listener.

The 12-second timer applies to repair requests. It is not described here as a universal deadline for every browser storage operation or every possible worker lifetime.

## 5. Generated artifact verification

I independently parsed the injected manifest and recomputed the SHA-256 of each referenced compiled file directly on the authorized device.

| Artifact | Build identity | Entries checked | Matching integrity values | Within 16 MiB |
|---|---|---:|---:|---:|
| Current `dist` | `0.1.0-2026-11-26T11-13-51-452Z-e25656a4` | 9 | 9 | 9 |
| `build-r2-a` | `ticket12-a` | 9 | 9 | 9 |
| `build-r2-b` | `ticket12-b` | 9 | 9 | 9 |

Each contains index HTML, application JS, CSS and all six required immutable pack manifests. The two largest manifests are **14,006,953** and **14,006,431** bytes. All three worker outputs contain the repair command.

Thus, **27 of 27 referenced compiled assets match their injected integrity values**. This verifies the artifacts currently present; the subsequent mandatory final build and executable gate remain separate work.

## 6. Existing native proof independently checked

The raw combined report at:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r1-remediation-full-01\browser-results.json`

contains **17 tests in three files**, with exactly one passed result for each test, one worker, zero retries, one repeat, zero skipped/unexpected/flaky tests and zero global errors. Its reported duration is **182,940.003 ms**.

The evidence was read and decoded in memory; no test was rerun by this reviewer.

### Activation lifetime

The decoded attachments establish the relevant native states and durable effects:

| Scenario | Observed elapsed hold | Native state while held | Durable-input result | Terminal result |
|---|---:|---|---|---|
| Before original `skipWaiting` | 16,522 ms | B still installed; original native call count 0 | Root inert; Undo/Map inputs leave the complete native save equal to the acknowledged save; receipt count remains 1 | Original native call runs once; B reaches activated; explicit reload opens B |
| During real activation | 16,513 ms | Active/controller genuinely activating | Root inert; same document and Build; complete save unchanged by native Undo/Map input | B reaches activated; explicit reload opens B |
| Before actual window-list check | 16,509 ms | B installed; actual check still deferred | Root remains inert until the genuine result | Two-window refusal releases the same document/Build; refusal text is visible; Undo then creates the expected second receipt |

The fixture delays original native operations or extends the actual activation event. It does not fabricate cache proofs, worker states, refusal outcomes or native save results. This distinction is supported by the inspected fixture and completed assertions in `ticket-12-update-lifetime.spec.ts:36–152`.

### Repair, storage and content protection

The completed native selection also covers:

- Removal of one required response from **B’s cache only**, followed by actual refusal, visible Retry, repair of the **same installed waiting worker and unchanged script**, successful activation and offline pinned-Run continuation.
- Active-cache corruption revoking readiness and repair preserving Player Data and content registry.
- Real initial/candidate HTTP failure and native quota exhaustion preserving the current build and saved Pilot.
- Native failed Build and Settings writes excluding activation until Retry succeeds.
- Second-window refusal followed by successful explicit activation after the other window closes.
- Genuine Combat continuing on A while B stages, followed by safe Build activation with retained old content pins.
- Invalid content retaining Last Known Good; genuinely missing pinned content retaining the Run in Content Required.
- Offline interruption preserving four committed payloads at tick 15, one interrupted outcome, unchanged economy and no Review occurrence.
- Actual controlling-worker requests returning **404** for the missing path, `/src/main.ts`, `/.env` and `/.git/config`.

These results support the reviewed boundaries. They are not represented as completion of the later full ordered gate.

## 7. Findings and prior dispositions

### Confirmed product-security findings

**None.**

No reachable new Critical, High, Medium or Low vulnerability was established within the reviewed Ticket12 scope. There is therefore no confirmed vulnerability requiring an exploit-path, remediation or regression entry beyond the separate follow-up below.

### SEC-P01 — Exact-tile Build preservation proof

**Disposition: resolved at the affected-case and combined native-suite level.**

- **Category:** Historical proof gap; not a confirmed production vulnerability.
- **Confidence:** High.
- **Current evidence:** `tests/e2e/ticket-12-updates.spec.ts:196–231` and its single completed PASS result in the raw combined report.
- **Correction:** The test identifies `combat-run:starter:0`, verifies A3 is empty, retains the count of eight tiles, checks revision 5 and one Build receipt, then completes activation/reload and compares the complete native state with the acknowledged state.
- **Gate consequence:** The earlier unexecuted final-activation branch no longer remains an affected-case proof gap. The mandatory final integrated gate is still pending and is not waived by this disposition.

### SEC-F01 — New PWA build dependency chain retains known availability advisories

**Disposition: open, non-blocking dependency follow-up.**

- **Application severity:** Info for this bounded change.
- **Upstream severity:** Moderate for the two new underlying advisories.
- **Confidence:** High for the resolved versions and inspected call path.
- **Gate:** Non-blocking Security follow-up; no audit-clean or user risk-acceptance inference.
- **Components:** `glob 11.1.0`, `minimatch 10.2.6`, `workbox-build 7.4.1`, `vite-plugin-pwa 2.0.0`.
- **Source → sink:** Fixed repository glob/ignore patterns in `vite.config.ts:45–48` flow to `node_modules/workbox-build/build/lib/get-file-details.js:19–27`, which invokes `globSync` over the configured build directory.
- **Reachability assessment:** This inspected path accepts no web/user-supplied glob pattern and does not rely on an AbortSignal to enforce a traversal budget.

The upstream glob advisory concerns filesystem work continuing after cancellation. The minimatch advisory concerns attacker-controlled pattern amplification. Those required attacker/budget conditions were not found in the current Ticket12 build path. genui{"citation":{"refs":["turn376684144view0","turn376684144view1"]}}

- **Current impact:** No browser-runtime exploit or Player Data consequence was established. The exposure becomes relevant if future tooling introduces untrusted patterns/directory inputs or relies on the affected cancellation behavior.
- **Remediation target:** Track a compatible bounded upstream dependency update.
- **Regression proof for that maintenance:** Recheck the exact resolved tree and advisories, then verify production build, complete integrity manifest and actual offline/update behavior.
- **Current action:** No forced update, unrelated upgrade or audit fix was performed.

The successful whole-lockfile comparison found **334 added package locations**, one changed existing version (`@types/estree 1.0.9 → 1.0.11`), no new non-npm resolved source, no new missing integrity metadata and no newly added entry declaring `hasInstallScript`.

The existing audit remains **eight vulnerable package entries: two High and six Moderate**. Inherited Vite, Vitest, `@vitest/mocker` and Zod findings remain disclosed; the four new chain flags are glob, minimatch, Workbox build and the PWA plugin. The inherited `zod 4.6.5` pin remains below the advisory’s fixed `4.6.6`, with the reported concern involving excessive memory consumption during collection validation. No newly exposed attacker-controlled collection-validation endpoint was established in Ticket12. genui{"citation":{"ref":"turn223364255view2"}}

## 8. Needs evidence and residual limits

There is **no unresolved candidate vulnerability that makes the examined Security scope incomplete**.

The following remain outside this verdict or limit its interpretation:

- **Final ordered execution is pending:** fresh typecheck, full intended headless selection, 217 development regressions, production build, deployment dry-run, 130 production regressions and 17 native service-worker cases. Existing focused or combined runs are not stitched into that final-gate claim.
- No active malformed-message, cross-origin, traversal, token-guessing or resource-exhaustion attack was performed. Those controls were assessed through their source paths.
- The native evidence inspected is Chromium evidence. Other browser implementations, eviction behavior and lifecycle edge cases were not independently exercised.
- A permanently indeterminate activation intentionally keeps the admitted UI/Build held. The implementation does not guess that an unacknowledged native operation was canceled.
- Earlier application subsystems were examined where needed to follow the new boundaries; this is not a new security audit of every pre-existing gameplay, persistence or dependency implementation.
- The conservative retention policy continues to retain earlier build caches and shipped content. Future storage growth and cleanup policy remain separate work.
- Production Cloudflare settings and live behavior were neither rechecked nor changed. The accepted Ticket11 deployment is not evidence of Ticket12 deployment readiness.
- The manifest hashes establish integrity relative to the trusted build output. They do not establish independent signing provenance or protect against an actor already controlling the origin’s deployed code.
- The disclosed dependency audit is not clean, and user risk acceptance is not inferred.

## 9. Final disposition

**T12-R2 final full Security axis: GREEN / PASS.**

The fresh review against the original accepted baseline found no confirmed new security vulnerability or Security blocker. The concrete SEC-P01 native proof gap is resolved; SEC-F01 remains a disclosed non-blocking dependency follow-up.

**Ticket12 final integrated verification and user acceptance remain pending. Publication and production actions remain unauthorized.**