# Modular monolith with a headless deterministic Domain Core

**Status:** accepted

The product is implemented as one modular web application rather than microservices/microfrontends, while the authoritative Domain Core remains independent of presentation, browser infrastructure, audio, storage, and network APIs.

## Considered Options

- microfrontend/service decomposition from the start;
- UI-owned gameplay logic;
- modular monolith with strict inward dependencies and a headless Domain Core.

## Consequences

Presentation emits intents and renders projections. Application orchestrates explicit use cases. Domain owns rules and invariants. Infrastructure implements ports. Most gameplay behavior can be tested headlessly without a browser renderer.
