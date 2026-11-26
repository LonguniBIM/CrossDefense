# Ticket12 — Initial Independent Security Review

**Native verdict: GREEN. Normalized verdict: PASS for the reviewed Security axis.**

No confirmed blocking security vulnerability was established in the frozen Ticket12 change. This verdict covers the source and trust boundaries examined below. **Ticket12 integrated acceptance remains incomplete:** the failed Build-write browser case has not completed its final activation assertions, and the final combined suites, review and executable gate remain pending.

## Scope and identity

**Mode:** Scoped diff review against accepted Ticket11 fixed point.

- **Device:** DESKTOP-DBD6QJO, `0bfdbd88-da2a-400d-b6cc-0951271002c5`.
- **Root:** `D:\01_DCMvn\Workspace\CrossDefense`.
- **Branch:** `feature/ticket12-offline-recovery`.
- **Original and current HEAD:** `0fd3f7bf67c1662f01d8449f4623518b69f06a92`.
- **Frozen set:** The 25 paths assigned by root, including the tracked changes and explicitly named untracked Ticket12 additions.
- **Independent freeze verification:** At `2026-11-26T11:02:17.3491750Z`, the same 25 files produced:
  `e006738339d221e4c2bc406e1e1df191b15abe94214c1168dac5c5f3bd82d6e5`.
- **Hash convention:** PowerShell `Sort-Object` culture order; each relative path followed by NUL, lowercase SHA-256 of raw file bytes, and LF; UTF-8 outer SHA-256.

The review was read-only. I did not modify files, run tests or exploits, open browsers, invoke provider reviewers, stage, commit, publish, change Cloudflare, copy source artifacts, or write a source inventory. Public advisory pages were read through search tooling to verify dependency applicability.

No Code/Spec or Architecture findings were solicited or read.

## Project security profile

The protected assets are browser-local authoritative Player Data, immutable content identities and Run pins, the current coherent application build, and availability of the validated offline slice. This deployment has no cloud accounts, tenant authorization, application server secrets, remote save database or multiplayer economy.

The new security-sensitive surfaces are service-worker messages, fetched and cached application bytes, explicit update activation, and the local test server’s filesystem/control interface. The pertinent adversaries are an unrelated origin attempting to reach those controls, malformed or corrupted delivery resources, and lower-trust request paths into the test server. An attacker already executing arbitrary same-origin JavaScript can access this origin’s browser stores; that pre-existing authority was not treated as a newly introduced Ticket12 vulnerability.

## Examined scope

