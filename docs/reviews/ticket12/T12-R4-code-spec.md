# Ticket12 — T12-R4 Independent Full Code/Spec Review

**Standards: PASS. Spec: PASS.** No new Standards or Spec finding was established in this fresh review of the complete Ticket12 change against the original fixed point.

The exact-tile assertion, waiting-worker cache repair, activation lifetime, Content Retry ownership, and Build layout corrections remain supported by the current source and existing native evidence. The R4 change correctly waits for the actual Map view before measuring its layout, while preserving the original geometry assertions.

**Final integrated verification remains Pending / INCOMPLETE.** The separately ordered complete executable gate must follow this full review round. Earlier failed gates retain their original results. This report does not infer user acceptance, publication authorization, or deployment readiness.

This was **one isolated Code/Spec reviewer**, maintaining separate Standards and Spec assessments. No current R4 peer report or finding was read or solicited.

All repository paths below are relative to:

`D:\01_DCMvn\Workspace\CrossDefense`

All runtime evidence paths below are relative to:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126`

## 1. Standards

**Native verdict: PASS. Normalized verdict: PASS.**

**No Standards findings.**

The complete change follows the applicable repository requirements examined in `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, `docs/patterns/encoding-invariants.md`, and `docs/architecture/TESTING_STRATEGY.md`:

- The deterministic Domain rules and authoritative Player Data ownership remain unchanged.
- The host owns application admission. `BuildApplication` owns the synchronous editing hold. The browser runtime and worker own delivery, cache verification, staging, and observation of native activation.
- Content compatibility, integrity, immutable identity, activation, and restoration continue through `ContentPackApplication` and its existing repository.
- Repository prose, code comments, and user-facing additions are English.
- Public Application tests cover the Build boundary. Native worker tests use production bundles, real service workers, IndexedDB, and browser locking. Test-only scheduling controls remain outside production code.
- The regression configuration explicitly selects tracked product tests. It does not broaden discovery into the suspended untracked orchestration material.
- Current authority and evidence records distinguish implementation, review, executable verification, user acceptance, and publication. Failed executions remain recorded.
- The R4 test correction establishes navigation readiness without removing an assertion, relaxing a bound, increasing a timeout, adding a sleep, or changing production behavior.

No naming, formatting, or abstraction preference was elevated into a repository violation.

### Dependency configuration

I independently compared the complete original/current lockfile structures in memory.

| Inspection | Observed result |
|---|---|
| Existing direct dependency versions | Preserved |
| Added development dependencies | `vite-plugin-pwa` 2.0.0; `workbox-build`, `workbox-precaching`, `workbox-routing`, and `workbox-window` 7.4.1 |
| Added resolved package locations | 334 |
| Removed resolved package locations | 0 |
| Changed existing resolved package version | `@types/estree` 1.0.9 → 1.0.11 |
| Current lockfile format | Version 3 |

This was a structural lockfile assessment. I did not run an audit or inspect every transitive dependency implementation. The documented non-clean audit and **SEC-F01** follow-up remain unchanged.

### R4 assertion correctness

The original-baseline diff in `tests/e2e/ticket-06-ui.spec.ts:195` adds only:

```ts
// Map selection loads asynchronously; wait for that view before measuring its layout.
await expect(page.getByRole('heading',{name:'Map and difficulty',exact:true})).toBeVisible();
```

The existing Map and diagnostic width/height loops, accepted viewports, diagnostic end-control bound, and screenshot calls remain intact.

This assertion observes the specific view whose geometry the test intends to measure. It is consistent with the existing diagnostic half, which already waits for `attempt-id` before measuring that view.

## 2. Spec

**Native verdict: PASS. Normalized verdict: PASS.**

**No Spec findings.**

The requirement assessment used the current Ticket12 authority, the approved Ticket12 entry in `IMPLEMENTATION_BREAKDOWN.md`, `TICKET12_OFFLINE_CONTRACT.md`, the relevant implementation and UX contracts, the technical/platform architectures, and accepted ADR 0009.

### Complete requirement coverage

