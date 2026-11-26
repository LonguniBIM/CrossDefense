# CrossDefense on Cloudflare Workers Static Assets

## Scope and current status

The accepted Ticket12 offline/recovery slice is deployed as static files on the Cloudflare
Workers Free plan. The user selected this destination on 2026-11-26.

The production application is live at
[https://crossdefense.dklong2308.workers.dev](https://crossdefense.dklong2308.workers.dev).
The Cloudflare dashboard showed Workers Free ($0), the selected GitHub repository,
and a successful production deployment. See
[the completed deployment record](../plans/completed/cloudflare-static-deployment.md)
for source identity, provider evidence, live verification and known limits.

Ticket12 user acceptance is Accepted. The user explicitly authorized publication and isolated production verification after the original development-only phase. Initial PR #6 was followed by the bounded canonical-index repair in PR #7, fresh full R5 review and complete ordered gate05 PASS. Corrective production artifact proof and all three live cases PASS. See the [contract](../product/TICKET12_OFFLINE_CONTRACT.md), [verification](../product/TICKET12_DEVELOPMENT_VERIFICATION.md), [review](../product/TICKET12_CHATGPT_TRI_AXIS_REVIEW.md), [acceptance](../product/TICKET12_ACCEPTANCE_20261126.md) and [publication plan](../plans/active/ticket12-publication-live-verification.md). Final closeout-record publication and verification of its resulting deployment remain in progress. The accepted Ticket11 hosting result is the predecessor. Player state stays in browser-local IndexedDB; hosting does not add cloud accounts or save sync.

## Prerequisites

- GitHub repository: LonguniBIM/CrossDefense; production branch: main.
- Cloudflare account with Workers Free available.
- Node 24.13.1, pinned in the root .node-version file.
- Install dependencies with npm ci; package-lock.json is authoritative.
- Wrangler is an exact-version project development dependency.
- The Worker name must match wrangler.jsonc: crossdefense.
- If that name already exists in the selected account, inspect its identity
  before proceeding; do not replace an unrelated Worker.

No purchased domain, Worker runtime script, cloud database or application
runtime secret is needed for this static deployment.

## Repository configuration

wrangler.jsonc serves ./dist. It has no main entry point, ASSETS binding,
run_worker_first setting or SPA fallback. Missing content paths must remain
ordinary 404 responses. Explicit workers_dev: true keeps the production hostname
enabled; preview_urls: false keeps version/preview URLs disabled. Branch preview
builds are separately disabled in Workers Builds.

Vite retains its existing root-relative /content/packs/... URLs. Publish at the
root of the provider hostname rather than a project subdirectory.

The local .wrangler directory is ignored by Git. Keep local credentials and
generated tool state out of commits.

## Local validation

Run from the repository root:

```powershell
npm ci
npm run typecheck
$productTests = @(git ls-files -- 'tests/headless/*.test.ts')
npm test -- @productTests --maxWorkers=1
npm run build
npm run deploy:check
```

The current product test selection uses each tracked headless application test
once, including Ticket12: 37 files at this publication checkpoint. Existing untracked provider/orchestration tests are
outside that boundary and must not be discovered by an unrestricted local test
run. A clean Git clone contains only the tracked product tests.

The dry-run validates the deployment without publishing it. Do not confuse this
result with an authenticated Cloudflare deployment.

To inspect the built app through Cloudflare's local runtime:

```powershell
npx wrangler dev --ip 127.0.0.1 --port 8787
```

Use port 8787 only if it is free; otherwise choose another unused port and
record it. Keep the repository's existing development port 4175 untouched.
Stop only the verification process that this run created.

## First deployment through the dashboard

1. Open https://dash.cloudflare.com/ and sign in to the intended account.
2. Open Workers & Pages, create an application, and choose the GitHub import
   route for Workers.
3. Authorize the Cloudflare Workers & Pages GitHub App when prompted. Install
   it on LonguniBIM with Only select repositories and select CrossDefense.
   Account authentication and repository installation are separate steps.
4. Select LonguniBIM/CrossDefense and configure the following:

| Setting | Value |
| --- | --- |
| Plan | Workers Free |
| Worker name | crossdefense |
| Root directory | Repository root |
| Production branch | main |
| Build command | npm run build |
| Deploy command | npx wrangler deploy |
| Node version | 24.13.1 from .node-version |
| Branch preview builds | Disabled for the initial rollout |
| Production workers.dev URL | Enabled |
| Version/preview URLs | Disabled |

5. Keep Cloudflare's managed deployment-token option. Do not paste passwords,
   one-time codes or API tokens into source files or chat.
6. Save and deploy. Inspect dependency installation, build and deploy logs.
   Record the exact source commit, provider deployment identifier and assigned
   HTTPS workers.dev URL in the execution record.
7. Open Domains and verify that Production Worker URL is enabled and Preview
   URLs is disabled. A Ready deployment with no enabled URL is not publicly
   reachable. Keep these values aligned with wrangler.jsonc.
8. Verify the live URL using the checks below.

Dashboard labels may change. The essential destination is Workers Static
Assets, with the existing Wrangler configuration and the existing repository.
Do not create a replacement application scaffold or add a framework plugin.

## Live readiness and smoke verification

Use a fresh, isolated browser profile/context for verification so existing
player data is not edited.

- The HTTPS root returns the application and the Pilot chooser appears.
- Referenced JS/CSS and the required immutable content manifests load.
- An intentionally nonexistent content resource returns 404, not index.html.
- Create a disposable Pilot, reload and confirm its identity survives.
- Open Settings with the keyboard, change one control, save, reload and confirm
  the new value. Restore defaults within the disposable verification context.
- Start the existing Pre-Run flow and check normal keyboard/focus behavior.
- Confirm there are no unexpected application exceptions or asset-load errors.

The test context owns its temporary IndexedDB data. Close that context when the
check is finished; do not clear the user's normal browser data.

## Updates and recovery

The connected repository is LonguniBIM/CrossDefense and the production branch is
main. Changes to main trigger a production build and deployment. Confirm the
new commit and Ready deployment in Cloudflare before reporting an update as
live; GitHub can have no check/status entry for an initial manual build.
Keep branch preview builds disabled for this initial rollout.
If previews are intentionally enabled later, current Workers Builds uses
npx wrangler preview as its preview command.

The first verified production build used main revision
2bb3619f2a5dd15a6e38ee8bff86eca4e5b1568b and Cloudflare version prefix
12947570. Its
[build record](https://dash.cloudflare.com/27fba0a74375cd2f57b084513651e03a/workers/services/view/crossdefense/production/builds/07536199-5f88-4b09-b0da-5fc8d979a899)
was successful on 2026-11-26. For later failures, use a previously verified
Cloudflare deployment or revert the offending repository change through the
normal main-branch workflow. Record the selected version and verify the
resulting live URL.

A production build must retain the approved immutable content versions. Do not
delete older content packs while existing Runs can still reference them.

## Local data and offline limits

IndexedDB is scoped to the browser profile and origin. localhost, preview URLs
and the production hostname have separate stores; the first visit to a new
origin is expected to show a fresh Workspace.

Ticket12 prepares the application shell and all six approved immutable packs.
Wait for Ready offline before relying on offline reload. The verified live flow
covers offline create/continue, Pre-Run, Build, an earned Attempt result,
Salvage, optional Review and durable reload. Interruption recovery preserves
committed progress; it does not resume exact mid-Combat state or grant victory
rewards. Cache repair preserves authoritative Player Data and original Run pins.

Updates stage while the current page retains its App build. Explicit activation
is restricted to entry/Build after pending writes and requires compatible client
ownership. Complete local native A/B tests prove the delayed-activation,
refusal, cache-repair and quota boundaries; production proof used isolated
contexts without destructive cache/quota fault injection.

Browser storage availability and retention remain outside the application's
guarantees. Clearing site data or storage eviction can remove local progress or
cached resources; hosting provides no backup or cross-device synchronization.
Optional PWA installation is not required to play, and browser installation UI
is not claimed as separately verified. The live evidence covers the recorded
Chromium environment, not universal browser/device behavior.

## Official references

- [Static asset configuration](https://developers.cloudflare.com/workers/static-assets/)
- [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Build image and version overrides](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Production workers.dev routing](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
- [Version URL configuration](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)

## Verified Ticket12 Application Publication

The latest application-changing publication is [PR #7](https://github.com/LonguniBIM/CrossDefense/pull/7), following [PR #6](https://github.com/LonguniBIM/CrossDefense/pull/6). This is the verified application checkpoint; subsequent documentation-only deployments have distinct build IDs and are recorded separately in the publication plan.

| Identity or proof | Observed result |
| --- | --- |
| Merged application source | b69c2972570e8e67807cba5348f487e409469e55 |
| Cloudflare build | fd715b97-34b9-4c03-8753-35a333292b61 |
| Active version at verification | 4c1c1b8a-1c52-41c3-98a8-49f00c7daf11; Ready, 100% traffic |
| App build | 0.1.0-2026-11-26T16-32-56-776Z-d969a7d3 |
| Artifact proof | 10/10 exact served files; 9/9 SRI; six packs; 10/10 MIME; 8/8 real 404s |
| Isolated live proof | 3/3 cases, one attempt each; offline native interaction, earned played loop/parity and interruption recovery |
| Runtime cleanup | Zero remaining owned contexts; normal user profiles untouched |

Cloudflare's existing /index.html canonical redirect is accommodated by the reviewed repair-only request mapping; the original cache key and integrity remain enforced and further redirects remain rejected. No provider configuration, content manifest or gameplay rule changed. SEC-F01 remains Open/non-blocking with eight affected dependency entries (six Moderate, two High).