| Area | Examined material |
|---|---|
| Authority and requirements | `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, active Ticket12 plan, Ticket12 contract and verification record, relevant implementation specification/breakdown, technical architecture, UX state requirements, invariant guidance and ADR 0009 |
| Production delivery and update code | `vite.config.ts`, `src/sw.ts`, offline protocol/runtime, `src/main.ts`, `BuildApplication.ts`, `OfflineStatusView.ts`, `offline.css` |
| Dependency changes | `package.json`, structural comparison of the complete old/current lockfiles, new package source/integrity/lifecycle metadata, pertinent Workbox runtime/build implementation |
| Test and local HTTP surfaces | Both Ticket12 Playwright configurations, production server, both Ticket12 E2E files, headless update-boundary tests, and all three assigned test helpers |
| Supporting unchanged owners | `WorkspaceApplication`, `SettingsApplication`, `ContentPackApplication`, `LocalStorageContentPackRepository`, relevant Workbox precache behavior |
| Generated artifact | Current `dist/sw.js` manifest and all nine referenced compiled assets, read directly on the authorized device |

The existing generated build inspected was:

`0.1.0-2026-11-26T10-49-21-102Z-2492af28`

Its manifest contains nine entries: index HTML, JS, CSS, and all six required content manifests. I independently calculated the SHA-256 of each referenced compiled file; **all nine match their injected integrity values**, and all nine are within the configured 16 MiB limit. The two largest manifests are **14,006,953** and **14,006,431** bytes. This checks the artifact currently present; it does not replace a fresh final build and gate after remediation.

## Trust boundaries checked

| Boundary | Evidence and behavior | Result |
|---|---|---|
| Browser window → service worker | `src/sw.ts:113–145` restricts the message shape, build-ID alphabet/length, origin, source ID, resolved client type and scope. Requests require a reply port. | PASS |
| Update request → worker activation | `src/sw.ts:147–162` checks exact candidate build, serializes control transitions, verifies required cached bytes, and requires the sender to be the only in-scope window before `skipWaiting` or `clients.claim`. | PASS |
| Application lifecycle → explicit reload | `src/main.ts:79–98` requires ownership, local content readiness, an entry/Build boundary, no pending entry/Run work, no pending Settings save and no open dialog; it freezes Build and makes the root inert before the asynchronous worker request. | PASS by source review; one native proof branch remains unfinished |
| Build commands → pending durable state | `BuildApplication.ts:101–119` admits the update synchronously, counts queued edits before their promises execute, rejects commands while held, and uses a unique release token. Existing uncertain-save state remains blocking. | PASS |
| Network/cache bytes → executable offline resources | `vite.config.ts:18–27,45–48` generates integrity and requires all six packs. `src/sw.ts:16–27,53–103` checks response status, expected digest, bounded body size and actual bytes before readiness/cache use. | PASS |
| Old resources → retained build cache | `src/sw.ts:34–49` allows only same-origin assets with hashed JS/CSS names, performs exact normalized URL matching, and verifies bytes against the integrity header recorded during valid insertion. No general navigation/source fallback exists. | PASS within the stated threat model |
| Delivery resources → authoritative Player Data | New delivery code operates on Cache Storage and worker control. Content activation remains with the existing validator/repository; native Player Data remains with its existing owner. | PASS |
| Candidate content → active/LKG/pinned content | Supporting application/repository inspection confirmed validation precedes activation, immutable digest conflicts are refused, pinned restoration checks the requested version and Ruleset, and failed publication leaves the previous registry intact. | PASS |
| Local HTTP URL → filesystem | Server `:48–81` decodes/parses the request, resolves real paths, uses `relative` containment including the Windows separator, requires a file and returns ordinary 404s. | PASS |
| Local HTTP caller → test controls | Server `:19–43` requires the per-run bearer token, POST, bounded JSON and bounded failure/corruption controls. Server `:85` binds only `127.0.0.1`; Playwright refuses reuse. | PASS |
| New dependencies → build/runtime authority | New lockfile sources are registry npm HTTPS tarballs with integrity metadata. No newly added package reports an install lifecycle script in lock metadata. New advisory reachability was traced to repository-controlled build globbing. | Non-blocking follow-up |

### Specific security conclusions

**Service-worker control is not exposed to an unrelated origin.** The code does not trust only an asserted message type or build ID; it resolves the source through `clients.get`, requires a window in scope, and checks `event.origin`. Replies use the transferred port. The worker does not contain a generic `SKIP_WAITING` message handler that bypasses these checks.

**Cache corruption does not establish readiness.** The cache verifier uses the manifest’s expected SHA-256 values and reads the stored bytes. It does not trust a cache name or status flag alone. Cache-repair requests stay on the current origin, and current manifest routes use the Workbox integrity-aware precache strategy. I also inspected the installed Workbox `PrecacheStrategy` implementation to confirm its install failure and fetch/repair behavior.

**The old-cache integrity header is not an independent authenticity root.** Its protection derives from the current insertion path recording a manifest-derived digest, then validating bytes on retrieval. This is suitable for the reviewed corruption/retention boundary. Someone able to arbitrarily rewrite both Cache Storage bytes and headers from same-origin script already has broader origin authority; I did not report that prerequisite alone as a new vulnerability.

**The local test server does not expose a general filesystem or process capability.** Its test-control API selects predefined roots and bounded fault sets. It does not accept shell commands, arbitrary write destinations or external fetch targets. Filesystem traversal is contained after `realpath`, including junction/symlink resolution at that point.

## Confirmed product-security findings

**None.**

No reachable new Critical, High, Medium or Low vulnerability was established within the reviewed changes. The following are tracked separately because their disposition is relevant to acceptance or ongoing dependency work.

## Proof gap

### SEC-P01 — Failed Build-write browser case has not completed its final safe-activation proof

- **Category:** Test/proof gap, not a confirmed production vulnerability.
- **Severity:** Medium verification importance.
- **Confidence:** High.
- **Acceptance gate:** **Blocks claiming the complete Ticket12 integrated verification PASS.** It does not independently overturn the static Security-axis PASS.
- **Evidence:** `tests/e2e/ticket-12-updates.spec.ts:196–225`, especially `:220`. The assigned run failed at a semantic label count that expects one `"S, Ballistic, unplaced Letter Tile"`, while the fixture contains two matching labels. The assertions at `:223–225` for activation, new build identity and unchanged acknowledged Player Data were therefore not reached.
- **Asset/boundary:** Acknowledged Build edits and their preservation through explicit update/reload.
- **Reachability:** This is a real user update path after an actual failed native IndexedDB write and Retry, exercised by the browser test.
- **What is established:** Source admission checks and the headless tests cover queued commands, uncertain acknowledgments, hold/refusal and stale release callbacks. The supplied browser result establishes earlier assertions only to the failure point.
- **What remains unproved:** That the **exact edited tile**, once acknowledged through the native host, survives the final successful activation and reload in this case.
- **Remediation target:** Replace the ambiguous label-count expectation with the exact fixture tile identity and assert its resulting placement/Cargo state. Preserve the remaining activation and native Player Data assertions.
- **Required regression proof:** Rerun this complete native case to successful completion, then the selected combined Ticket12 and final required gates. Preserve the failed run as historical evidence; do not recast it as a product failure or silently discard its existence.

The pending final combined suite and legacy regressions are also acceptance work. This review did not run or claim their results.

## Dependency follow-up

### SEC-F01 — New PWA build chain carries two known availability advisories; no attacker-controlled path was found here

- **Category:** Dependency follow-up.
- **Application severity:** Info/non-blocking in this bounded change. The upstream advisories themselves are rated Moderate.
- **Confidence:** High for installed versions and the relevant call path.
- **Acceptance gate:** **Non-blocking Security follow-up** for this development slice; no audit-clean or user risk-acceptance claim.
- **Evidence:** `package-lock.json:5525` (`glob 11.1.0`), `:6609` (`minimatch 10.2.6`), `:8148` (`vite-plugin-pwa 2.0.0`) and `:8433` (`workbox-build 7.4.1`); `vite.config.ts:45–48`; installed `node_modules/workbox-build/build/lib/get-file-details.js:19–27`.
- **Boundary:** Repository/build input → local build filesystem traversal and pattern processing.
- **Applicability trace:** Workbox invokes `globSync` with the configured build directory and fixed repository glob/ignore patterns. The inspected path does not accept a web/user-supplied pattern and does not use an AbortSignal as its resource budget.
- **Upstream concern:** GHSA-3g3m-2fjr-6pw4 concerns traversal continuing after cancellation; GHSA-g3hv-75wg-m249 concerns attacker-controlled pattern amplification. Those prerequisites were not found in the Ticket12 application path. genui{"citation":{"refs":["turn145209161view0","turn145209161view1"]}}
- **Impact/blast radius:** Potential build availability risk if future tooling exposes untrusted patterns or adds reliance on the affected cancellation behavior. No present browser-runtime exploit or Player Data impact was established.
- **Remediation target:** Track a compatible upstream dependency update in bounded dependency maintenance; avoid unrelated forced upgrades during this review.
- **Regression proof for that later work:** Recheck the exact resolved tree/advisories, production build, complete integrity manifest and actual offline/update cases.

The whole lockfile comparison found **334 added package locations** and one changed existing version, `@types/estree 1.0.9 → 1.0.11`. New resolved package sources were all `https://registry.npmjs.org/`, none lacked integrity metadata, and none was marked with a new install script.