| Required behavior | Source and existing proof assessed | Assessment |
|---|---|---|
| Production preparation of the complete accepted slice | `vite.config.ts`; `src/sw.ts` precache setup and `verifyCache()`; actual `dist` manifest and native preparation cases | All six shipped packs are required inputs. Readiness verifies stored bytes. |
| Factual combined readiness | `src/main.ts` local content state; `OfflineStatusView.render()`; runtime cache inspection | Cached delivery and local validated content are distinct conditions. |
| Initial/candidate preparation failure preserves saves | Worker installation/integrity handling; initial HTTP failure, failed candidate, corruption, and quota cases | Delivery failure does not replace authoritative Player Data. |
| Complete offline played loop | `ticket-12-offline.spec.ts`; `ticket12BrowserScenario.ts`; actual native report and scenario diagnostic | Offline create/continue, earned Pre-Run, Build, Combat, results, Salvage, Review, and durable reload are covered. |
| Deterministic browser/headless agreement | `proveTicket12Parity()` through public `CombatApplication` | The same startup and ordered inputs produce the same semantic outcome; wall-clock exclusion is explicit. |
| Interrupted Attempt recovery | Existing recovery path plus the offline interruption case and diagnostic | Committed loot survives repeated recovery; no victory or automatic Review reward is inferred or granted. |
| One coherent running App | Per-build caches, explicit host admission, `activateWaiting()`, native worker observation | Staging does not automatically reload active play. |
| Safe entry/Build admission | `src/main.ts:80–99`; `BuildApplication` hold methods; pending Build, Settings, Content Retry, and other-window cases | Relevant pending work excludes activation. |
| Indeterminate activation remains held | `activateAndObserve()` and the three native lifetime scenarios | Fifteen seconds changes status, not admission ownership. |
| Explicit repair of the same waiting build | `BrowserOfflineRuntime.retry()`; worker `repairManifest()`; same-worker/script recovery case | Repair uses the contacted worker’s own immutable manifest and exact cache keys. |
| Content Retry cancellation and drain | `retryContent()`, `bindBackToPilots()`, awaited Build/Review chain, and both Content Retry cases | Navigation cancels later work; already-admitted operations settle before update admission reopens. |
| LKG and immutable Run pins | Existing content Application/repository owners; invalid candidate, unavailable pin, old-pin update and offline continuation cases | No silent substitution, save migration, or content garbage collector is introduced. |
| Accepted viewport fit | `OfflineStatusView`, `offline.css`, native Build geometry, Combat geometry, legacy production regressions, and R4 Map trace | Current evidence supports the bounded layout correction and corrected Map measurement. |
| URL entry; optional installation | `manifest: false`; URL bootstrap and offline reload proof | No unproved browser installation UI is claimed. |

### Production delivery and cache behavior

The Vite configuration requires all six immutable content manifests and adds SHA-256 integrity to every precache entry. The explicit **16 MiB** limit includes the two approximately 14 MB rendered/Review packs.

`src/sw.ts` verifies actual response bytes on insertion, reuse, and readiness inspection. Repair enumerates the worker’s own manifest; the caller cannot supply an arbitrary resource. The repair path retains same-origin/scope checks, redirect rejection, expected integrity, and the body size limit.

The worker uses a separate cache per build and retains earlier caches. The older-resource route is limited to exact hashed JS/CSS resource matches. It does not create a general navigation or missing-file fallback.

I independently parsed the current `dist/sw.js` manifest and recomputed every referenced file’s SHA-256:

| Existing compiled output | Result |
|---|---|
| Build identity observed in worker | `0.1.0-2026-11-26T12-48-19-375Z-0d536d02` |
| Manifest entries | 9 |
| Matching SHA-256 integrity values | 9/9 |
| Required immutable manifests present | 6/6 |
| Entries within 16 MiB | 9/9 |
| Review manifest bytes | 14,006,953 |
| Rendered Combat manifest bytes | 14,006,431 |

This verifies the existing artifact’s referenced bytes and manifest. I did not rebuild it, and this does not replace the subsequent fresh build/dry-run stage.

### Safe update lifetime

The host acquires its Build hold where applicable, marks `applyingUpdate`, and makes the application root inert before awaiting the runtime.

`BuildApplication.canHoldForAppUpdate()` excludes pending, opening, queued, Attempt-held, and already-update-held states. `holdForAppUpdate()` admits synchronously and returns a token-specific release. All durable editing commands pass through the held-aware enqueue path.

`activateAndObserve()` does not resolve the update promise merely because its notification deadline expires. A positive acknowledgment still waits for native `activated`. Missing/unreadable acknowledgment remains indeterminate, while native `activating` takes precedence over a contradictory negative reply. Terminal completion removes the owned listener, timer, and ports.

