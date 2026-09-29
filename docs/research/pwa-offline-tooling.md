# Research: Offline Application and Content Packaging Tooling

## Question

Which service-worker/PWA tooling is a credible candidate for CrossDefense's offline-first runtime and versioned immutable Content Packs?

## Context and constraints

- CrossDefense must remain fully usable offline after one successful load.
- Authoritative Player Data is separate from replaceable runtime caches.
- Active Runs pin Content and Ruleset versions.
- Old pinned Content Packs must coexist with newer defaults while referenced.
- Bad candidate packs must not replace Last Known Good.
- The current PoC harness uses Vite 8.3.1.

## Findings

### 1. Vite PWA supports a custom Workbox service worker through injectManifest

**Claim:** `vite-plugin-pwa` supports an `injectManifest` strategy that compiles a custom service worker and injects the Workbox precache manifest.

**Evidence:** Official Vite PWA documentation: https://vite-pwa-org.netlify.app/guide/inject-manifest

**Confidence:** High

**Caveat:** CrossDefense still owns its Content Pack registry and activation rules. Service-worker precaching must not become the authority for Player Data or content activation state.

### 2. Workbox precaching is suitable for immutable offline runtime assets

**Claim:** Workbox can precache versioned application resources and route matching requests from cache after installation.

**Evidence:** Official Workbox / Vite PWA injectManifest documentation:
- https://developer.chrome.com/docs/workbox/modules/workbox-precaching
- https://vite-pwa-org.netlify.app/workbox/inject-manifest

**Confidence:** High

**Caveat:** The precache URL matching policy must account for application routing/query parameters. The PoC initially failed offline navigation because the prototype query parameter was not ignored by the precache route.

### 3. Current vite-plugin-pwa declares Vite 8 compatibility

**Claim:** `vite-plugin-pwa@1.3.0` declares Vite `^8.0.0` in its peer dependency range.

**Evidence:** npm package metadata queried on 2026-09-29:
`npm view vite-plugin-pwa@1.3.0 peerDependencies --json`

**Confidence:** High

**Caveat:** The current PoC build emits a Vite deprecation warning for `inlineDynamicImports` during service-worker compilation. The build and browser acceptance test pass, but this warning should be monitored before production lock.

## Interpretation

The strongest current candidate is:

- Vite for application build/dev tooling;
- `vite-plugin-pwa` with `injectManifest`;
- Workbox precaching inside a custom service worker;
- an application-owned validated Content Pack registry separate from service-worker caches.

This separation matches the approved architecture: the service worker owns offline transport/cache availability, while the application owns Content Pack validation, Last Known Good, active version selection, and Run pinning.

## Implications

- Do not store authoritative Player Data in service-worker caches.
- Include runtime Content Pack manifests and pronunciation audio in the offline asset strategy.
- Keep content activation explicit after schema/compatibility validation.
- Preserve old pack resources while an Active Run references them.
- Treat service-worker routing rules as testable compatibility behavior.

## Unknowns / follow-up

- Production cache-retention policy for old, no-longer-referenced Content Packs.
- Update UX for newly available application versions.
- Whether the current Vite deprecation warning is removed by a future vite-plugin-pwa release before production stack lock.
- Final production hosting headers and cache-control policy.

## Sources

- https://vite-pwa-org.netlify.app/guide/inject-manifest
- https://vite-pwa-org.netlify.app/workbox/inject-manifest
- https://developer.chrome.com/docs/workbox/modules/workbox-precaching
- npm package metadata for `vite-plugin-pwa@1.3.0`, queried 2026-09-29