The existing eight-entry audit remains disclosed: two High and six Moderate entries, including the four inherited Vite/Vitest/Zod-related entries. In particular, the inherited direct `zod 4.6.5` pin falls below the advisory’s fixed version `4.6.6`; the upstream issue concerns excessive memory consumption during collection validation. This is retained baseline risk, not evidence that Ticket12 newly exposes an attacker-controlled collection-validation endpoint. genui{"citation":{"ref":"turn145209161view2"}}

The exact previous audit output was supplied as historical execution evidence by the infrastructure author; I did not rerun audit or infer risk acceptance. A general inherited-dependency remediation review was outside this initial axis.

## Not examined and residual uncertainty

- No active adversarial testing of malformed service-worker messages, cross-origin frames, traversal requests or token guessing was performed. Conclusions for those controls are from their complete static paths.
- The pending complete Build-write browser case and final combined/regression gates were not executed by this reviewer.
- Production Cloudflare behavior/configuration was not rechecked or changed. Ticket11 remains the accepted deployed baseline; this review is not deployment approval.
- The final rebuilt artifact following any revisions has not yet been reviewed. The compiled manifest checks above apply to the identified existing build.
- Earlier application subsystems were inspected only where necessary to trace new update/content boundaries. This was not a fresh baseline audit of the full game.
- Browser-specific eviction and quota behavior beyond the supplied Chromium evidence was not independently exercised.
- The conservative policy intentionally retains earlier application caches and shipped packs. Future storage growth and cleanup policy remain bounded follow-up work; no garbage collector was introduced or authorized.

## Final disposition

**Initial Security review: GREEN / PASS.**

**Product security blockers found: 0. Confirmed new vulnerabilities: 0.**

**Integrated Ticket12 acceptance: still pending** the concrete proof work identified in SEC-P01, the remaining required execution gates, and the final review of the revised frozen result.