The native evidence independently inspected confirms:

| Scenario | Recorded elapsed hold | State and outcome |
|---|---:|---|
| Before native `skipWaiting` | 16,515 ms | B remained installed, native call count was zero, A’s Build remained inert, and actual Undo/Map inputs left the saved state unchanged. Release caused one native call and a B chooser reload. |
| During native activation | 16,523 ms | Active/controller state was genuinely `activating`; A’s Build remained inert and saved state remained unchanged after protected inputs. Release reached activated B and a new chooser document. |
| Before genuine window refusal | 16,508 ms | The real window check remained deferred and Build inert. Release produced the actual second-window refusal, preserving the same A document and Build. Undo subsequently added the expected second receipt. |

These observations came from the decoded `r2-remediation-full-01` lifetime attachments and in-memory comparisons of the captured save objects.

### Content Retry ownership

The current `retryContent()` owns one shared pending operation, increments `entryOperations` before yielding, and decrements it only in its outer `finally`.

Back to Pilots advances the screen epoch synchronously before the chooser read. The retry captures both its content owner and originating epoch, checks them after asynchronous boundaries, and refuses stale subsequent commands or presentation. Its readiness reconciliation still drains an admitted operation before admission can reopen.

The current chain awaits:

`retryContent → renderPilotRun → renderRunProjection → enterBuild → showBuild → Review recovery`

The native fixture delays the installed application completion callback after a genuine native transaction commit and later delivers the original trusted event. It does not invent a successful write or acknowledgment.

Independent inspection of the existing attachments found:

- Canceled Retry: one content write, trusted content completion, no later Review write, no second content publication, and equal Player Data before/after drain.
- Current Retry: one genuine `ensure-review` operation, link, and occurrence; zero Review rewards while acknowledgment is held.
- After completion and B activation: the relevant Run, settlement, economy, Review operation, occurrence, link, and reward tables remain equal through offline continuation.

### LKG, immutable identity, and authoritative data

Direct inspection of the existing `ContentPackApplication` and `LocalStorageContentPackRepository` confirmed that candidate validation precedes activation, immutable digest conflicts are rejected, pinned restoration checks the requested identity, and failed publication preserves the prior registry.

The new worker/runtime does not become an authoritative save owner. Settings retain their pending-save owner, and Workspace ownership remains based on the existing exclusive Web Lock.

## 3. R4 Map correction: independently inspected trace evidence

I read the existing native traces directly from their ZIP entries in memory. No trace or source extraction was written.

### Retained failed run

`final-production-03` remains **129 passed / 1 failed**.

The failed CS06-03 trace records:

- Choose Map completed at **114408.012 ms**.
- A following snapshot at **114408.631 ms** contained **Loading saved Map selection**.
- The geometry evaluation ran at **114415.721–114417.927 ms** and returned **1265 × 768** after the viewport had been changed to **1280 × 720**.
- The failure was the existing `height <= 720` assertion.

This evidence supports the missing target-view readiness condition. It does not establish that the completed Map itself overflows.

### Corrected focused run

`r4-map-ready-green-01` contains **15 passed cases**, each with one passed attempt, one worker, zero retries, repeat one, and no skipped/flaky/global errors.

The corrected CS06-03 trace records the exact Map heading expectation completing before the original geometry evaluations:

| Measured view | Viewport | Recorded document dimensions | Additional bound |
|---|---|---|---|
| Map | 1280 × 720 | 1280 × 720 | Original assertions pass |
| Map | 1366 × 768 | 1366 × 768 | Original assertions pass |
| Diagnostic | 1280 × 720 | 1280 × 720 | End control bottom approximately 589.86 px |
| Diagnostic | 1366 × 768 | 1366 × 768 | End control bottom approximately 589.86 px |

I also visually inspected the current `diagnostic-1280.png`. The diagnostic’s content and end controls fit the captured viewport.

The legacy production configuration deliberately blocks service workers for its existing network fixtures. This trace establishes the corrected layout test; it is not used as native offline proof.

## 4. Prior findings and current dispositions

Historical classifications and failed verdicts remain intact.

