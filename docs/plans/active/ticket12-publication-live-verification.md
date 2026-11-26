# Execution Plan: Ticket12 Publication And Live Verification

Date: 2026-11-26 (Asia/Bangkok)

## Status

Active. User acceptance and explicit publication authorization are satisfied.
The accepted executable candidate is unchanged. Git publication and actual
production verification are in progress; no live Ticket12 result is claimed yet.

## Outcome

Publish the accepted Ticket12 offline/recovery slice through the existing
Cloudflare main integration, verify the actual HTTPS deployment in isolated
browser contexts, and leave reviewable source/provider/runtime evidence.

## Context

- [Acceptance and latest authority](../../product/TICKET12_ACCEPTANCE_20261126.md).
- [Completed engineering plan](../completed/ticket12-offline-recovery.md).
- [Contract](../../product/TICKET12_OFFLINE_CONTRACT.md), [verification](../../product/TICKET12_DEVELOPMENT_VERIFICATION.md), [review](../../product/TICKET12_CHATGPT_TRI_AXIS_REVIEW.md).
- [Consumer deployment runbook](../../deployment/CLOUDFLARE_WORKERS.md).
- Existing Windows checkout: D:\01_DCMvn\Workspace\CrossDefense.
- Source baseline and origin/main: 0fd3f7bf67c1662f01d8449f4623518b69f06a92.
- Feature branch: feature/ticket12-offline-recovery.
- Production URL: https://crossdefense.dklong2308.workers.dev.
- Worker: crossdefense; existing Workers Free static-assets configuration.

## Scope

In scope: explicit task staging, commit, push, PR and permitted merge; the
existing automatic main deployment; exact artifact/source attribution; isolated
HTTPS, service-worker readiness, offline played-loop and interruption recovery
proof; current deployment and authority records.

Out of scope: unrelated 502 untracked paths; source snapshots/bundles/exports or
replacement on-disk source inventories; ordinary user browser data; production
quota/cache-corruption/A-B fault injection; provider reviewers, credentials,
suspended orchestration, WFP/G-R/G-P and refused operations; full-MVP/general
release or Ticket02/03 acceptance; unrelated production configuration changes.

## Approach

1. Reconfirm source, remote baseline, explicit scope and accepted proof.
2. Record authorization, stage the explicit Ticket12 paths plus this plan,
   verify staged names/canonical Git content, commit and push.
3. Create PR, inspect its actual head/base/diff/checks, and merge with expected
   head protection through the repository's permitted workflow.
4. Observe the Cloudflare main build and active deployment. Do not duplicate
   the automatic deployment or enable preview builds/version URLs.
5. Verify actual production resources/build identity and secure-origin worker
   readiness. Execute focused isolated browser proof with task-owned data and
   existing public gameplay helpers; preserve actual reports and screenshots.
6. Record results, publish closeout documentation, and verify any resulting
   documentation-only main deployment. Move this plan to completed after proof.

## Risks And Recovery

- Main merges automatically affect production. Verify the exact source SHA and
  provider result before claiming success; do not bypass branch protection.
- Preserve the previous accepted deployment identity as a recovery reference;
  inspect it before selecting rollback. Prefer a normal reviewed revert if
  product regression is confirmed. No rollback is currently needed.
- Builds contain unique build IDs. Exact-byte comparisons require a matching-ID
  reproduction build or accurately scoped comparisons; never mislabel hashes.
- Git may normalize line endings. Raw accepted aggregate and canonical Git blob
  identity are distinct; verify both without rewriting accepted source.
- Keep old immutable packs/caches and Run pins. Do not clear normal player data.
- SEC-F01 remains Open/non-blocking, with the non-clean R4 dependency audit.
  No upgrade or blanket risk acceptance is inferred.

## Progress

- [x] User explicitly accepted Ticket12 and authorized publication/live proof.
- [x] Fresh origin fetch: baseline and main match; index initially empty.
- [x] Independent scope audit: 44 eligible task paths, no identified credential
  shapes, twelve linked raw reports preserved, dist-only test-control boundary.
- [x] Accepted 24-path raw executable aggregate unchanged:
  dc30bd59c97de7041999415ccdc1654b516fa46243e9a8e4abb414ae49657dc8.
- [ ] Explicit staging, canonical content verification, commit and push.
- [ ] PR inspection and permitted merge.
- [ ] Successful Cloudflare build/deployment attributed to the merged source.
- [ ] Actual HTTPS/artifact/service-worker/offline/recovery proof and cleanup.
- [ ] Publication of current closeout records and final deployment verification.

## Decisions

- 2026-11-26: The latest explicit user authorization supersedes historical
  development-only publication restrictions. Existing configuration is retained.
- 2026-11-26: Include all 44 audited paths, plus this rollout plan; preserve the
  twelve raw review reports unchanged because the review index links to them.
- 2026-11-26: Reuse existing helpers in place from a separate C-drive runtime
  harness. The local native spec/config must not target production because they
  depend on the loopback fault-control endpoint.
- 2026-11-26: Do not repeat the already accepted full R4/local gate without an
  identified risk. Perform publication-specific checks and actual live proof.

## Validation

Accepted engineering gate: typecheck, headless 336/336, development 217/217,
production 130/130, native offline/update 19/19; fresh full R4 PASS.
All browser cases ran once with one worker, zero retries and zero skips/flakes.
These are prior accepted results, not new executions by this publication phase.

Publication staging verified all 45 explicit paths against their canonical Git blobs, the accepted raw executable aggregate, all twelve unchanged raw report hashes and the preserved 502 unrelated untracked paths. The full staged whitespace check exited 2 with 33 trailing-whitespace diagnostics confined to nine raw review reports. Independent inspection confirmed exactly two ASCII spaces after nonblank prose/list text, outside code, preserving original Markdown hard breaks. All twelve reports remain verbatim. The separate check excluding only docs/reviews/ticket12/*.md passed; 45 staged paths, zero unstaged tracked changes and 502 preserved unrelated untracked paths were reconfirmed. This is a documented formatting exception, not an all-files whitespace PASS.

New live publication proof: pending. Runtime evidence will be kept under
C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket12-20261126.

## Result

Pending actual publication and production verification.
