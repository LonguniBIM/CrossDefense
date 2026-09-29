# PoC-5 — Workspace Session Lock

## Status

Closed green on 2026-09-29.

## Prototype question

Can one browser tab own authoritative Workspace writes while a second tab is blocked, and can ownership recover after abnormal owner-tab closure?

## Candidate technology

- Web Locks API for authoritative exclusive ownership.
- localStorage heartbeat metadata for diagnostics and stale-owner attribution only.

## Observed evidence

On `DESKTOP-DBD6QJO`, Playwright ran the real-browser scenario:

```text
1 passed (2.7s)
```

The scenario proved that Tab A acquired the exclusive `crossdefense-workspace-write` lock, Tab B was denied while A was alive, lock metadata identified Tab A, closing Tab A released browser ownership, Tab B then acquired the lock and reported stale recovery from `tab-a`, and explicit release produced the expected ownership-loss state.

## Decision

Use the Web Locks API as the authoritative single-tab write-ownership primitive for the MVP. Keep heartbeat metadata diagnostic only; it must never override a live Web Lock.

## Remaining risk

Production code still needs explicit unsupported-browser handling and a user-facing ownership-loss/recovery experience. Those are implementation and UX concerns, not blockers for the technology choice.