| Historical ID | Original classification | Current disposition within this review | Basis |
|---|---|---|---|
| **T12-R1-CS-STD-01** | Medium / BLOCKER / High | **FIXED** | Exact returned tile, empty A3, retained count, revision, receipt, B activation, and complete saved-state equality are asserted; the complete native case passes. |
| **T12-R1-CS-SPEC-01** | Medium / BLOCKER / High static confidence | **FIXED** | Same waiting worker repairs its own damaged cache through explicit Retry while script bytes remain unchanged; activation and offline pinned continuation complete. |
| **T12-R2-CS-SPEC-01** | Medium / BLOCKER / High | **FIXED** | Current CSS budgets the remaining Build height; all 15 native state/viewport records satisfy document, panel, and selected essential-element bounds with 23 px grid lettering. |
| **ARCH-T12-001** | Strong / BLOCKER / High | **Correction corroborated within Code/Spec scope** | Source and native evidence preserve the admitted boundary through delayed native activation or definitive refusal. |
| **ARCH-T12-002** | Strong / BLOCKER / High | **Correction corroborated within Code/Spec scope** | Source and native evidence account for Retry through drain and complete Build/Review re-entry, preventing stale continuation. |
| **SEC-P01** | Historical verification gap | **Specific native-case proof resolved** | The repaired Build-write case reaches activation and full state comparison. |
| **T12-R1-CS-VER-01** | Informational verification gap; final-gate blocker | **OPEN — separate final executable gate** | A fresh complete ordered gate is explicitly scheduled after R4. No new production defect is inferred from that sequence. |
| **SEC-F01** | Historical non-blocking dependency follow-up | **OPEN / NON_BLOCKING** | The disclosed eight vulnerable entries remain recorded; no audit-clean or accepted-risk claim is made. |

Corroboration of prior Architecture/Security corrections is not a replacement verdict for either current independent axis.

## 5. Existing executable evidence independently checked

I parsed the actual reports, including test/result entries, rather than relying only on the verification ledger.

| Existing execution | Actual result | Relevant interpretation |
|---|---|---|
| `r2-remediation-full-01` | **19/19 passed**, four files, 192,381.885 ms | Complete current native offline/update suite on the unchanged original 23 executable paths |
| `r4-map-ready-green-01` | **15/15 passed**, one file, 50,867.496 ms | Complete affected production file after the R4 readiness correction |
| `final-headless-03` | **336/336 passed**, 37 files | Actual earlier complete headless stage |
| `final-development-03` | **217/217 passed**, 36 files, 523,930.706 ms | Actual earlier complete development stage |
| `final-production-03` | **129 passed / 1 failed**, 130 cases, 13 files | Retained failed full production gate |
| `final-development-01` | **216 passed / 1 failed**, 217 cases | Retained Build setup deadline failure |
| `final-headless-02` | **335 passed / 1 failed**, 37 files | Retained Map-case deadline failure |

The inspected browser reports use one worker, zero retries, repeat one, and exactly one result per case, with no skipped/flaky/global errors. The failed reports remain failed.

Typecheck and deployment dry-run success were read from the coordinator’s supplied evidence and current verification record; I did not independently rerun them or inspect their complete process output in this review.

### Offline scenario and recovery diagnostics

The current native scenario records:

- App build: `ticket12-a`
- Content: `development-review-ship-v1`
- Ruleset: `development-combat-ruleset-v1`
- Content digest: `1b496a087a3c9f576164c83653736dbd40f6d749eeea9adffa5cda3fc127b9b6`
- Seed: `00000007-0000-4000-8000-000000000004`
- **21 input batches / 198 ordered inputs**
- Victory at tick **3673**
- Equal browser/headless semantic digest:  
  `c5462479c310b8e1a813f68fba5da1c450bcd53f065e1570bdc76f8282efb7dc`
- Only `recordedAt` excluded as wall-clock metadata

The interruption diagnostic records four committed payloads at tick 15, one interrupted outcome after repeated recovery, unchanged economy, and no Review occurrence.

Actual controlled-worker probes returned 404 for the missing application path, `/src/main.ts`, `/.env`, and `/.git/config`.

### Layout evidence

All five current Build geometry attachment files contain the three accepted viewports. I independently checked their recorded document dimensions, five panel bounds, selected essential-element clipping limits, and 23 px grid lettering: **15/15 records conform**.

I visually inspected the existing minimum-viewport held-update Build and offline Combat screenshots. Their primary panels, update state, Combat board, and nine Harvest entries are visible within the captured viewport.

