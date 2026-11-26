# CrossDefense on Cloudflare Workers Static Assets

## Scope and current status

Deploy the accepted Ticket11 application as static files on the Cloudflare
Workers Free plan. The user selected this destination on 2026-11-26.

Repository preparation and account connection are separate checkpoints. The
current execution record is
[the deployment plan](../plans/active/cloudflare-static-deployment.md).
A production URL and successful provider deployment must be observed before
the rollout is described as live.

Ticket12 offline caching and update behavior remain ON HOLD. Player state stays
in browser-local IndexedDB; hosting does not add cloud accounts or save sync.

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
ordinary 404 responses.

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

The product test selection follows the accepted Ticket11 boundary: tracked
headless application tests. Existing untracked provider/orchestration tests are
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

5. Keep Cloudflare's managed deployment-token option. Do not paste passwords,
   one-time codes or API tokens into source files or chat.
6. Save and deploy. Inspect dependency installation, build and deploy logs.
   Record the exact source commit, provider deployment identifier and assigned
   HTTPS workers.dev URL in the execution record.
7. Verify the live URL using the checks below.

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

With the GitHub connection active, changes to main trigger a production build
and deployment. Keep branch preview builds disabled for this initial rollout.
If previews are intentionally enabled later, current Workers Builds uses
npx wrangler preview as its preview command.

Before the first successful deployment there is no previous production version
to restore. For later failures, use Cloudflare's previously verified deployment
or revert the offending repository change through the normal main-branch
workflow. Record the selected version and verify the resulting live URL.

A production build must retain the approved immutable content versions. Do not
delete older content packs while existing Runs can still reference them.

## Local data and offline limits

IndexedDB is scoped to the browser profile and origin. localhost, preview URLs
and the production hostname have separate stores; the first visit to a new
origin is expected to show a fresh Workspace.

This deployment does not implement Ticket12. Do not advertise offline reload,
PWA installation or safe-update behavior as completed.

## Official references

- [Static asset configuration](https://developers.cloudflare.com/workers/static-assets/)
- [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Build image and version overrides](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [Static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
