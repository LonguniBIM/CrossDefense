# T12-R3 — Independent Full Security Review

**Native Security verdict: GREEN**  
**Normalized verdict: PASS within the examined Security scope**  
**Confirmed new security vulnerabilities: 0**  
**Security blockers: 0**  
**Open non-blocking dependency follow-up: SEC-F01**

This fresh review examined the complete Ticket12 security surface against the original accepted baseline. It did not rely on a prior positive Security verdict or on another current R3 reviewer’s findings. The corrected Content Retry ownership chain, existing activation lifetime protections, waiting-worker repair, cache integrity, persistence separation, generated delivery artifacts, dependencies, and local testing controls were examined together.

**The separate final ordered executable gate remains pending. This Security result does not establish integrated verification PASS, user acceptance, publication authority, or deployment readiness.**

## 1. Scope, authority, and frozen identity

**Mode:** Full diff review against a fixed original baseline, with supporting inspection of unchanged owners where necessary to trace trust and data boundaries.

**Target:** `D:\01_DCMvn\Workspace\CrossDefense`, on `DESKTOP-DBD6QJO`.

**Original fixed point and current HEAD:**

`0fd3f7bf67c1662f01d8449f4623518b69f06a92`

**Branch:** `feature/ticket12-offline-recovery`

I independently reproduced both supplied R3 aggregates at entry and again before returning this report:

| Frozen set | Count | SHA-256 |
|---|---:|---|
| Complete Ticket12 round | 36 | `7fd10923c8a1b683533fe39382f96446ac348fcaa44cf1f3461e0d5f6c88cb7e` |
| Executable/configuration subset | 23 | `636ccebc32d53478d7375e1c9b630d87a8ebcb1d5f927c128e69da5248b89f4e` |

The verification used the supplied Windows PowerShell culture ordering and concatenation convention: relative path, NUL, lowercase SHA-256 of raw file bytes, LF, followed by SHA-256 of the UTF-8 concatenation. No inventory was written to disk.

The closing observation at **2026-11-26T12:02:05.7389455Z** confirmed the same HEAD and branch, **zero staged paths**, **530 untracked paths**, and both unchanged aggregates. The count is consistent with the assigned Ticket12 additions alongside the 502 pre-existing unrelated paths; those unrelated paths were not inspected as review scope.

