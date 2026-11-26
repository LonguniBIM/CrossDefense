# Execution Plan: Ticket12 Offline Slice And Recovery

Date: 2026-11-26 (Asia/Bangkok)

## Status

Engineering work complete. Implementation, the fresh full R4 ChatGPT tri-axis review and the subsequent complete ordered executable gate passed. Current diagnostics/screenshots were inspected and owned-resource cleanup was verified. User acceptance was explicitly granted on 2026-11-26; publication is explicitly authorized; live verification is pending. The accepted live deployment remains Ticket11.

## Outcome

Complete the approved durable slice through a real production service worker: successful cache preparation, offline create/continue, Pre-Run, Build, Attempt, result/Salvage, optional Review, and return to Build. Preserve committed progress, recover interruptions through the existing lifecycle, stage App updates until a safe entry/Build boundary, and retain immutable pinned content.

## Context And Authority

- The user's Ticket12 new-session instruction explicitly accepts the completed Ticket11 Cloudflare deployment and lifts Ticket12 ON HOLD for development-only implementation and verification.
- Read AGENTS.md, docs/WORKFLOW.md, CONTEXT.md, docs/product/IMPLEMENTATION_BREAKDOWN.md (Ticket12), docs/product/IMPLEMENTATION_SPEC.md, docs/product/UX_UI_STATE_MATRIX.md, and the technical/platform/testing architecture.
- Verified starting branch: main. Starting HEAD: 0fd3f7bf67c1662f01d8449f4623518b69f06a92. No tracked or index changes; 502 pre-existing untracked paths preserved.
- Working branch: feature/ticket12-offline-recovery in the existing Windows checkout on DESKTOP-DBD6QJO.
- Existing accepted deployment remains https://crossdefense.dklong2308.workers.dev. Main automatically deploys. No staging, commit, push, merge, deployment, or Cloudflare configuration changes are authorized for Ticket12.

## Scope

In scope: production PWA caching, factual cache/readiness/update UI, safe update coordination, conservative content retention, integrated deterministic/durability/offline verification, necessary contract and evidence records, and independent ChatGPT Code/Spec, Architecture, and Security reviews.

Out of scope: new gameplay/content policy, full MVP/release acceptance, changes to Ticket02/03 acceptance, provider reviewers or review credentials, suspended orchestration, WFP/G-R/G-P, refused snapshots/bundles/exports, and replacement on-disk source inventories.

## Approach

1. Inspect existing public application seams, production bootstrap and content storage, and compatible Workbox/vite-plugin-pwa metadata.
2. Record a precise Ticket12 contract tied to accepted decisions. Preserve the existing active/default/LKG owner and Player Data storage.
3. Implement one behavior-focused red/green slice at a time. Configure full required precaching, truthful readiness, and safe staged updates without active-play hot swaps.
4. Exercise native IndexedDB, Web Locks and service workers on an owned loopback production origin with isolated Chromium contexts. Use real input paths for the complete gameplay loop and targeted storage/network failures only where needed.
5. Run the explicitly selected tracked product tests plus all new Ticket12 product tests, typecheck, production build, relevant existing browser regressions, and deployment dry-run where affected.
6. Freeze the changed set for independent ChatGPT-only tri-axis review. Fix supported findings, rerun affected checks, and finish the complete integrated gate.
7. Close only owned resources; update evidence and move this plan to completed only when validation is complete.

## Risks And Recovery

- Two existing manifests exceed 14 MB each. A default Workbox size limit would omit required assets; build and cache preparation must prove completeness.
- Cache Storage/content bodies are replaceable; IndexedDB Player Data is authoritative. Cache failure must not erase or replace a Pilot/Run.
- A waiting worker must not activate during play or pending writes; other open clients must not lose required code/content.
- Preserve all shipped immutable pack versions for this bounded slice; no speculative garbage collector is needed.
- Use only task-owned production build servers and isolated Chromium contexts. Keep normal browser data and the accepted production origin intact.
- Never invoke unrestricted headless discovery: it includes suspended untracked orchestration tests. Explicitly add new Ticket12 tests to git ls-files selection.

## Progress

- [x] Read handoff and repository guidance; verified branch, HEAD and working tree.
- [x] Created an isolated local feature branch without staging or committing.
- [x] Record contract and current authority.
- [x] Implement and prove production offline preparation/readiness.
- [x] Complete safe-update lifetime and waiting-cache repair corrections identified in initial review; retain content proof.
- [x] Prove offline gameplay, interruption recovery and deterministic digest parity, including strengthened viewport geometry.
- [x] Resolve R1 findings and complete the second full independent tri-axis round.
- [x] Resolve the supported R2 Build-layout and Content-Retry lifetime blockers, then complete a fresh full independent R3 round: all axes PASS.
- [x] Preserve failed ordered gates, diagnose their evidence, and correct the Map test to wait for its actual target view; all 15 affected production cases passed.
- [x] Complete a fresh full independent R4 review against the original fixed point: Standards, Spec, Architecture and Security PASS.
- [x] Complete final integrated verification, current evidence/screenshot inspection, owned-resource cleanup and factual engineering closeout.
- [x] Record the user's explicit Ticket12 acceptance on 2026-11-26; retain the separate publication boundary.

