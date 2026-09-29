# Technology Selection Result

Date: 2026-09-29

## Status

Technology Selection + targeted PoCs are complete for the MVP foundation.

## Selected foundation

- Language/toolchain: TypeScript with strict settings + Vite.
- Durable player storage: IndexedDB via Dexie.
- Runtime schema validation: Zod at content/persistence/import boundaries.
- Headless testing: Vitest.
- Real-browser acceptance: Playwright.
- Offline delivery: vite-plugin-pwa + Workbox.
- Workspace write ownership: Web Locks API with diagnostic heartbeat metadata.
- Build Phase rendering: semantic DOM first.
- Build derived-state strategy: full deterministic recomputation first.
- Simulation host: remain host-agnostic and start on the main thread unless profiling later proves a Worker is needed.

## Evidence

- PoC-1: deterministic fixed-step simulation produced identical terminal digest across 30/60/144 FPS, jitter, and a simulated long stall.
- PoC-2: DOM drag/drop passed and 5,000 full Build recomputations measured about 0.10 ms p95 and 0.50 ms max in the tested browser.
- PoC-3: atomic durability, idempotency, rollback, reload recovery, and failed migration recovery passed in Chromium.
- PoC-4: production build, offline reload, versioned Content Packs, Last Known Good rejection, and offline pronunciation audio passed.
- PoC-5: exclusive write ownership, second-tab blocking, abnormal-close recovery, and explicit release passed.
- PoC-6: one shared scenario passed through Vitest headless and Playwright browser persistence with the same deterministic digest.

## Validation snapshot

Final local validation on `DESKTOP-DBD6QJO`:
- `npm run typecheck`: PASS.
- `npm test`: 1 headless test passed.
- `npm run test:e2e`: 7 browser tests passed.
- `npm run test:poc4`: production PWA build passed and 1 offline browser test passed.

A harness race was found while running the combined suite: PoC-3 exposed its API before asynchronous bootstrap completed. The entry point now publishes the API only after bootstrap, and the full suite passes. The standard Playwright configuration intentionally excludes PoC-4 because its offline service-worker test requires the production-preview configuration.

## Deliberately unresolved

The following choices are not yet justified by evidence and remain open:
- overall UI framework;
- Combat renderer / 2D engine;
- dedicated state-management library;
- production audio abstraction/library beyond browser-native capability;
- detailed content-authoring/compiler implementation.

These are not blockers for the settled Domain, persistence, offline, testing, or Build architecture. They should be resolved only when UX/UI Detailed Design or a renderer-specific prototype creates a concrete need.

## Next phase

Proceed to UX/UI + Detailed Design while preserving the accepted ADRs and the headless Domain boundary. If Combat rendering requirements become concrete enough to discriminate between renderer candidates, run a focused renderer prototype before production implementation.