Authority was established from the current top-level instruction in `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, the Ticket12 contract, active plan, current implementation breakdown, relevant architecture and ADR 0009, and the tri-axis review contract. Historical Ticket12 holds were treated as superseded by the current development-only authority.

## 2. Project security profile

CrossDefense is a browser-local application whose authoritative Player Data belongs to a Local Guardian Workspace. There is no newly introduced server account, cloud save service, or privileged remote application API in Ticket12.

The principal protected assets are:

- Acknowledged Pilot, Run, economy, learning, and settings data.
- Immutable content identities, Last Known Good, and existing Run pins.
- Coherent application code during play and durable operations.
- Integrity and availability of offline delivery resources.
- The developer machine’s filesystem at the owned test-server boundary.
- Build integrity and dependency provenance.

The relevant lower-trust inputs are worker messages, network/cache responses, corrupted or incomplete browser storage, asynchronous operation completion, HTTP request paths into the local test server, and newly resolved dependency code.

Arbitrary same-origin script execution already carries access to the origin’s browser storage. I did not treat that precondition alone as a newly introduced Ticket12 exploit.

## 3. Examined material

| Area | Material examined |
|---|---|
| Authority and requirements | Current repository instructions, workflow, glossary, Ticket12 plan/contract/verification/review contract, relevant implementation breakdown/specification, UX requirements, platform/technical architecture, invariant guidance, ADR 0009 |
| Production delivery | `vite.config.ts`, `src/sw.ts`, offline protocol, `BrowserOfflineRuntime.ts`, `OfflineStatusView.ts`, `offline.css` |
| Application admission | Original-baseline diff and current relevant paths throughout `src/main.ts`; complete `BuildApplication.ts` |
| Supporting persistence/content owners | `ContentPackApplication.ts`, `LocalStorageContentPackRepository.ts`, `WorkspaceWriteLock.ts`, `SettingsApplication.ts`, and their interaction with the existing Workspace repository |
| Dependency resolution | Structural comparison of the entire old/current lockfile; current installed versions; fresh read-only `npm audit`; installed Workbox routing, precaching, and build-glob paths |
| Testing surfaces | Both Ticket12 Playwright configurations, owned production server, four Ticket12 E2E files, update-boundary headless tests, and the assigned browser/control/update/lifetime/Content Retry helpers |
| Generated artifacts | Current `dist`, `build-r3-2-a`, and `build-r3-2-b`; injected worker manifests and every manifest-referenced compiled resource |
| Existing native evidence | Raw `r2-remediation-full-01/browser-results.json`, all 31 embedded JSON attachments decoded in memory, security-relevant native state comparisons, and `r2-layout-regression-02/browser-results.json` |

Prior own-axis Security dispositions were considered for continuity. No other current R3 axis was read or contacted. Historical peer-report files were included in the frozen-set hash, but their findings were not used as evidence for this verdict.

## 4. Trust boundaries checked

| Boundary | Evidence and result |
|---|---|
| Window → worker command | `src/sw.ts:147–174` constrains request shape and build identity, rejects extra fields, checks `event.origin`, resolves the sender through `clients.get`, requires an in-scope window, and requires a reply port. **PASS.** |
| Worker command → activation/claim | `src/sw.ts:156–200` checks the requested build, serializes control transitions, verifies required cache bytes, and checks that the sender is the only in-scope window before `skipWaiting` or `clients.claim`. **PASS.** |
| Repair input → network/cache writes | `src/sw.ts:106–137,177–179` accepts a build identity and enumerates that worker’s own immutable manifest. The caller cannot provide URLs, keys, cache names, integrity values, or replacement bodies. Requests are same-origin/in-scope, reject redirects, use exact Workbox cache keys and integrity, and share a 12-second request budget. **PASS.** |
| Network/cache body → readiness | `src/sw.ts:53–104` checks status 200, expected SHA-256 format, actual body bytes, and the 16 MiB body limit. Readiness derives from required manifest entries and stored responses. **PASS.** |
| Cached body → response | `src/sw.ts:15–27` validates bytes on cache insertion and reuse. Corrupt data is rejected, rather than promoted by cache membership alone. **PASS.** |
| Old build cache → retained executable resource | `src/sw.ts:32–49` limits fallback to same-origin hashed JS/CSS beneath `assets/`, compares the exact normalized URL, and checks stored bytes against recorded integrity. Unknown/source paths do not receive a general application fallback. **PASS within the stated origin threat model.** |
| Staged build → application adoption | `BrowserOfflineRuntime.ts:98–201` distinguishes candidate identity from readiness, repairs the installed waiting worker, and performs adoption through explicit application admission. **PASS.** |
| Application state → safe update admission | `src/main.ts:80–99` checks Workspace ownership, local validated content, entry/Build state, pending operations, pending Run requests, settings saves, and open dialogs. It synchronously holds Build and sets the application root inert before the worker request. **PASS.** |
| Build command → durable change | `BuildApplication.ts:101–125` excludes opening, queued, pending, Attempt-transition, and existing update holds. A unique release token prevents an old callback from releasing a later hold. **PASS.** |
| Outstanding native activation → admission release | `BrowserOfflineRuntime.ts:238–278` waits for native activation or a terminal refusal/redundant result. The 15-second deadline changes status without treating an outstanding native operation as canceled. **PASS.** |
| Content Retry → subsequent commands and presentation | `src/main.ts:537–643` owns the full retry, reconciles readiness, drains admitted work, and checks the originating screen and content owner before later commands. `renderPilotRun` and `renderRunProjection` await Build/Review re-entry. **PASS.** |
| Navigation → stale Retry continuation | `src/main.ts:599–611` invalidates the originating screen before the chooser read yields. Stale completion cannot proceed to new content publication, Review preparation, or screen takeover. **PASS.** |
| Replaceable delivery cache → authoritative state | The new worker operates on Cache Storage and worker control. Existing application/repository owners retain content validation, immutable identity, active/LKG publication, and Player Data. **PASS.** |
| HTTP URL → developer filesystem | `scripts/testing/ticket12-production-server.mjs:48–81` decodes and canonicalizes the request, resolves real paths, checks containment, requires a file, and returns ordinary 404 responses. **PASS.** |
| HTTP caller → test fault controls | Server `:19–43,85` binds loopback and requires the per-run bearer token, POST, bounded JSON, and bounded predefined controls. The Playwright configurations refuse existing-server reuse. **PASS.** |
| Build dependencies → executable delivery | Direct pins and npm integrity metadata are preserved. Newly disclosed availability advisories remain a separate non-blocking follow-up, described below. |

### Workbox’s additional message listener

I inspected the installed Workbox router rather than assuming the application request validator governs all library messages.

`node_modules/workbox-routing/utils/getOrCreateDefaultRouter.js:20–23` registers the standard `CACHE_URLS` listener. `Router.js:84–111` constructs requests and sends them through registered route handlers. In this configuration, those handlers do not expose an activation command, Player Data write, arbitrary filesystem capability, or unrestricted cross-origin fetch route.

No new cross-boundary exploit was established from that listener.

### Integrity and lifetime qualifications

The retained-cache integrity header is not an independent authenticity root. Its protection derives from insertion using the trusted build manifest and subsequent byte verification. An actor already capable of replacing both same-origin cache bodies and headers possesses broader origin authority.

The repair timer bounds its network requests. It is not a universal cancellation guarantee for every browser storage operation.

## 5. Generated artifact verification

I parsed the injected manifest and recomputed SHA-256 directly from each referenced compiled file on the authorized Windows device.

| Artifact | Build identity | Entries | Matching hashes | Entries within 16 MiB |
|---|---|---:|---:|---:|
| Current `dist` | `0.1.0-2026-11-26T11-47-21-195Z-3cd56ac6` | 9 | 9 | 9 |
| `build-r3-2-a` | `ticket12-a` | 9 | 9 | 9 |
| `build-r3-2-b` | `ticket12-b` | 9 | 9 | 9 |

All three contain index HTML, application JS, CSS, and all six immutable content manifests. The two largest manifests are **14,006,953 bytes** and **14,006,431 bytes**.

**Result: 27 of 27 referenced compiled resources match their injected integrity values.**

The worker outputs include `REPAIR_CACHE`. Neither the inspected worker outputs nor the current application bundle contain the searched test control token name, test control route, Content Retry harness, or worker lifetime harness identifiers.

This establishes the integrity of the artifacts currently present. It does not replace the required subsequent final build and executable gate.

## 6. Existing native proof independently checked

The raw report for `r2-remediation-full-01` contains:

- **19 cases in four files.**
- **One worker, zero retries, repeatEach 1.**
- Exactly one passed result for each case.
- Zero skipped, unexpected, or flaky cases.
- Zero global errors.
- Reported duration **192,381.885 ms**.

The separate `r2-layout-regression-02` report contains **15 passed cases**, the same strict worker/retry/repeat counters, no skipped/unexpected/flaky/global errors, and duration **68,101.844 ms**.

These were inspected reports, not tests executed by this reviewer.

### R3 Content Retry ownership

The decoded `content-retry-held-after-back.json` records one real content-body write whose native completion event has `isTrusted: true`. The visible document is the Pilot chooser, while the retry still owns its unacknowledged operation.

The completed case verifies that Apply remains disabled at this point. After the original acknowledgment is released:

- Content writes remain **one**.
- Review writes remain **zero**.
- The complete captured Player Data is deeply equal before and after draining.
- The chooser remains the current screen.
- The content registry remains unchanged.
- A subsequent actual A→B update completes with preserved native state and pins.

For the live Retry path, the native trace contains one genuine `ensure-review` operation, one Review occurrence/link, and no Review reward. Build publication and update admission remain unavailable until the actual Review acknowledgment arrives. After release, the case completes safe B activation and offline continuation. I independently compared the decoded Run, settlement, economy, Review operation, occurrence, link, and reward tables; all protected tables match.

**Evidence:** `src/main.ts:227–254,331–390,475–496,537–643`; `tests/e2e/ticket-12-content-retry.spec.ts:40–139`; `tests/ticket12ContentRetryFixture.ts:46–128`.

The fixture preserves original native writes and trusted completion events. It restores owned prototype methods and completion observers and asserts zero remaining callbacks before the tested update.

### Activation lifetime

| Scenario | Observed held duration | Native state while held | Data/input result | Terminal result |
|---|---:|---|---|---|
| Before original `skipWaiting` | 16,515 ms | B installed; native call count 0 | Root inert; native Undo and Map/Start probes leave the full save unchanged | Original call executes once; B activates; safe reload |
| During real activation | 16,523 ms | Active/controller genuinely activating | Root inert; full save unchanged after protected input | B reaches activated; safe reload |
| Before actual window-list check | 16,508 ms | B installed; native check deferred | Root remains inert through the unresolved request | Actual two-window refusal releases the same document/Build; Undo then produces the expected second receipt |

I independently compared the held acknowledged save with both `afterUndo` and `afterInputs` in the decoded lifetime evidence. Both comparisons are equal for both activation scenarios.

**Evidence:** `BrowserOfflineRuntime.ts:238–278`; `tests/e2e/ticket-12-update-lifetime.spec.ts:87–210`; decoded lifetime attachments.

### Cache, recovery, and immutable content

The completed native selection also covers:

- Initial and candidate HTTP preparation failures preserving saved data.
- Corrupted active cache revoking readiness and repairing without registry or Player Data replacement.
- One response removed from B’s cache only, truthful refusal, visible Retry, repair of the same installed waiting worker with unchanged script bytes, followed by safe activation and offline pinned continuation.
- Actual quota rejection: usage **43,380,940 bytes**, imposed quota **44,429,516 bytes**, and a native `QuotaExceededError`. A’s readiness and saved Pilot survive. The test resets the quota override and asserts it is inactive before detaching.
- Failed Build and Settings writes excluding activation until acknowledgment/Retry.
- Second-window refusal and later successful activation.
- Actual Combat on A while B stages, followed by safe Build activation retaining old pins.
- Invalid candidate rejection retaining active/LKG identity.
- Missing pinned content preserving the Run in Content Required.
- Interrupted offline play retaining four committed payloads at tick 15, one interrupted outcome, unchanged economy, and no Review occurrence.
- Actual controlling-worker responses of 404 for the missing path, `/src/main.ts`, `/.env`, and `/.git/config`.

The full played-loop evidence also records matching browser/headless semantic outcome digests, with only `recordedAt` excluded:

`c5462479c310b8e1a813f68fba5da1c450bcd53f065e1570bdc76f8282efb7dc`

This is current native support for the reviewed boundaries, not completion of the pending final ordered gate.

## 7. Findings and prior own-axis dispositions

### Confirmed product-security findings

**None.**

No reachable new Critical, High, Medium, or Low vulnerability was established in the examined Ticket12 change.

### SEC-P01 — Exact-tile Build preservation proof

**Disposition: remains resolved at the affected-case and complete native-selection level.**

- **Category:** Historical proof gap, not a confirmed production vulnerability.
- **Confidence:** High.
- **Evidence:** `tests/e2e/ticket-12-updates.spec.ts:196–228` and its single completed PASS result in `r2-remediation-full-01`.
- The case checks exact tile `combat-run:starter:0`, empty A3, eight retained tiles, revision 5, one receipt, completed update, and complete native save equality after reload.
- The final integrated gate remains pending and is not waived.

### SEC-F01 — New PWA build dependency chain retains availability advisories

**Disposition: OPEN — non-blocking dependency follow-up.**

- **Application severity:** Info for this bounded change.
- **Upstream severity:** Moderate for the two new underlying advisories.
- **Confidence:** High for versions, source path, and the absence of a demonstrated attacker-controlled pattern/budget path in the reviewed configuration.
- **Gate:** Non-blocking.
- **Affected components:** `glob 11.1.0`, `minimatch 10.2.6`, `workbox-build 7.4.1`, `vite-plugin-pwa 2.0.0`.
- **Trust boundary:** Build inputs entering dependency code that performs filesystem traversal and pattern processing.
- **Source-to-sink evidence:** Fixed `globPatterns` and `globIgnores` in `vite.config.ts:45–48` reach `node_modules/workbox-build/build/lib/get-file-details.js:19–27`, which uses `globSync` over the configured build output.
- **Reachability:** No browser/user-supplied glob pattern or traversal cancellation budget is introduced by this path.

The maintainer’s glob advisory concerns traversal continuing after cancellation when callers rely on cancellation as a resource budget. The minimatch advisory concerns attacker-supplied patterns causing preprocessing amplification. Those conditions were not established in the current fixed-pattern Ticket12 build path. genui{"citation":{"refs":["turn208426347view0","turn208426347view1"]}}

**Primary maintainer references:**

- [glob cancellation advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-3g3m-2fjr-6pw4)
- [minimatch pattern amplification advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249)

**Impact and residual exposure:** No new browser-runtime exploit or Player Data consequence was established. Future tooling that accepts untrusted patterns/directories or depends on affected cancellation behavior could change applicability.

**Remediation target:** A bounded compatible dependency update.

**Validation for that maintenance:** Repeat resolved-tree and audit inspection, production build, complete integrity-manifest verification, and native offline/update cases.

No forced update, unrelated dependency upgrade, or audit fix was performed.

### Fresh dependency facts

The fresh whole-lockfile comparison found:

- Every existing direct package version is unchanged.
- Exact new direct pins are PWA **2.0.0** and Workbox **7.4.1**.
- **334 added package locations.**
- One changed existing package version: `@types/estree 1.0.9 → 1.0.11`.
- Zero newly added non-npm resolved sources.
- Zero newly added resolved packages missing integrity metadata.
- Zero newly added entries declaring `hasInstallScript`.

Installed versions match the lockfile for the inspected PWA, Workbox, glob, minimatch, Vite, Vitest, mocker, and Zod packages.

The fresh audit remains **eight vulnerable package entries: six Moderate and two High**. Inherited entries are Vite, Vitest, `@vitest/mocker`, and Zod; the new chain flags are glob, minimatch, Workbox build, and PWA. This is not an audit-clean result or an inference of user risk acceptance.

## 8. Execution limits, needs evidence, and residual risk

**No unresolved candidate vulnerability makes the examined Security scope incomplete.**

The following limits remain:

- The final ordered gate is still pending: fresh typecheck, 336 intended headless cases, 217 development regressions, production build, deployment dry-run, 130 production regressions, fresh A/B variants, and 19 native cases. Prior focused and combined runs are not stitched into that claim.
- No tests, builds, application servers, or browser sessions were launched during this review.
- No active malformed-message, cross-origin, traversal, token-guessing, or resource-exhaustion attacks were performed. Those controls were assessed by source tracing.
- Native evidence is Chromium evidence; other browser implementations and eviction behavior were not independently exercised.
- A permanently indeterminate native activation intentionally keeps the admitted UI/Build held.
- Conservative cache retention can grow storage use over time. Cleanup policy remains separate work.
- Manifest hashes establish integrity relative to trusted build output; they are not independent release signing or protection against an already compromised deployment origin.
- Existing subsystems were inspected where needed to trace changed boundaries. This is not a new comprehensive security audit of every pre-existing subsystem or inherited advisory.
- No production Cloudflare state or live Ticket11 behavior was rechecked or changed.
- No current R3 peer verdict was consumed.
- No source, documentation, report, inventory, snapshot, or compiled artifact was written by this reviewer.

All repository inspection occurred through Remote Desktop Commander on the authorized device using raw PowerShell. The only executable dependency check was the permitted read-only audit. No install, fix, staging, commit, push, merge, deployment, credential, provider-review, or suspended operation occurred.

## 9. Final disposition

**T12-R3 independent full Security axis: GREEN / PASS.**

The full review against the original fixed point found no confirmed new security vulnerability or Security blocker. Current native evidence supports the Content Retry ownership correction and retained activation/cache protections. SEC-P01 remains resolved; SEC-F01 remains an explicit non-blocking dependency follow-up.

**Final integrated verification and user acceptance remain pending. Publication and production changes remain unauthorized.**