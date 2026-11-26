# Execution Plan: Cloudflare Static Deployment

Date: 2026-11-26 (Asia/Bangkok)

## Status

Completed. The accepted Ticket11 build is deployed on Cloudflare Workers Free,
public HTTPS delivery matches the accepted artifact, and live browser checks
passed. The production repository connection targets main. This record captures
the first verified rollout; the closeout merge is checked in Cloudflare before
the final user handoff.

## Outcome

Publish the accepted CrossDefense Ticket11 build on Cloudflare Workers Static
Assets Free, connect production builds to the main branch, and verify the actual
HTTPS application.

## Context

- The user accepted Ticket11 and authorized commit, push, merge and deployment.
- On 2026-11-26 the user selected Cloudflare Workers Static Assets Free and asked
  the agent to deploy, requesting instructions for steps requiring user action.
- Starting branch: main.
- Starting commit: 47555a2856e49ef397d337b3af83e89a30e02985.
- Preparation branch: deploy/cloudflare-static-assets.
- Closeout branch: deploy/cloudflare-live-closeout, based on merged main
  2bb3619f2a5dd15a6e38ee8bff86eca4e5b1568b.
- Starting tracked/index changes: none. Existing untracked paths: 502.
- Accepted product evidence: [Ticket11 acceptance](../../product/TICKET11_ACCEPTANCE_20261126.md).
- Operational instructions: [Cloudflare deployment](../../deployment/CLOUDFLARE_WORKERS.md).

## Scope

In scope:

- Minimal static-asset Wrangler configuration for the existing dist output.
- Exact deployment toolchain versions and deployment documentation.
- Commit, push and merge the verified configuration.
- Cloudflare Free account/project connection, main-branch build configuration,
  initial deployment and live smoke verification.

Out of scope:

- Ticket12 offline caching, service workers and update lifecycle.
- Gameplay, content pins, persistence schemas and user data migration.
- Paid plans, custom-domain purchases, backend functions and cloud databases.
- Suspended provider review/orchestration, WFP/G-R/G-P, refused snapshots and
  replacement source inventories. Existing unrelated files remain untouched.

## Approach

1. Prepare configuration before Cloudflare GitHub import to avoid autoconfig
   changing the existing application.
2. Pin Node to the previously validated 24.13.1 and resolve an exact Wrangler
   version from npm; preserve existing application dependency pins.
3. Run typecheck, existing headless tests, a fresh build and Wrangler dry-run.
   Verify static HTTP routing and browser startup on an owned local instance.
4. Review the bounded diff and publish through a pull request.
5. Connect only LonguniBIM/CrossDefense to the user's Cloudflare account, use main
   for production, and disable branch preview builds for the initial rollout.
6. Deploy, inspect provider evidence and smoke-test the production HTTPS URL.

## Risks And Recovery

- A new origin has separate IndexedDB storage; localhost saves do not migrate.
- Missing content URLs must return a real 404; no SPA fallback is added.
- Use a new Worker named crossdefense; inspect any existing same-name resource
  before changing it. Never overwrite an unrelated project.
- Stop only local verification processes created by this task.
- Before the first successful deployment there is no prior Cloudflare version
  to roll back to. Later recovery uses the previous verified deployment or a
  reverted configuration commit through the normal production build.
- Do not collect passwords, one-time codes or API tokens in repository files.

## Progress

