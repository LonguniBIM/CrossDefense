# Source Layout — Technology Neutral

These directories represent approved architecture boundaries, not a selected framework.

- `domain/` — deterministic rules, invariants, lifecycle, word/build/combat/economy/learning logic.
- `application/` — explicit use cases, orchestration, serialized command execution, Units of Work, projections.
- `infrastructure/` — browser storage, clocks/IDs/random adapters, session lock, offline/content loading, audio/telemetry adapters.
- `presentation/` — screens, input, rendering, animation, accessibility presentation.

Do not add framework-specific scaffolding until Technology Selection + PoC is complete.
