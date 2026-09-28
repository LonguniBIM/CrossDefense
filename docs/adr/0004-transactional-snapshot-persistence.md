# Snapshot persistence with transactional commands, not full Event Sourcing

**Status:** accepted

Durable player state is stored as current state snapshots/aggregates, while progression-changing commands execute atomically and retryable durable outcomes use stable operation IDs. Full Event Sourcing is intentionally rejected for MVP complexity reasons.

## Considered Options

- periodic giant-state autosave;
- full Event Sourcing and event replay;
- aggregate snapshots plus transactional Units of Work and post-commit events.

## Consequences

Business outcomes such as Blueprint collection, purchases, Map victory, and Review reward must commit all-or-nothing. Post-commit events support presentation/telemetry but do not perform critical progression mutations. Save schemas require explicit migrations and recovery behavior.
