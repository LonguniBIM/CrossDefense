# Technology Selection Browser Harness

## Status

Prototype-only. This directory is **not** the production application scaffold and does not select the final CrossDefense stack.

The harness exists only to run browser-dependent Technology Selection PoCs against the approved architecture.

## Why this harness exists

The current decision frontier needs real-browser evidence for:

- IndexedDB transactions, migration, idempotency, and restart recovery;
- headless scenario plus browser acceptance testing;
- offline application/content packaging;
- single-tab Workspace Session Lock behavior;
- later Build UI and rendering comparisons.

The repository root intentionally remains framework-neutral until the PoCs produce enough evidence for technology ADRs.

## Provisional tools

The package versions are pinned to the research snapshot recorded on 2026-09-29:

- TypeScript 7.0.2
- Vite 8.3.1
- Vitest 5.0.1
- @vitest/browser-playwright 5.0.1
- Playwright Test 1.63.0
- Dexie 4.4.6
- Zod 4.6.5

These are PoC candidates, not production selections.

## Requirements

- Node.js 22.12 or newer.
- npm or another npm-compatible package manager.
- A Chromium installation managed by Playwright for the browser acceptance PoCs.

Vite 8 requires Node.js 20.19+ or 22.12+. This harness uses the 22.12+ line to keep one clear PoC baseline.

## Setup

From this directory:

```bash
npm install
npm run install:browsers
```

Then start the static PoC host:

```bash
npm run dev
```

The default URL is:

```text
http://127.0.0.1:4173
```

## Validation commands

```bash
npm run typecheck
npm test
npm run test:browser
npm run test:e2e
```

Not every command has a meaningful test until the corresponding PoC is added.

## Important boundary

Do not copy this directory wholesale into production code.

Validated decisions may be promoted into ADRs and a later production scaffold. Prototype implementation should be rewritten or deliberately adopted only after that decision is explicit.

## Current execution limitation

The agent container used to prepare this branch cannot install npm packages from the public registry, and its bundled Chromium does not provide a usable non-opaque local origin for IndexedDB testing. Browser-dependent PoCs therefore remain unverified until this harness is run in a normal development environment with dependency installation and Playwright-managed browsers available.
