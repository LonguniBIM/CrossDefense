# Ticket12 — T12-R2 Final Full Code/Spec Review

**Standards: PASS. Spec: FAIL.** One bounded presentation regression remains: the staged-update/refusal status expands the Build header without reducing the fixed-height Build layout, placing part of the accepted bottom summaries below the reference viewport.

The R1 exact-tile assertion and waiting-cache repair findings are **fixed** in the examined source and passing recorded native cases. The activation-lifetime correction also preserves the admitted boundary in the examined source and recorded delayed-worker scenarios.

**Integrated verification remains INCOMPLETE** because the separately ordered final executable gate has correctly not begun. That pending gate is not counted as another production defect.

This is **one isolated Code/Spec reviewer**, returning separate Standards and Spec assessments. I did not read or solicit current R2 peer reports.

All repository paths below are relative to:

`D:\01_DCMvn\Workspace\CrossDefense`

## Standards

**Native verdict: PASS. Normalized verdict: PASS.**

No Standards findings.

The reviewed changes preserve the documented application/domain ownership, English-only repository language, immutable content identity, separate Player Data ownership, explicit product-test selection, and development-only authority.

The dependency comparison found the five exact PWA/Workbox additions, **334 new package locations**, no removed locations, and only the disclosed existing `@types/estree` change from `1.0.9` to `1.0.11`. Existing direct dependency versions remain unchanged. New resolved locations use npm registry HTTPS URLs with integrity metadata; none is marked with an installation script in the lockfile. This was a structural lockfile review, not a dependency-source audit or a fresh audit execution.

The repaired browser assertion now checks the exact returned tile and durable state instead of rejecting a legitimate duplicated accessible label. No additional weak naming, formatting, or abstraction preferences are being reported as repository violations.

## Spec

**Native verdict: FAIL. Normalized verdict: FAIL.**

### T12-R2-CS-SPEC-01 — Staged-update and refusal status pushes Build’s bottom summaries outside the reference viewport

| Field | Assessment |
|---|---|
| **Native severity** | **Medium** |
| **Gate classification** | **BLOCKER — accepted presentation regression** |
| **Confidence** | **High** for the observed reference-viewport overflow and source cause |
| **Finding type** | Layout correctness |
| **Data/update safety impact** | No Player Data loss or unsafe activation inferred |

#### Requirement

The accepted presentation contract places Equipped Tiles below Ship Grid, Equipped Words at bottom-right, and Cargo through both rows. It defines **1366 × 768** as the reference gameplay viewport and **1280 × 720** as the minimum, with bounded regions for long Build content.

Relevant authority:

- `docs/product/IMPLEMENTATION_SPEC.md`, **Accepted Visual Baseline** and **Testing Decisions / Layout**.
- `docs/product/UX_UI_STATE_MATRIX.md:65–66`, preserving the gameplay viewport and bounded content regions.
- `docs/product/UX_UI_DESIGN.md`, **Current Annotated Layout Refinement** and accepted visual handoff.

The accepted baseline’s existing executable layout assertions make the intended fit concrete:

- `tests/e2e/ticket-04-ui.spec.ts:35–43`: Build panels and document must remain within each selected viewport.
- `tests/e2e/ticket-04-ui.spec.ts:123–136`: the minimum-viewport case checks the bottom Equipped Tiles/Words panels and document height.

These existing assertions support the accepted behavior; I am not inventing a new layout policy from a preferred implementation style.

#### Source evidence

- `src/presentation/OfflineStatusView.ts`, `attach()`: the delivery element is appended inside `.bu-header > div:first-child`.
- `OfflineStatusView.ts`, `render()`: both the status and staged-update message can occupy additional rows. During delayed activation, the long pending message appears in both locations.
- `src/presentation/offline.css:1,9–10`: the added Build delivery block occupies normal document flow and is constrained to a 400 px maximum width.
- The collaborating, unchanged `src/presentation/build.css:7` still assigns `.bu-layout` a fixed `height: calc(100dvh - 154px)`. Its height does not account for the added delivery rows.
- The flexible-height override near the end of `build.css` applies only when the Attempt recovery notice is present. It does not cover the ordinary historical Build used by the update-lifetime cases.

#### Independently inspected native evidence

The fresh `r1-remediation-full-01` report uses the configured **1366 × 768** viewport. I read the following existing PNG metadata directly on the authorized device and visually inspected the two identified screenshots:

