# Web Locks for single-tab Workspace write ownership

**Status:** accepted

Use the Web Locks API as the authoritative exclusive-write ownership primitive for the Local Guardian Workspace.

## Why

PoC-5 proved in a real browser that one tab acquires ownership, a second tab is blocked, abnormal owner-tab closure releases ownership, and a surviving tab can recover and report the previous owner.

## Considered Options

- localStorage lease only;
- BroadcastChannel coordination only;
- Web Locks with diagnostic heartbeat metadata.

## Consequences

Heartbeat metadata may support diagnostics and stale-owner attribution but must never override a live Web Lock. Production UX must handle unavailable ownership, loss of ownership, and unsupported-browser cases explicitly.