- [x] Confirm approved scope, repository baseline and platform documentation.
- [x] Prepare deployment configuration and operational guide.
- [x] Complete local validation and independent diff review.
- [x] Commit, push and merge configuration (PR #4).
- [x] Connect Cloudflare account and the selected GitHub repository.
- [x] Observe successful production deployment and verify the live application.

## Decisions

- 2026-11-26: Serve only dist as static assets without a Worker script, database,
  ASSETS binding, framework migration or Cloudflare Vite plugin.
- 2026-11-26: Keep the single-root application and normal missing-file 404s.
- 2026-11-26: Use the provider-assigned workers.dev URL before any custom domain.
- 2026-11-26: Declare workers_dev: true and preview_urls: false explicitly so
  repository deployment preserves the verified production-only URL settings.
  Branch preview builds remain separately disabled in Cloudflare.

## Validation

Local verification completed on 2026-11-26 on Windows 11, Node 24.13.1, npm
11.8.0 and Wrangler 4.168.0:

| Check | Observed result |
| --- | --- |
| npm run typecheck | PASS, exit 0 |
| Accepted tracked headless selection, one worker | 332/332 PASS in 36 files |
| npm run build | PASS, exit 0 |
| npm run deploy:check | PASS, exit 0; no live deployment |
| Fresh dist identity | 9 normal files; 29,171,985 bytes |
| Local Cloudflare HTTP asset verification | All 9 files served byte-identically |
| Missing resource / source / environment / Git paths | Four real HTTP 404 responses |
| Existing browser smoke cases on local Wrangler | 6/6 PASS, one worker, zero retries/repeats beyond one |
| Browser result audit | 0 skipped, unexpected, flaky or global-error results |
| Local runtime cleanup | No remaining port 8787 listener or task Wrangler process |
| Independent Standards / Spec / Architecture review | PASS; zero findings |
| Independent security/dependency review | PASS for this hosting diff; inherited advisories recorded below |
| git diff --check | PASS |

The fresh build SHA256 is
0313f5e54ea388603402081c2d803d9a7c41d4d99ef58c70e5e5fbe3b5e8d7b0,
identical to the accepted Ticket11 build.

The headless selection is obtained in memory with
git ls-files -- 'tests/headless/*.test.ts' and passed explicitly to Vitest with
--maxWorkers=1. This preserves the accepted 36-file product selection and does
not modify any test. No application source, content or existing test changed.

The browser smoke reuses existing Ticket01 and Ticket11 cases: Pilot identity
reload, duplicate submission, cross-tab ownership, storage recovery, keyboard
Settings access and remapping persistence. It runs against an owned Wrangler
instance on 127.0.0.1:8787, not the unrelated development server on port 4175.
Raw runtime evidence is in the ignored .scratch/cloudflare-deployment directory.
The browser JSON report is under its nested
.scratch/cloudflare-deployment/browser-results.json path; HTTP proof is
http-results.json at the task-directory root.

### Initial unrestricted local test invocation

The initial npm test command also discovered three pre-existing, untracked
orchestration files, outside the accepted product selection. It returned
382/384 passing with two failures: native PowerShell executable admission and
alias PowerShell descendant cleanup. This failed invocation remains a failure;
it is not described as product-gate PASS. The command stopped before build.
The three files are not part of the published repository, remain unchanged,
and were not rerun. A targeted process check found none of the reported owned
process IDs still running. Subsequent product validation used the previously
accepted tracked selection, not a weakened test or changed assertion.

### Dependency applicability

npm audit reports four inherited vulnerable entries: Vite 8.3.1 (High,
development), Vitest 5.0.1 and its mocker (Moderate, development), and Zod 4.6.5
(High, production). npm audit --omit=dev reports the one Zod entry. Neither
audit is claimed to pass.

Every existing lockfile package record is unchanged; Wrangler adds 129
development-only entries with official npm registry URLs and integrity values,
and has no reported advisory in this audit. Development-server endpoints are
not published. Current Zod manifest inputs use fixed same-origin content URLs
and local storage, with no new arbitrary remote-input or server parsing
endpoint. Independent review found no introduced deployment blocker.
The inherited dependency findings remain follow-up work; they are not fixed
or declared harmless by this hosting change.

## Publication And Live Verification

### Source and provider evidence

- Preparation commit: af0f5d4f4e47fe910b2219322e097919c9bcc31d.
- [PR #4](https://github.com/LonguniBIM/CrossDefense/pull/4) merged on
  2026-11-26 at 13:19:06 Asia/Bangkok (06:19:06 UTC).
- Verified initial source main: 2bb3619f2a5dd15a6e38ee8bff86eca4e5b1568b.
- The user completed Cloudflare sign-in and GitHub App authorization. The
  selected build repository was LonguniBIM/CrossDefense. The GitHub App's full
  installation repository scope was not independently audited.
- Cloudflare account: 27fba0a74375cd2f57b084513651e03a; Worker: crossdefense.
  The account plan UI showed Workers Free, $0, Current plan.
- Production branch main; root /; build npm run build; deploy
  npx wrangler deploy; branch preview builds disabled.
- The provider used Node 24.13.1 from .node-version and npm 10.9.2, installed
  with npm clean-install, and built the existing Vite application.
- Initial manual
  [build 07536199-5f88-4b09-b0da-5fc8d979a899](https://dash.cloudflare.com/27fba0a74375cd2f57b084513651e03a/workers/services/view/crossdefense/production/builds/07536199-5f88-4b09-b0da-5fc8d979a899)
  succeeded. Production version prefix 12947570 was Ready at 100% traffic,
  deployed at 16:55:16 Asia/Bangkok (09:55:16 UTC).
- No runtime secrets, bindings, Worker script or database were added.
- Initial GitHub check/status lists were empty. Their combined pending label
  was not evidence of a pending Cloudflare build; the provider UI supplied
  the actual initial deployment result.

### Public URL correction

The initial successful build had no enabled public URL. Domains showed
crossdefense.dklong2308.workers.dev with Production Worker URL disabled.
The agent enabled it under the existing deployment authorization. This also
enabled Preview URLs in the dashboard; Preview URLs were then disabled.
The observed final controls were production true and previews false.

The closeout configuration adds workers_dev: true and preview_urls: false.
Installed Wrangler 4.168.0 accepts both boolean settings. The focused dry-run
and git diff --check passed; independent configuration review found no issue.
The assets-only boundary, ordinary missing-file 404s and product output are
unchanged.

### Live HTTPS and browser results

Production URL:
[https://crossdefense.dklong2308.workers.dev](https://crossdefense.dklong2308.workers.dev)

| Check | Observed result |
| --- | --- |
| Independent public HTTP requests | 13 bounded requests, PASS |
| Application and content assets | All 9 returned 200 with expected MIME types |
| Live asset identity | Exact accepted bytes; 29,171,985 bytes total |
| Missing content, /src/main.ts, /.env, /.git/config | Four real 404 responses |
| Normal browser startup | Pilot chooser displayed at the production URL |
| Six accepted browser cases against HTTPS | 6/6 PASS in 21.3816 seconds |
| Live browser execution settings | One worker; retries 0; repeatEach 1 |
| Live browser result audit | 0 skipped, unexpected, flaky or global errors |
| Additional native-clock Pre-Run smoke | PASS |
| Native smoke runtime/asset audit | 0 page exceptions; 0 failed application asset requests |
| Owned browser cleanup | Context closed; browser disconnected; all runners exited 0 |

The independent HTTP sample ran from 17:00:05.094 to 17:00:08.872 Asia/Bangkok
(10:00:05.094 to 10:00:08.872 UTC). Its aggregate SHA256 was
0313f5e54ea388603402081c2d803d9a7c41d4d99ef58c70e5e5fbe3b5e8d7b0,
the same accepted build identity recorded above. An earlier command-transport
attempt failed during Node parsing before any HTTP request; the successful
verification passed the bounded script through standard input.

The six live cases reuse the accepted tests for Pilot identity/reload,
duplicate submission, cross-tab ownership, storage recovery, keyboard Settings
and remapping persistence. They ran in isolated contexts with no local web
server. The extra smoke used the native clock and real keyboard input:
Pre-Run focused the board automatically; ArrowLeft moved the piece from x4 to
x3; Settings paused board input; Escape restored launcher focus; explicit
Resume completed its countdown and returned focus to the board; Space
advanced the active piece.

Ignored raw evidence is in .scratch/cloudflare-deployment:
playwright.live.config.ts, live-browser-results.json and
live-native-prerun-results.json. These are verification artifacts, not
application or user data. No existing player profile was cleared or edited.

## Result

The accepted Ticket11 application is live and verified on the selected free
hosting destination. The completed record retains the initial source/build
identity; the closing publication is verified by its subsequent Cloudflare
main-branch build and the final handoff. No gameplay, content, persistence,
existing test or application dependency pin changed in the closeout.

Ticket12 remains ON HOLD. Offline reload, PWA installation, safe updates and
cloud save synchronization are not delivered by this hosting task. The
inherited dependency findings and initial unrestricted-test failure above
remain recorded with their actual scope and result.
