# IndexedDB with Dexie for authoritative local player persistence

**Status:** accepted

Use browser-native IndexedDB as the authoritative durable storage primitive and Dexie as the initial production wrapper.

## Why

PoC-3 passed real-browser evidence for atomic Blueprint/quota updates, idempotent OperationId retries, rollback after an injected transactional failure, interrupted-Attempt recovery after reload, and failed schema-upgrade recovery.

## Considered Options

- localStorage;
- raw IndexedDB APIs;
- IndexedDB through Dexie.

## Consequences

Authoritative progression changes must remain transactional and idempotent where specified. In-memory adapters are useful for fast tests but do not prove browser durability. Save migration, recovery snapshots, and corruption handling remain application-owned policies above Dexie.
