# PoC-6 — Shared Headless Scenario and Browser Acceptance Toolchain

## Status

Verified green on 2026-09-29 in the user's Windows development environment.

## Prototype question

Can one shared scenario definition exercise the same public behavior contract through both a fast headless adapter and a real-browser persistence adapter, while producing deterministic diagnostic evidence?

## Scope

This is throwaway Technology Selection code. It is not production test architecture.

The PoC specifically proves:

- one shared scenario function can drive both headless and browser adapters;
- Vitest can run the scenario quickly without browser dependencies;
- Playwright can run the same scenario against real IndexedDB-backed browser persistence;
- Playwright can place the browser context offline after initial load while the local scenario continues to operate;
- both paths produce the same deterministic diagnostic digest;
- the browser test can attach a reproducible JSON diagnostic artifact.

The PoC does not prove production offline application startup. That belongs to PoC-4.

## Toolchain under test

- TypeScript 7.0.2
- Vitest 5.0.1
- Playwright 1.63.0
- Vite 8.3.1 as the prototype host
- the PoC-3 IndexedDB + Dexie browser persistence adapter

## Shared scenario contract

The shared scenario:

1. resets its adapter;
2. submits one Blueprint collection operation;
3. retries the same OperationId;
4. reads the terminal state;
5. emits a deterministic diagnostic bundle.

Expected behavior:

- first operation is applied;
- retry is rejected as already applied;
- Blueprint count is 1;
- quota decreases from 3 to 2;
- exactly one durable operation exists;
- diagnostic digest is `68523b19`.

## Observed evidence

Environment:

- Windows 11 Home
- Node.js v24.13.1
- npm 11.8.0
- Playwright 1.63.0
- Chromium 153.0.8010.12

Validation:

```text
npm run typecheck
PASS (exit code 0)

npm test -- poc6-shared-scenario.test.ts
1 test passed
Duration: 172 ms

npm run test:e2e -- poc6-shared-scenario.spec.ts
1 test passed
Duration: 4.1 s
```

The Playwright scenario ran against real browser persistence after the context was switched offline and produced the same expected diagnostic digest as the headless scenario.

## Defects found during PoC execution

### Test attachment type mismatch

Initial typecheck failed because the Playwright test used Node's `Buffer` while the prototype TypeScript configuration intentionally contained only browser/ES libraries.

The attachment body was changed to a plain JSON string, which Playwright accepts. This kept the browser-oriented TypeScript boundary clean without adding Node globals to the whole prototype.

### Incorrect expected digest

The first headless run correctly failed because the hand-entered expected digest did not match the deterministic implementation output.

The observed digest `68523b19` was recorded in both headless and browser expectations. Subsequent headless and browser runs passed with the same value.

## Decision

PoC-6 supports the following testing split:

- **Vitest** for fast headless Domain/Application scenario and contract tests.
- **Playwright** for real-browser acceptance tests covering IndexedDB, offline state, visibility, session locking, migration/reload, and other browser-owned behavior.
- Shared scenario definitions should remain framework-neutral and adapter-driven where reuse is valuable.
- Diagnostic bundles should contain deterministic scenario inputs and terminal evidence; Playwright should attach them on browser failures.

A separate Vitest Browser Mode layer is not required by the evidence produced in this PoC. It should not be added to the production stack unless a later concrete test need justifies it.

## Remaining uncertainty

- Production trace retention and CI artifact policy are not selected yet.
- Exact test parallelism and browser matrix belong to implementation/release planning.
- Full offline reload/startup is not proven here and remains PoC-4 scope.
