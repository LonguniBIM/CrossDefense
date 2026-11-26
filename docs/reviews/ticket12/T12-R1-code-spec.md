# Ticket12 — T12-R1 Independent Code/Spec Review

**Standards: FAIL. Spec: FAIL.** Two bounded corrections remain: a confirmed test assertion defect, and a staged-cache recovery gap established by static tracing. Final integrated verification also remains **INCOMPLETE**; that missing proof is separate from the defects below.

All repository paths below are relative to `D:\01_DCMvn\Workspace\CrossDefense`.

## Standards

### T12-R1-CS-STD-01 — The pending-Build-write test asserts an incorrect tile count and stops before proving preservation across the update

**Native severity:** Medium  
**Gate classification:** BLOCKER  
**Confidence:** High — observed failed execution plus fixture and source inspection  
**Finding type:** Test correctness; not an observed gameplay duplication defect

**Evidence**

- `tests/e2e/ticket-12-updates.spec.ts:196–225`, particularly line 220.
- `tests/combatFixture.ts`, `combatBuild()`.
- `tests/buildFixture.ts`, `finishedBuildRun()`.
- Observed result:  
  `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\update-variants-01\browser-results.json`.
- Observed page state:  
  `...\update-variants-01\traces\ticket-12-updates-a-failed-0ab3d--exact-edit-is-acknowledged\error-context.md`.

The fixture already includes another unplaced **S / Ballistic** tile. Returning the tile from A3 therefore correctly leaves **two** buttons with the accessible name `S, Ballistic, unplaced Letter Tile`. The test expects exactly one.

The recorded failure reports **expected 1 / received 2**. Its page snapshot shows A3 empty, eight retained tiles, and the two unplaced S tiles. This supports an incorrect assertion, rather than an inference that Retry duplicated Player Data.

**Repository basis**

`docs/WORKFLOW.md`, “What Proves The Behavior?”, and `docs/patterns/encoding-invariants.md`, “Prove Both Directions”, require meaningful positive and negative behavior proof. This assertion rejects the correct allowed state and prevents the rest of the intended proof from executing.

**Impact**

The test has already verified:

- The failed native Build write preserves the preceding durable state.
- Update activation is disabled while the edit remains pending.
- The previous worker remains controlling.
- Retry clears the pending edit and re-enables activation.

It has **not** reached lines 221–225, which verify the one-operation receipt, activation of the candidate, and complete saved-state equality after reload. The existing run cannot establish those final assertions.

**Suggested correction**

Assert the returned tile’s canonical identity and saved placement state—for this fixture, `combat-run:starter:0`—and the empty A3 cell. Preserve the later receipt-count and full saved-state assertions. Using the shared label with `.first()` would remove the ambiguity without proving that the intended tile returned, so identity-based verification is preferable.

**Required proof**

Rerun this native browser case to completion, then include it in the fresh combined Ticket12 gate.

No other Standards finding was established. Documentation language, preserved existing direct dependency versions, the explicit product-test selection boundary, and the new application hold were consistent with the inspected repository requirements. I did not manufacture heuristic style findings.

## Spec

### T12-R1-CS-SPEC-01 — Retry cannot repair a damaged waiting worker’s cache

**Native severity:** Medium  
**Gate classification:** BLOCKER  
**Confidence:** High for the static control-flow defect; native browser reproduction not performed in this read-only review  
**Finding type:** Recovery/liveness defect; the existing worker’s safety rejection is correct

**Requirement**

- `docs/product/TICKET12_OFFLINE_CONTRACT.md:18`: failed or incomplete preparation remains factual and retryable.
- The same contract, lines 31–35: readiness checks stored bytes; corruption cannot establish readiness; Retry repairs required delivery resources while preserving content identities and Player Data.
- `docs/product/UX_UI_STATE_MATRIX.md`, “Offline / update available”: factual status with an actionable recovery path.

**Evidence**

