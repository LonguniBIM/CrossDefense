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

## Historical Deferrals (Before 2026-10-01 Approval)

The following choices are not yet justified by evidence and remain open:
- overall UI framework;
- Combat renderer for the fixed-camera 2.5D direction approved in Q286 (2026-09-30);
- dedicated state-management library;
- production audio abstraction/library beyond browser-native capability;
- detailed content-authoring/compiler implementation.

These are not blockers for the settled Domain, persistence, offline, testing, or Build architecture. They should be resolved only when UX/UI Detailed Design or a renderer-specific prototype creates a concrete need.

## Follow-Up Evidence (2026-09-30)
Q286 authorizes fixed-camera 2.5D Combat. The [renderer experiment](../../prototypes/fixed-camera-renderer/RESULTS.md) demonstrates a readable DOM/Three.js fixture on Intel UHD Graphics with focused pause/recovery checks. This supplements the foundation PoCs; it does not settle the production renderer or overall UI framework. The active follow-up is [UI components and renderer refinement](../plans/completed/ui-components-fixed-camera-renderer.md).

## Next phase

The user accepted the current refined visual design on 2026-10-01 (Asia/Bangkok). Proceed through the [refreshed implementation specification](../product/IMPLEMENTATION_SPEC.md) and [proposed tickets](../product/IMPLEMENTATION_BREAKDOWN.md). T1-T4 propose typed DOM for the first slice, a Three.js renderer adapter, Application-owned projections without a state library, and a small validated development pack. T1-T4, the refreshed specification and all 12 tickets were approved on 2026-10-01 at 02:48 Asia/Bangkok; see [ADR 0012](../adr/0012-first-durable-slice-presentation-and-content.md). Prior deferrals above are historical for this slice. Existing ADRs remain accepted. Execution is explicitly ON HOLD until the user asks to begin.
