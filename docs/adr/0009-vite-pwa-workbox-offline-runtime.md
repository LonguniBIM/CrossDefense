# Vite PWA and Workbox for offline runtime delivery

**Status:** accepted

Use vite-plugin-pwa with Workbox for service-worker generation and offline application/runtime asset delivery.

## Why

PoC-4 passed a production build and real-browser offline reload with versioned Content Packs, Last Known Good rejection of an invalid candidate, coexistence of old and current packs, and offline pronunciation audio.

## Considered Options

- hand-written service worker only;
- Vite PWA with Workbox;
- online-first runtime loading.

## Consequences

Service-worker caches are replaceable runtime material and never authoritative Player Data. Content validation and activation policy stay application-owned. Active Runs must retain access to pinned content versions until no longer referenced.