| Recorded state | Full-page PNG dimensions | Observation |
|---|---:|---|
| Activation held before native `skipWaiting` | **1366 × 873** | The page extends 105 px beyond the reference viewport. |
| Activation held during native activation | **1366 × 873** | Visual inspection confirms bottom Equipped Tiles content lies below 768 px. |
| Definitive refusal, restored interactive Build, and successful Undo | **1366 × 844** | Visual inspection confirms lower Equipped Tiles rows remain below the viewport after the hold has been released. |

Evidence paths:

- `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r1-remediation-full-01\traces\ticket-12-update-lifetime--ddf6a-l-the-safe-reload-completes\lifetime-held-before-skip-waiting.png`
- `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r1-remediation-full-01\traces\ticket-12-update-lifetime--d1b63-l-the-safe-reload-completes\lifetime-held-during-activation.png`
- `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r1-remediation-full-01\traces\ticket-12-update-lifetime--f5da5-dged-Build-and-Undo-history\lifetime-refusal-restored-build.png`

The third artifact is material: this is not confined to a temporarily inert screen. The native diagnostic records `inert: false`, the same document and Build, the actual second-window refusal, and restored Undo history.

The lifetime cases correctly pass their update-safety assertions. They capture these images but do not assert Build geometry, so their PASS does not establish layout conformance.

#### Consequence

The delivery status introduces document-level expansion and moves part of the accepted bottom summary outside the reference viewport. The ordinary offline saved Build and interrupted Build screenshots are each **1366 × 768**, so the observed failure is associated with the taller update-state header, not a claim that every Build screen overflows.

#### Suggested correction

Make the available Build region account for the actual header/status height, or fit the delivery status into the existing layout budget. Preserve the factual update/refusal message and the accepted summaries; use the existing bounded Build regions where scrolling is needed.

#### Required proof

After correction:

1. Assert document and panel bounds at **1280 × 720**, **1366 × 768**, and **1920 × 1080** for staged-update, delayed-activation, and restored-refusal Build states.
2. Keep the actual update-lifetime and same-Build/history assertions intact.
3. Include the existing Build and Pre-Run layout regressions in the required production gate, since the delivery view also attaches to their headers.
4. Retain the current screenshots as the observed regression evidence.

I did not launch a browser or reproduce a new 1280 × 720 run during this read-only review.

## R1 finding dispositions

| Historical ID | R2 disposition | Examined correction and proof |
|---|---|---|
| **T12-R1-CS-STD-01** | **Fixed** | `ticket-12-updates.spec.ts` now asserts exact `combat-run:starter:0`, empty A3, eight retained tiles, revision 5, one receipt, candidate activation, and full native-state equality. The complete case passed once in the fresh 17-case report. |
| **T12-R1-CS-SPEC-01** | **Fixed** | `REPAIR_CACHE` operates through the contacted worker’s own manifest, keys, integrity, size limit, and bounded network request. Candidate identity and readiness are separate. The native case damages only B, observes refusal, reaches explicit Retry, verifies the same waiting worker and unchanged script, applies B, then proves offline readiness and preserved saves/pins. |
| **ARCH-T12-001** | **Correction corroborated within Code/Spec scope** | `activateAndObserve()` retains admission after the notification deadline and waits for native activation or terminal refusal/redundancy. Recorded native delays exceed 15 seconds before `skipWaiting`, during activation, and before the real window check. This is not a replacement verdict for the independent Architecture axis. |
| **SEC-P01** | **Specific unfinished-case proof resolved** | The corrected native Build-write case now reaches its final activation and complete saved-state comparison. |
| **T12-R1-CS-VER-01** | **Still pending as the separate integrated gate** | The fresh final complete executable gate remains required after review and any supported corrections. No additional production defect is inferred from that ordering. |
| **SEC-F01** | **Historical bounded follow-up retained** | The disclosed non-clean dependency audit is not reclassified as clean or accepted risk. I did not execute another audit or independently reassess advisory reachability. |

## Verification independently examined

### Frozen identity

I independently verified:

- **Branch:** `feature/ticket12-offline-recovery`
- **Original baseline and current HEAD:** `0fd3f7bf67c1662f01d8449f4623518b69f06a92`
- **Commit range beyond baseline:** empty
- **Staged diff:** empty
- **Frozen scope:** 31 supplied paths
- **Verification time:** `2026-11-26T11:24:29.8041111Z`
- **Aggregate:**  
  `765addf4c46bf9f982b1c1ac7ceef305e602a6a510790efbeb08f3655b8b8e6f`

