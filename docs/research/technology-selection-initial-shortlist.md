# Research: Initial Technology Selection Shortlist

## Question

Which technologies are credible first candidates for CrossDefense PoCs while preserving the approved offline-first, deterministic, headless-domain architecture?

## Context and constraints

- Repository: `LonguniBIM/CrossDefense`
- Branch for PoC evidence: `tech-selection-poc`
- Date: 2026-09-29
- Architecture authority: `docs/architecture/PLATFORM_ARCHITECTURE.md` and `docs/architecture/TECHNICAL_ARCHITECTURE.md`
- This note is a shortlist, not a production stack decision.
- Production choices remain blocked on PoC evidence.

## Findings

### 1. TypeScript is a strong candidate for Domain/Application contracts

**Claim:** TypeScript is designed as a static type checker for JavaScript and is a strong fit for explicit typed contracts across Domain, Application, Content, and Persistence boundaries.

**Evidence:** TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro

**Confidence:** High

**Caveat:** TypeScript does not provide runtime validation. External content, backup, and persisted data still require runtime schema validation.

### 2. Vite can support a host-agnostic simulation that may later move to a Web Worker

**Claim:** Vite supports standards-oriented Web Worker construction with `new Worker(new URL(...))`, including module workers and separate production chunks.

**Evidence:** Vite Features, Web Workers: https://vite.dev/guide/features.html#web-workers

**Confidence:** High

**Caveat:** Vite compatibility does not prove a Web Worker is necessary. Q215 explicitly defers main-thread versus Worker hosting to PoC evidence.

### 3. Vitest plus Playwright is a credible testing combination

**Claim:** Vitest can run tests in native browsers and officially supports Playwright as a browser provider. Playwright can emulate offline browser contexts and provides trace diagnostics.

**Evidence:**
- Vitest Browser Mode: https://vitest.dev/guide/browser/
- Playwright BrowserContext API: https://playwright.dev/docs/api/class-browsercontext
- Playwright Trace Viewer: https://playwright.dev/docs/trace-viewer

**Confidence:** High

**Caveat:** CrossDefense still needs PoC-6 to prove that one shared scenario can cover the headless Application/Domain seam while Playwright covers real browser persistence/offline behavior without duplicated test logic.

### 4. IndexedDB is the correct browser-native durability primitive to investigate

**Claim:** IndexedDB is an asynchronous browser database with transactional operations and supports structured data. Transactions are the browser-native mechanism for atomic reads/writes.

**Evidence:**
- IndexedDB overview: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- IndexedDB terminology and transactions: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology

**Confidence:** High

**Caveat:** Browser transaction semantics and durability edge cases must be proven in a real browser. An in-memory adapter is not sufficient evidence.

### 5. Dexie is a strong IndexedDB wrapper candidate for PoC-3

**Claim:** Dexie exposes explicit transactions and schema upgrade hooks over IndexedDB, matching the approved need for atomic Units of Work and explicit migrations.

**Evidence:** Dexie Transaction documentation: https://dexie.org/docs/Transaction/Transaction.html

**Confidence:** Medium-High

**Caveat:** The wrapper must not hide IndexedDB lifecycle constraints in a way that breaks the durability barrier or cross-aggregate transaction requirements. PoC-3 must prove the actual operations needed by CrossDefense.

### 6. Workbox is a strong candidate for PoC-4 offline asset/content delivery

**Claim:** Workbox supports precaching and service-worker-based offline delivery, including versioned build assets. Its documentation explicitly warns against indiscriminate precaching and supports custom service-worker logic through `injectManifest`.

**Evidence:**
- Workbox precaching: https://developer.chrome.com/docs/workbox/precaching-with-workbox
- Workbox precaching guidance: https://developer.chrome.com/docs/workbox/precaching-dos-and-donts

**Confidence:** High

**Caveat:** CrossDefense separates authoritative Player Data from replaceable runtime content. PoC-4 must prove that service-worker cache updates cannot act as Player Data updates and that old pinned Content Packs can coexist with a new default.

### 7. Web Locks API is the leading candidate for single-tab ownership

**Claim:** The Web Locks API provides origin-scoped exclusive locks across tabs and workers and is directly suited to coordinating one writable Workspace owner.

**Evidence:** MDN Web Locks API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API

**Confidence:** High

**Caveat:** CrossDefense also requires stale recovery and ownership-loss behavior. PoC-5 must prove the chosen lease/liveness policy rather than assuming the API alone solves every failure mode.

