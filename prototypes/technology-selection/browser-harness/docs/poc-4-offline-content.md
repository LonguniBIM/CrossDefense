# PoC-4 — Offline Application and Versioned Content Packs

## Status

Verified green on 2026-09-29 in the user's Windows development environment.

## Prototype question

Can the application launch and continue to load validated versioned Content Packs and pronunciation audio after network loss, while rejecting an invalid candidate and keeping old pinned content available?

## Candidate tooling

- Vite 8.3.1
- vite-plugin-pwa 1.3.0
- Workbox precaching 7.4.1
- Zod 4.6.5 for Content Pack runtime validation
- Playwright 1.63.0 for real-browser offline acceptance

## Prototype shape

The production build uses a custom Workbox service worker through `vite-plugin-pwa` `injectManifest`.

The precache contains:

- application shell and generated JavaScript chunks;
- Content Pack v1;
- Content Pack v2;
- an intentionally invalid candidate pack;
- a generated offline pronunciation WAV asset for `LASER`.

The application layer separately validates Content Pack manifests and records:

- active version;
- Last Known Good version.

The service worker does not own content activation policy or Player Data.

## Pass criteria

PoC-4 passes only if a real production build proves:

1. the service worker installs and controls the application after initial load;
2. valid Content Pack v1 can activate;
3. an invalid candidate is rejected without replacing Last Known Good;
4. valid Content Pack v2 can activate;
5. after the browser is switched offline, both v1 and v2 remain loadable;
6. pronunciation audio remains available offline;
7. the application route can reload while offline;
8. active/Last Known Good state survives that offline reload.

## Observed evidence

Environment:

- Windows 11 Home
- Node.js v24.13.1
- npm 11.8.0
- Vite 8.3.1
- vite-plugin-pwa 1.3.0
- Workbox 7.4.1
- Playwright 1.63.0
- Chromium 153.0.8010.12

Validation:

```text
npm run typecheck
PASS (exit code 0)

npm run test:poc4
vite build
PWA injectManifest: 13 precache entries, 241.95 KiB
Playwright: 1 passed (1.2 s)
PASS (exit code 0)
```

The offline browser test verified:

- v1 activation;
- invalid candidate rejection with v1 preserved as Last Known Good;
- v2 activation;
- offline fetch of both v1 and v2;
- offline fetch of the pronunciation WAV asset;
- offline application reload;
- preserved active/Last Known Good state after reload.

## Defects found during PoC execution

### First-load service-worker control deadlock

The initial test waited for `controllerchange` before reloading a page that already had an active service-worker registration but was not yet controlled.

Observed evidence showed:

```text
secure true
registrations: active=activated
controller: null
```

The test was corrected to wait for service-worker readiness, then reload when the first page was not yet controlled.

### Offline query-route miss

The first offline reload failed with `ERR_INTERNET_DISCONNECTED` because the prototype URL `/?poc=4` did not match the precached `index.html` route while the `poc` query parameter was retained.

The service worker now configures Workbox precache routing to ignore the prototype-only `poc` query parameter, after which offline reload passed.

This is useful evidence that application route semantics must be part of service-worker acceptance tests.

## Decision

Keep the following as the leading offline stack:

- **Vite**
- **vite-plugin-pwa using injectManifest**
- **Workbox precaching**
- **application-owned Zod validation and Content Pack activation registry**

The service worker owns offline availability. It does not own authoritative Player Data, Content Pack validity, Last Known Good selection, or Run pinning.

## Compatibility note

`vite-plugin-pwa@1.3.0` declares Vite 8 compatibility, and the PoC is green. The current build emits a non-fatal Vite deprecation warning concerning `inlineDynamicImports` during service-worker compilation. Monitor this warning before production lock, but it is not currently a functional blocker.

## Remaining uncertainty

- Production cache cleanup for old unreferenced Content Packs.
- Application-update UX and safe activation boundary.
- Production hosting/cache-control headers.
- Final audio asset format/voice source and licensing.