- `src/infrastructure/offline/BrowserOfflineRuntime.ts:122–126`: inspection reads a waiting worker’s readiness.
- `BrowserOfflineRuntime.ts:130–153`: `retry()` repairs only `navigator.serviceWorker.controller ?? registration.active`.
- `BrowserOfflineRuntime.ts:169–172`: an activation refusal changes the message but leaves `stagedBuildId` intact.
- `src/presentation/OfflineStatusView.ts:66–72`: any non-null staged build hides Retry and continues presenting the update affordance.
- `src/sw.ts:151`: a waiting worker with incomplete required bytes correctly refuses activation.

**Concrete failing path**

1. Build A controls the page and remains fully cached.
2. Build B installs successfully and becomes the waiting worker.
3. A required response in **B’s cache** is subsequently lost or corrupted.
4. Applying B is correctly rejected by `checkCache()`.
5. Immediately after rejection, the runtime still holds B’s `stagedBuildId`, so the UI hides Retry and can still say the update is ready.
6. A later refresh detects that B is incomplete and clears the staged affordance, but Retry still only examines and repairs **A’s cache**.
7. The remaining `registration.update()` call does not reinstall unchanged B merely because B’s application cache is damaged.

The last step follows the service-worker update algorithm: it compares against the newest worker, which is the waiting worker when present, and finishes without installation when its script resources are unchanged. genui{"citation":{"refs":["turn424017173view0","turn424017173view1"]}}