The aggregate uses the supplied PowerShell `Sort-Object` culture order and path + NUL + lowercase raw-byte SHA-256 + LF convention, with a UTF-8 outer SHA-256. It was computed in memory; no source inventory or snapshot was written.

The review comparison was the complete scoped uncommitted change against the original baseline, including the explicitly assigned Ticket12 additions. An empty committed range was not mistaken for an empty implementation change.

### Fresh native report

I independently parsed:

`C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126\r1-remediation-full-01\browser-results.json`

Observed report properties:

- **17 expected/passing cases across three files**
- Exactly **one passed result per case**
- **One worker**
- **Zero retries**
- **Repeat one**
- **Zero skipped, unexpected, flaky, or global errors**
- Reported duration **182.940 seconds**

I also decoded and inspected the bounded attachments for:

- Four actual controlled-worker **404** responses.
- Current minimum/reference Combat geometry.
- Complete offline scenario parity.
- Offline interruption recovery.
- All three delayed native worker lifetimes.
- The waiting-cache refusal.

The current parity diagnostic reports:

- App build `ticket12-a`
- `development-review-ship-v1`
- `development-combat-ruleset-v1`
- Seed `00000007-0000-4000-8000-000000000004`
- **21 input batches / 198 ordered inputs**
- Victory at tick **3673**
- Equal browser/headless digest:  
  `728e3411b552c50db8004712b999980be74b67104b6ec09fca207e5b4b28f507`
- Only `recordedAt` excluded as wall-clock metadata.

The interruption attachment records **four committed payloads at tick 15**, one interrupted outcome after repeated recovery, unchanged economy, and no Review occurrence.

The delayed-worker attachments independently show the admitted root still inert after **16,522 ms**, **16,513 ms**, and **16,509 ms**, respectively. Activation cases subsequently reload into B. The genuine refusal preserves the original document and permits an acknowledged Undo afterward.

These are inspected recorded executions, not tests executed by this reviewer.

## Examined scope

All **31 supplied paths** were reviewed at the relevant change level:

- Authority, deployment/breakdown changes, active Ticket12 plan, contract, verification, tri-axis record, and all three historical R1 reports.
- `package.json`, structural comparison of the complete baseline/current lockfiles, and Vite PWA configuration.
- Complete new offline protocol, browser runtime, service worker, status view, and CSS.
- The full changed `main.ts` and `BuildApplication.ts`, including surrounding entry, recovery, Settings, Build, Attempt, results, and Review transitions.
- Both Ticket12 Playwright configurations and the owned production server.
- The headless update-boundary file, all three Ticket12 browser suites, and all four helper files.

Relevant unchanged collaborators included the Workspace/Settings/content application owners, local content repository, Workspace write lock, Pre-Run view/layout, Build layout, Combat layout, and relevant existing minimum/reference viewport assertions.

Standards and requirement sources included `AGENTS.md`, `docs/WORKFLOW.md`, `CONTEXT.md`, the invariant-encoding pattern, approved implementation specification and Ticket12 breakdown, UX state/design contracts, pertinent technical/platform architecture sections, testing strategy, and ADR 0009.

## Not examined or performed

- No browser launch, test execution, build, typecheck, installation, audit, deployment dry-run, or production operation by this reviewer.
- Current typecheck/build PASS and the earlier **336/336 headless** result were read as coordinator/verification-record evidence; their complete logs were not independently audited here.
- No fresh hash-by-hash inspection of the current compiled precache artifact.
- No general baseline audit, full MVP assessment, full transitive-dependency source audit, or cross-browser certification.
- No current R2 peer reports read or solicited.
- No excluded pre-existing untracked work or suspended orchestration reviewed.
- No file writes, copied source, source exports/snapshots, on-disk inventories, Git mutations, provider actions, or Player Data changes.

## Verdicts

| Area | Native verdict | Normalized verdict | Findings |
|---|---|---|---:|
| **Standards** | **PASS** | **PASS** | 0 |
| **Spec** | **FAIL** | **FAIL** | 1 Medium presentation blocker |
| **Integrated verification** | **INCOMPLETE** | **INCOMPLETE** | Separate final gate remains pending |
| **User acceptance** | **Pending** | **Pending** | No acceptance or publication authorization inferred |

The R1 Code/Spec corrections are resolved. **T12-R2-CS-SPEC-01** is the remaining Code/Spec blocker established by this full review.