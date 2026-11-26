# Execution Plan: Ticket12 Publication And Live Verification

Date: 2026-11-26 (Asia/Bangkok)

## Status

Active. User acceptance and publication authorization are satisfied.
Initial PR #6 deployed successfully. The canonical-index incompatibility has
a reviewed correction and complete post-R5 local gate05 PASS. Corrective
publication, actual production verification and published closeout remain.

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
- [x] Explicit staging, canonical content verification, commit and push.
- [x] PR inspection and permitted merge.
- [x] Successful initial Cloudflare build/deployment attributed to the merged source.
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

## Production Findings And Corrective Verification

Initial publication:
- Feature commit bb17ece434e8625b3cddcaa66eb555d0a40ed1d4.
- [PR #6](https://github.com/LonguniBIM/CrossDefense/pull/6), merged at
  2026-11-26T15:32:15Z as 5970b2049733e186fb3ed677d9faeb96ada44c31.
- Cloudflare build ac183c83-0570-47b6-96c2-bcf717c90dce, version
  7daa3a84-1255-465a-95ad-3d9b7ba34a58, Ready at 100% traffic.
- App build 0.1.0-2026-11-26T15-33-21-571Z-92d5d7d5.
- GitHub Workers Builds check: success at 2026-11-26T15:33:36Z.
- Independent same-ID reproduction: one build, 10/10 exact served entities,
  9/9 SRIs, six approved packs, correct MIME types and eight genuine 404
  boundaries. Evidence: publication-artifacts-01/artifact-verification.json.

T12-PUB-INDEX-01 (Fixed and Verified by R5 and complete local gate05; corrected production proof pending): Cloudflare's existing static HTML handling
returns 307 from /index.html to /. The required index precache entry uses
index.html, while repair uses redirect:error. An owned local Wrangler
reproduction established initial readiness, removed exactly its local index
cache entry, clicked public Retry and remained not ready with /index.html
missing. A native-worker probe changed only redirect:error to follow: error
failed, while follow returned the exact expected 417-byte/SRI index response.
The worker remained available, ruling out a lifecycle or content-integrity
cause. Both diagnostic contexts/servers closed; ports 8787/9230 were free.

The fix must retain strict redirect rejection and the original per-build
cache key/SRI, same-origin scope, bounded body/timeout and Player Data
ownership. No production cache was deleted. Diagnostic evidence:
publication-repair-diagnosis-01/red-result.json and probe-result.json.
The [provider HTML handling documentation](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
describes the observed canonicalization. No hosting-policy change is approved
or required by this finding.

The first three-case live run (publication-live-01) exited 1: its first case
completed functional checks but failed the failed-request audit on exactly
the four intentional 404 probes, recorded as ERR_ABORTED; two cases did not
run. Zero page exceptions or other failed application requests were recorded,
and owned cleanup completed. This remains a failed run. The next runtime
harness consumes each response body before proceeding and uses new
publication-live-02 paths, with unchanged assertions and no execution yet.

Corrective branch: fix/ticket12-cloudflare-index-repair, starting from the
initial production merge. The original Ticket12 review fixed point remains
0fd3f7bf67c1662f01d8449f4623518b69f06a92. Prior complete R1-R4 reports/results
remain historical; a fresh full R5 and an executable gate are required before
the corrected candidate is published.

## Focused Corrective Result

The correction uses a repair-only exact-index requestWillFetch hook. Workbox's
network Request changes to the scope root while its original cache request
and manifest integrity remain unchanged. Strict redirect:error is preserved.
No Cloudflare setting, manifest URL, dependency or gameplay rule changed.

The durable native regression first failed at the expected missing-index
assertion. Typecheck/build and its unchanged positive/negative assertions then
passed once on ticket12-index-repair: original index key/body/SRI, other eight
entries, complete Player Data and controlling worker were preserved, including
an offline Pilot reload. A further root redirect to a terminal correct-SRI
document was refused. Actual local Wrangler then passed the original scenario
in 3.61 seconds and recorded GET / for repair. Contexts/servers closed and
ports 4188/8787/9230 are free. All original RED and failed live evidence remains.

The separate final full R5 and complete ordered gate are pending. The original
Ticket12 fixed point stays unchanged; the entire current change set will be
frozen in memory for independent Code/Spec, Architecture and Security review.
## Result

Initial publication succeeded. Production verification remains incomplete until the canonical-index repair correction and final live proof are complete.

## Fresh R5 And Ordered Gate

The complete corrected Ticket12 change set received independent Standards PASS,
Spec PASS, Architecture PASS and Security GREEN/PASS. Root's post-review
identity check at 2026-11-26T16:03:26.5885237Z matched the full 45-path aggregate
fb99e865531e732c27dbc811fffb46023674ad577b8f4b11aae9adaf11b24669 and
24-path executable aggregate
18de1d68f8c02ef4dc8a3c6eadda64faf46f901fcd87e05df357b80fa63e135c.
The same original fixed point, branch/HEAD, empty index, twelve historical
reports and 502 unrelated paths were confirmed. Raw R5 reports and the
root synthesis are linked in the review record.

The only new Code/Spec finding was a Low/non-blocking current reproduction
recipe that repeated a newly tracked headless file. It is Fixed/Verified:
37 tracked paths are now selected once; the historical command is preserved.
No executable file changed after R5. SEC-F01 remains Open/non-blocking,
with the fresh audit returning exit 1 and the same eight affected entries.

The independent review gate is GREEN. The separate full executable gate began
in publication-final-05 at 2026-11-26T16:03:42.0556599Z. Typecheck and all 336
headless cases passed; the complete development stage is running. Production
regression, fresh A/B/native proof, corrected deployment and live verification
remain pending. The identified compatibility defect is the concrete reason
for repeating the full accepted local selection.

## Completed Local Gate05

Fresh full R5 and the separate complete ordered gate05 are PASS on executable
aggregate 18de1d68f8c02ef4dc8a3c6eadda64faf46f901fcd87e05df357b80fa63e135c.
Actual results: typecheck; 336/336 headless in 37 files; 217/217 development;
fresh production build and Wrangler dry-run; 130/130 production; fresh A/B;
20/20 native. All browser cases ran once, with no skipped/flaky/result/global
errors. Independent audits confirm exact selections, all 33 native JSON
diagnostics, 27/27 SRI entries, six packs per build, geometry and seven current
PNG inspections. The full-page Pilot PNG is 1366x816, not a no-scroll assertion.

The chain completed at 2026-11-26T16:24:03.2954061Z. Post-run identity and
cleanup at 16:27:00.4603125Z found all fifteen raw reports unchanged, empty
index, three new R5 reports plus 502 unrelated paths, no owned port listeners
and no matching test Node/Playwright Chromium processes. Detailed SHA values,
timings, diagnostics and limitations are in the verification record.

T12-PUB-INDEX-01 is Fixed and Verified locally. T12-R5-CS-STD-01 is Fixed and
Verified without changing executable code. SEC-F01 remains Open/non-blocking.
Next: publish the explicit eleven-path correction, observe its actual
Cloudflare source/version/build, and run the prepared artifact and isolated
three-case live proof. The initial failed live01 evidence remains unchanged.