## Decisions

- 2026-11-26: Existing approved decisions in the handoff govern this scope; no Q17 reconfirmation is required.
- 2026-11-26: Work directly in the existing authorized Windows checkout; do not recreate any refused source snapshot/export operation.
- 2026-11-26: rg is unavailable on the remote device; use git grep, git ls-files and bounded PowerShell reads. This is tool friction only, not a Harness change.

## Validation

See [development verification](../../product/TICKET12_DEVELOPMENT_VERIFICATION.md) for the actual focused executions, preserved failures, native offline outcome/recovery, current geometry proof and dependency observations. See [tri-axis review](../../product/TICKET12_CHATGPT_TRI_AXIS_REVIEW.md) for the R1-R4 frozen identities, complete raw reports, preserved historical verdicts and final dispositions.

Historical checkpoints through the pre-R4 correction: R1 returned Standards FAIL, Spec FAIL, Architecture FAIL and Security PASS. Root accepted the incorrect fixture assertion, waiting-worker cache repair gap and indeterminate activation lifetime blocker. Those corrections passed the fresh 17-case native selection. R2 independently confirmed them but returned Standards PASS, Spec FAIL, Architecture FAIL and Security PASS for new Build-layout and Content-Retry ownership blockers. Both were reproduced against unchanged R2 compiled builds. The Content Retry correction passed its two native cases; Build status layout was corrected, and an additional unmodified legacy Pre-Run overflow test identified a component-style cascade issue, also corrected. The affected 15-case existing production UI selection and the fresh complete 19-case native selection now pass, with no retries, skipped/flaky/global errors or duplicate attempts. All failed evidence is retained. The fresh full R3 review subsequently passed every axis with an unchanged frozen source identity. The first separate gate passed typecheck and 336 headless cases, then failed one 5000 ms Build setup deadline in the 217-case development run. Native trace showed late successful Build publication; the unchanged original case passed one isolated execution and a three-repeat diagnostic. No source, assertion or timeout was changed. The second gate stopped at an unchanged headless Map-case deadline (335/336 passed), accompanied by broad execution slowdown. The unchanged isolated case then passed in 3.97 seconds. The underlying latency cause remains unproven. The third complete ordered gate passed typecheck, 336/336 headless, 217/217 development, fresh build and dry-run, then failed CS06-03 in the production selection (129/130 passed). Trace proved that its immediate measurement targeted transitional Loading rather than mounted Map. Adding the exact Map-ready assertion preserved all geometry bounds and passed the complete fifteen-case production file. No production code or timeout changed. A fresh full R4 review and subsequent complete ordered gate were required at that checkpoint. No focused runs are stitched into a complete-gate claim.

The fresh full R4 review subsequently passed all axes. The separate post-R4 complete ordered gate passed on the unchanged twenty-four-path executable candidate: typecheck; 336/336 headless cases in 37 files; 217/217 development cases in 36 files; fresh build and Wrangler dry-run; 130/130 production cases in 13 files; fresh A/B builds; and 19/19 native cases in four files. Browser stages used one worker, zero retries and one repeat, with one passed result per case and zero skipped, flaky, unexpected or global errors. Exact stage results, final build identities, diagnostic/screenshot inspection and cleanup evidence are recorded in development verification. Earlier failed runs remain failed historical evidence.

## Result

Ticket12 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS (fresh full R4) / User acceptance Accepted, development-only. The complete post-R4 ordered gate, current evidence/screenshot inspection and owned-resource cleanup are complete. Historical failed runs and R1-R3 review outcomes are preserved. No Ticket12 staging, commit, push, merge, deployment or production configuration change has occurred. The live production application remains the accepted Ticket11 checkpoint.


## User Acceptance — 2026-11-26

The user explicitly accepted the completed Ticket12 result after the engineering closeout; see the [acceptance record](../../product/TICKET12_ACCEPTANCE_20261126.md). The accepted executable candidate was reconfirmed unchanged before these documentation updates. Publication remains a separate pending authorization because main automatically deploys. No new implementation, runtime test, staging, commit, push, merge or deployment is claimed by this acceptance update.

## Later Publication Authorization - 2026-11-26

The user subsequently explicitly authorized publication and production verification. The engineering work remains complete; execution and actual live results belong to the [publication plan](../active/ticket12-publication-live-verification.md). Earlier no-publication statements above describe their historical checkpoints.
