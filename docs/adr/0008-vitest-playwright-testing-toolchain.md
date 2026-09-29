# Vitest and Playwright as the primary test toolchain

**Status:** accepted

Use Vitest for fast headless Domain/Application scenarios and Playwright for real-browser acceptance, persistence, offline, session-lock, and interaction proof.

## Why

PoC-6 ran one shared deterministic scenario through Vitest and Playwright with the same digest, while Playwright also exercised browser persistence and offline execution. The current evidence does not justify an additional Vitest Browser Mode layer.

## Considered Options

- browser-only end-to-end tests;
- Vitest plus Playwright;
- Vitest plus Vitest Browser Mode plus Playwright.

## Consequences

Behavior rules should stay testable through headless Application/Domain seams. Browser tests are reserved for browser/platform boundaries and real interaction. Diagnostic artifacts should remain reproducible from version, seed, initial state, ordered inputs, and terminal result.