Primary reference for the coordinator to reopen if citing in the final review record: [W3C Service Workers, Update and Get Newest Worker algorithms](https://www.w3.org/TR/2026/CRD-service-workers-20261029/).

**Impact**

The current A build and Player Data remain preserved; I found no evidence of a destructive update or unsafe `skipWaiting()` on this path. The defect is that the promised in-application Retry cannot restore the waiting candidate and complete the explicit safe update. Closing every application window or receiving a different future worker is not the implemented Retry action.

This differs from the passing failed-install test: a failed installation becomes redundant and can be attempted again. Here, B is already installed and remains waiting.

**Suggested correction**

Provide a bounded way for the waiting worker to repair its own manifest-owned resources with the existing integrity and size checks, and represent an incomplete staged update as retryable. Recheck B’s readiness before offering activation, while retaining the existing active build, Player Data, and safe-update admission guards.

**Required proof**

Add a native production-worker case that:

1. Prepares A and stages B.
2. Removes or corrupts one required response in B’s cache only.
3. Verifies that activation is refused and A continues controlling the page.
4. Uses the explicit UI recovery action to repair B while serving the **same unchanged B worker script**.
5. Applies B from an admitted safe point.
6. Confirms B’s offline readiness and unchanged Player Data, Run pins, and retained older content.

This finding is a **static inference from the inspected code and platform algorithm**, not a claim that I reproduced the browser scenario.

## Incomplete acceptance evidence

### T12-R1-CS-VER-01 — The final integrated gate has not been completed

**Classification:** Verification gap  
**Native severity:** Informational; no additional production defect inferred  
**Gate classification:** BLOCKER for final engineering PASS  
**Confidence:** High

The frozen records explicitly retain Pending/in-progress status:

- `docs/product/TICKET12_DEVELOPMENT_VERIFICATION.md`, “Review And Final Gate”.
- `docs/plans/active/ticket12-offline-recovery.md`, “Validation” and “Result”.
- `docs/product/TICKET12_OFFLINE_CONTRACT.md`, Verification Contract items 8–9.

The coordinator also identifies the combined final gate and existing browser regressions as unexecuted. Discovery counts of **217 development / 130 production regression cases** are selection evidence, not passing executions.

The failed Build-write test above leaves its final activation/preservation segment unproved. The waiting-cache repair path needs the new targeted proof described above. The complete required gate and final review must follow supported corrections.

### Browser artifacts independently inspected

| Evidence directory | Observed result | Scope established by that run |
|---|---:|---|
| `green-offline-layout-01` | 1 passed | Earned offline starter, Scout/Boss victory, Salvage, Review, semantic Combat parity, durable reload, and strengthened minimum/reference geometry assertions |
| `offline-interruption-01` | 1 passed | Retained committed loot, interrupted recovery once, no victory or automatic Review grants |
| `cache-preparation-negative` | 1 passed | Actual initial HTTP preparation failure, explicit Retry, preserved Pilot |
| `cache-content-boundaries` | 3 passed | Invalid HTTP candidate preserves LKG; unavailable old pin stays Content Required; active-cache integrity repair preserves Player Data |
| `update-variants-01` | 5 passed, 1 failed | Failed candidate, active-play staging/safe Build update with old pins, pending Settings, second window, actual quota; Build-write case stopped at the incorrect count assertion |

These are separate focused runs. I do not relabel them as a fresh complete combined gate.

The supplied **typecheck/build PASS and 336/336 headless tests in 37 files** were read in the task context and verification record. I did not execute those commands or independently inspect their complete command logs during this review.

## Scope and fixed comparison

### Identity verified

- **Baseline/current HEAD:** `0fd3f7bf67c1662f01d8449f4623518b69f06a92`
- **Branch:** `feature/ticket12-offline-recovery`
- **Comparison:** Uncommitted working-tree changes against the supplied baseline, plus the 17 explicitly scoped new files.
- **Tracked delta:** Eight tracked changed files.
- **Commits/index changes:** No commits beyond the baseline and no staged diff observed.
- **Frozen scope:** 25 files.
- **Aggregate independently matched:**  
  `e006738339d221e4c2bc406e1e1df191b15abe94214c1168dac5c5f3bd82d6e5`
- **Hash convention:** Original PowerShell `Sort-Object` order; each relative path + NUL + lowercase SHA-256 of raw file bytes + LF; UTF-8 outer hash. An earlier ordinal-sort calculation differed solely because it used a different ordering convention.

### Reviewed

All 25 scoped files were inspected at the relevant change level:

- Authority, contract, plan, verification, breakdown and deployment documentation.
- `package.json`; lockfile root declarations and existing-version changes; all resolved Workbox versions.
- Vite PWA configuration and complete new offline protocol/runtime/worker/status UI/CSS.
- Complete changed `main.ts` and `BuildApplication.ts`, including surrounding entry, loading, recovery, Settings and Build admission paths.
- Both Ticket12 Playwright configurations, the owned production server, both browser suites, the headless update-boundary test, and all three new helper files.

Relevant existing collaborators inspected included `WorkspaceApplication`, `SettingsApplication`, `ContentPackApplication`, fixture constructors, and the affected Build-view identity/control seams.

The lockfile inspection confirmed the exact PWA `2.0.0` / Workbox `7.4.1` additions, unchanged existing direct dependencies, and the disclosed existing `@types/estree` change from `1.0.9` to `1.0.11`. I did not repeat an audit scan.

### Not examined or performed

- No browser launched; no build, test, install, deployment, or dry-run executed by this reviewer.
- No screenshot pixel inspection; I inspected the geometry assertions and their passing recorded run.
- No peer reviewer reports read.
- No excluded pre-existing untracked files or suspended orchestration material reviewed.
- No full transitive-dependency source audit, general codebase audit, full MVP review, or release-readiness assessment.
- No file writes, source snapshots, inventories written to disk, Git mutations, provider actions, or Player Data changes.

## Verdicts

| Subaxis | Verdict | Basis |
|---|---|---|
| **Standards** | **FAIL** | One confirmed incorrect browser-test assertion prevents the required case from reaching its final proof. |
| **Spec** | **FAIL** | The waiting-worker cache has no effective explicit repair path after post-install corruption or loss. |
| **Final integrated verification** | **INCOMPLETE** | Focused evidence is substantial, but the failed case, newly identified recovery path, complete final gate, and final review remain outstanding. |

**Finding counts:** Standards **1**; Spec **1**; separate verification-gap record **1**.