## 6. Frozen identity and scope

I independently reproduced the supplied aggregates at both review entry and completion:

- **Entry:** `2026-11-26T13:03:45.8149554Z`
- **Completion:** `2026-11-26T13:10:07.2744005Z`

| Identity | Observed value |
|---|---|
| Device | DESKTOP-DBD6QJO |
| Branch | `feature/ticket12-offline-recovery` |
| Original fixed point/current HEAD | `0fd3f7bf67c1662f01d8449f4623518b69f06a92` |
| Commits beyond original fixed point | None |
| Index changes | 0 |
| Tracked changed paths | 9 |
| In-scope untracked paths | 31 |
| Unrelated untracked paths | 502 |
| Full frozen scope | 40 paths |
| Executable/configuration/test subset | 24 paths |

**Full 40-path aggregate**

`d68a5c6b64027f73dc05df73cddd84dd82e02b4babbcf70611c12384d08436f1`

**Executable 24-path aggregate**

`dc30bd59c97de7041999415ccdc1654b516fa46243e9a8e4abb414ae49657dc8`

**Original 23-path aggregate, excluding the newly scoped existing Ticket06 test**

`636ccebc32d53478d7375e1c9b630d87a8ebcb1d5f927c128e69da5248b89f4e`

The calculation used native Windows PowerShell `Sort-Object` culture order, relative path + NUL + lowercase SHA-256(raw file bytes) + LF, then SHA-256 of the UTF-8 concatenation. All computation remained in memory.

The comparison covered the full scoped uncommitted implementation against the original fixed point, including explicitly assigned additions. The empty committed range was not mistaken for an empty implementation diff.

### Examined scope

All 40 supplied paths remained in scope and were included in both identity checks:

- All 24 executable/configuration/test paths, including the complete new delivery implementation, host changes, Build hold, both Playwright configurations, owned server, all four Ticket12 browser suites, headless boundary tests, helpers, and the existing Ticket06 test correction.
- Current authority, deployment/breakdown changes, Ticket12 contract, active plan, verification ledger, and tri-axis record.
- Historical R1–R3 review records at the relevant finding/disposition level. Archived peer records were not used as substitute proof of current correctness.
- Necessary unchanged content, Settings, Workspace lock, and Build collaborators.
- Relevant accepted implementation, UX, technical/platform, testing, and ADR authority.
- Existing compiled precache bytes, actual result reports, selected native trace events, decoded diagnostic/geometry attachments, and selected screenshots.

## 7. Limits and remaining gates

- I launched **no browser, test, build, typecheck, dependency audit, installation, server, or deployment dry-run**.
- No source, document, report, inventory, snapshot, or export was written. No staging, commit, push, merge, deployment, provider action, production access, or Player Data mutation occurred.
- The existing A/B execution’s source provenance is supplied by the coordinator and verification ledger. The original 23-path aggregate remains unchanged; I did not rebuild the variants.
- The two earlier deadline failures are preserved. Their transient latency cause remains unproven; this review does not claim it solved.
- Current Chromium evidence does not establish cross-browser certification, target-hardware performance, arbitrary future content scale, or every viewport/inventory combination.
- A permanently lost activation acknowledgment with no terminal native observation deliberately retains the hold. The code does not guess that activation was canceled.
- Browser eviction/quota remains an external limit. Conservative cache retention does not imply unlimited storage.
- **SEC-F01 remains open/non-blocking**, with its existing bounded dependency-maintenance follow-up. No risk acceptance is inferred.
- The complete new ordered gate remains required: **typecheck → explicit 336 headless → 217 development → fresh build/dry-run → 130 production → fresh A/B → 19 native → evidence/screenshot inspection and owned-resource cleanup**.

## 8. Verdicts

| Area | Verdict | New findings |
|---|---|---:|
| **Standards** | **PASS** | **0** |
| **Spec** | **PASS** | **0** |
| **Final integrated verification** | **Pending / INCOMPLETE** | Existing separate gate remains open |
| **User acceptance** | **Pending** | No acceptance inferred |
| **Publication/deployment** | **Unauthorized** | No authority inferred |

The frozen R4 implementation and test correction have no remaining Code/Spec blocker established by this review. The next required work is the separately ordered complete executable gate after the coordinator has received and synthesized all three independent R4 reports.