### 8. Zod 4 is a strong runtime validation candidate

**Claim:** Zod 4 provides TypeScript-first runtime schema validation, static type inference, immutable schema APIs, and first-party JSON Schema conversion.

**Evidence:**
- Zod introduction: https://zod.dev/
- Zod package reference: https://zod.dev/packages/zod

**Confidence:** High

**Caveat:** Zod should validate untrusted/content/persistence boundaries, not become the Domain model itself. Performance and bundle cost should remain proportionate to the actual schemas.

### 9. PixiJS is a strong renderer candidate, but not yet selected

**Claim:** PixiJS 8 is primarily a renderer/scene-graph library with WebGL recommended for production, a pointer-event system, and an opt-in DOM-based accessibility overlay. This aligns with the architecture in which simulation truth remains outside the renderer.

**Evidence:**
- PixiJS renderers: https://pixijs.com/8.x/guides/components/renderers
- PixiJS events: https://pixijs.com/8.x/guides/components/events
- PixiJS accessibility: https://pixijs.com/8.x/guides/components/accessibility
- PixiJS architecture: https://pixijs.com/8.x/guides/concepts/architecture

**Confidence:** High that it is a credible candidate; Low that it is already the correct final choice.

**Caveat:** PoC-2 must compare whether Build Phase is better served by DOM UI, PixiJS, or a hybrid. Rendering convenience must not pull Domain simulation into PixiJS ticker ownership.

### 10. Phaser remains a comparator but introduces its own game-loop/lifecycle model

**Claim:** Phaser 4 exposes a `Game`, scenes, and a core `TimeStep` whose heartbeat is driven by browser frame scheduling. CrossDefense already owns a fixed-step authoritative simulation clock, so adopting Phaser requires proving that the two lifecycle models do not create unnecessary coupling.

**Evidence:**
- Phaser 4 API: https://docs.phaser.io/api-documentation/4.0.0/api-documentation
- Phaser TimeStep: https://docs.phaser.io/api-documentation/class/core-timestep

**Confidence:** High

**Caveat:** This is not a rejection of Phaser. PoC-2 or a renderer comparison may still show that Phaser's higher-level game facilities outweigh the integration cost.

## Interpretation

The evidence supports a provisional PoC harness centered on:
- TypeScript for typed Domain/Application contracts;
- Vite as a lightweight browser build/dev tool;
- Vitest for fast headless/contract tests;
- Playwright for real-browser acceptance, offline, persistence, and diagnostics;
- Zod 4 for runtime schema validation;
- IndexedDB with Dexie as the first persistence candidate;
- Workbox as the first offline/service-worker candidate;
- Web Locks API as the first single-tab ownership candidate.

Renderer/UI selection remains deliberately open. PixiJS is currently the strongest low-level 2D renderer candidate, while Phaser remains a comparator. A DOM-first or hybrid Build UI must also remain in scope for PoC-2.

## Implications

- Do not create a production framework scaffold yet.
- PoC-1 can remain framework-free and prove simulation determinism first.
- PoC-3 should be the first browser-dependent technology experiment because persistence correctness is a hard architecture boundary.
- PoC-6 should verify the Vitest/Playwright split before a testing stack is promoted into an ADR.
- Renderer/UI framework decisions must wait for PoC-2.

## Unknowns / follow-up

- Main thread versus Web Worker simulation host.
- DOM versus PixiJS versus hybrid Build rendering.
- Dexie transaction/migration behavior under the exact CrossDefense durability-barrier cases.
- Workbox content-version coexistence and Last Known Good activation.
- Web Locks stale-owner recovery behavior for the exact single-tab contract.
- Final UI framework and state-management library, if any.

## Sources

- https://www.typescriptlang.org/docs/handbook/intro
- https://vite.dev/guide/features.html#web-workers
- https://vitest.dev/guide/browser/
- https://playwright.dev/docs/api/class-browsercontext
- https://playwright.dev/docs/trace-viewer
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology
- https://dexie.org/docs/Transaction/Transaction.html
- https://developer.chrome.com/docs/workbox/precaching-with-workbox
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
- https://zod.dev/
- https://pixijs.com/8.x/guides/components/renderers
- https://pixijs.com/8.x/guides/components/events
- https://pixijs.com/8.x/guides/components/accessibility
- https://docs.phaser.io/api-documentation/class/core-timestep
