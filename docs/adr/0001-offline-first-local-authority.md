# Offline-first browser-local authority

**Status:** accepted

The MVP must remain fully playable offline after the initial successful load, while cloud accounts and multi-device sync are deferred. Therefore the browser-local Local Guardian Workspace is authoritative for player progression in the MVP, with explicit export/import backup and one writable active tab.

## Considered Options

- require a backend for authoritative progression;
- support offline play but block permanent rewards while disconnected;
- use browser-local authority for the MVP.

## Consequences

Core rules, word validation, rewards, upgrades, reviews, and required pronunciation assets must work without network access. Browser storage durability, migrations, recovery, backup, and single-tab ownership become first-class architecture concerns.
