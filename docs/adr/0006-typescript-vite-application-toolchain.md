# TypeScript and Vite as the application toolchain

**Status:** accepted

Use TypeScript with strict compiler settings for production application code and Vite as the browser build/dev tool.

## Why

The approved architecture depends on explicit typed contracts across Domain, Application, Content, and Persistence boundaries. The browser PoC harness has exercised TypeScript and Vite across deterministic logic, IndexedDB, offline/PWA, DOM Build, session locking, and browser acceptance without forcing browser APIs into the Domain Core.

## Considered Options

- plain JavaScript;
- TypeScript with Vite;
- a framework-specific build system.

## Consequences

Runtime validation remains separate from TypeScript static typing. Production code must preserve the inward dependency rule and may not treat Vite configuration as domain authority. Vite remains replaceable build infrastructure, not an application architecture boundary.
