# PoC-3 — Browser Durability, Transactions, and Crash Recovery

## Status

Prepared for real-browser execution. **Not yet verified.**

The current agent execution environment cannot install the provisional npm dependencies from the public registry, and its bundled Chromium does not expose a usable local origin for IndexedDB validation. That environment limitation is not evidence for or against IndexedDB or Dexie.

## Prototype question

Can IndexedDB with Dexie support the approved CrossDefense durability contracts in a real browser?

The specific contracts under test are:

1. Blueprint collection and quota consumption are one atomic Unit of Work.
2. Retrying the same durable `OperationId` does not duplicate progression.
3. A transaction fault after a tentative Workspace update rolls back the entire operation.
4. Reloading during a running Map Attempt returns the Run to Build while preserving already committed loot.
5. A failed schema upgrade leaves legacy data readable and a recovery snapshot available.

## Scope

This is throwaway Technology Selection code. It is not production persistence code.

The prototype deliberately omits:

- the full Workspace/Pilot aggregate model;
- production backup file format;
- production recovery UI;
- full save migration history;
- encryption or anti-cheat;
- production Map simulation.

## Candidate technology

- Browser-native IndexedDB
- Dexie 4.4.6 as the provisional IndexedDB wrapper
- Playwright as the real-browser acceptance runner

None of these are promoted to production selections until the tests pass and the resulting trade-offs are reviewed.

## Run

From `prototypes/technology-selection/browser-harness/`:

```bash
npm install
npm run install:browsers
npm run typecheck
npm run test:e2e -- poc3-durability.spec.ts
```

The Playwright configuration starts the Vite PoC server automatically.

For manual inspection:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4173/?poc=3
```

## Pass criteria

PoC-3 passes only if a real browser proves all of the following:

- the first Blueprint operation changes `blueprintCount`, quota, and OperationId record together;
- retrying the same OperationId changes nothing;
- an injected exception after the Workspace write leaves both Blueprint count and quota unchanged from the previously committed state;
- after a page reload, a running Attempt becomes `interrupted`, lifecycle returns to `build`, and previously committed Blueprint progression survives;
- an intentionally failed version upgrade leaves the legacy v1 record readable;
- a pre-upgrade recovery snapshot remains available.

## Evidence to record after execution

Record:

- Node.js version;
- browser and browser version;
- operating system;
- exact commands;
- pass/fail output;
- any IndexedDB/Dexie behavior that differs from the assumed model;
- whether Dexie should remain the leading persistence candidate.

## Decision rule

A passing PoC supports promoting IndexedDB as the browser durability primitive and Dexie as a strong production wrapper candidate.

A failure must be classified before changing the architecture:

- product-contract mismatch;
- Dexie limitation;
- IndexedDB/browser limitation;
- test design error;
- environment/setup error.

Do not select a different persistence technology solely because an environment cannot run the test.
