# Architecture Map

This document maps the architectural boundaries and contracts of the Vocabulary Ship Game (`CrossDefense`).

## High-Level Architecture

```text
Presentation
    ↓ intents
Application / Use Cases
    ↓
Headless Deterministic Domain Core
    ↓
Transactional Local Persistence

Ruleset + immutable compiled Content Packs
                 ↓
            Domain Core
```

## Core Architectural Principles

- **Offline-First & Local Authority**: Authoritative player state and game simulation run entirely on the local client without requiring server authorization or live AI.
- **Headless Deterministic Domain Core**: Pure domain simulation isolated from presentation, view, and IO.
- **Deterministic Fixed-Step Simulation**: Predictable tick updates with seeded, isolated RNG streams for gameplay vs combat.
- **Transactional Local Persistence**: Unit of Work pattern ensuring consistent atomic state transitions and crash recovery.
- **Data-Driven Ruleset & Content Packs**: Immutable versioned content packs loaded locally.

## Architectural Contracts

- **Product Platform Design**: [`docs/architecture/PLATFORM_ARCHITECTURE.md`](architecture/PLATFORM_ARCHITECTURE.md)
  Defines modular monolith boundaries, lifecycle state machine, snapshot persistence + transactional events, data-driven content split, and the authoritative Map Attempt simulation clock.
- **Technical Architecture**: [`docs/architecture/TECHNICAL_ARCHITECTURE.md`](architecture/TECHNICAL_ARCHITECTURE.md)
  Defines inward dependency rules, explicit module contracts, deterministic fixed-step simulation, dual RNG stream isolation, transactional persistence (Unit of Work), session lock, and crash recovery.
- **Testing Seams**: [`docs/architecture/TESTING_STRATEGY.md`](architecture/TESTING_STRATEGY.md)
  Defines the primary behavior seams: headless scenario test suite, dual simulation verification, and browser integration boundaries.
- **Decision Frontier**: [`docs/architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md`](architecture/TECHNOLOGY_SELECTION_AND_POC_BACKLOG.md)
  Defines the current PoC backlog for technology selection (simulation, rendering, local DB, PWA, test toolchain).
- **Architecture Decisions**: [`docs/adr/`](adr/) and [Decision Log](decisions/DECISION_LOG.md)
  Consequential, settled architecture decision records (0001 through 0005).
