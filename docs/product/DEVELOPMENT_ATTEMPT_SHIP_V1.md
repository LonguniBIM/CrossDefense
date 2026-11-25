# Approved Development Attempt Pack: SHIP v1

Authority: explicit user Q9 approval on 2026-10-07 and Ticket 06 development-only authorization. Ticket 05 is User accepted. Tickets 07-12 remain ON HOLD. This document records the approved content and its implemented boundary, not final user acceptance of Ticket 06.

## Immutable content

| Item | Approved definition |
| --- | --- |
| Content | development-attempt-ship-v1 |
| Ruleset | development-attempt-ruleset-v1 |
| Content schema | 3; schema1/2 readers remain supported |
| Map | development-map-01; Map 1 - Development; initially available |
| Capability | launch-recovery-only |
| Difficulty | Easy, Normal, Hard, Insane; Normal default and each Pilot's last explicit choice |
| Starter | SHIP, quota8; S/Ballistic x2, H/Armor x2, I/Power x2, P/Armor x2 |
| Build | Existing diamond13 hull, six spellings, Technology Level1 and exact hundredths Word/Power arithmetic |
| Assets | Explicitly empty |

Source: `content/authoring/development-attempt-ship-v1.json`.
Compiled artifact: `public/content/packs/development-attempt-ship-v1/manifest.json`.
Compilation uses the existing deterministic shared codec/CLI and refuses output overwrite. No encounter, enemy HP, damage, duration, Threat, boss, reward, mitigation K, learning data or art/audio is defaulted into this pack. An absent encounter is not an empty winning encounter.

Existing starter/Build sources and compiled artifacts retain their exact prior bytes. New Runs use this new validated pack. Existing Runs retain their content/Ruleset pins, layout and tile identities. A Build-only Run remains editable and receives a factual Map-content-unavailable explanation; it never borrows this Map. Known pinned artifacts can be restored after cache eviction by explicit Retry without changing the active default or Last Known Good.

## Launch and recovery behavior

The Build header opens Map and difficulty selection. Start validates the current Pilot/Run/content, Build revision, actual Power and unresolved Salvage. Unsupported words are not an additional blocker. No offensive output requires explicit Start anyway confirmation; it cannot override a hard blocker. The 1280x720 minimum viewport remains enforced before launch.

Start synchronously reserves the current Build editing context, then commits a new Attempt and its exact receipt atomically. Only acknowledgment clears Build Undo/Redo history and displays the diagnostic. Failed writes retain the original operation, Attempt ID, seed, time and previous acknowledged state. A duplicate Start resolves its original receipt and current Run; it cannot create another Attempt or report an obsolete running state after that Attempt ends.

The diagnostic is explicitly paused and non-combat. It displays copied startup identities, Map/difficulty, versions, seed and canonical layout, not invented battle stats. The persisted envelope includes the latest Attempt status and copied startup hull, retained tiles, coordinates, Build revision and content digest. It is not an exact combat-state save or a full Attempt archive.

Owned Workspace bootstrap marks a previously running envelope interrupted and returns its Run to Build. This recovery does not depend on a cached pack being available; unavailable content can still require separate restoration before normal editing. Explicit End diagnostic requires confirmation and marks the Attempt abandoned. Neither path creates victory rewards, learning evidence, new tiles or an exact simulation resume.

Valid wall-clock timestamps are diagnostic metadata. Their chronological ordering is not a lifecycle invariant because the device clock can be corrected; status, identity and atomic command order remain authoritative.

## Persistence and integration

Save data contract v6 adds `attemptOperations` plus optional Pilot difficulty and Run Attempt/Salvage Buffer inputs. The v5-to-v6 migration validates owners, prior state and receipts before publishing metadata, without rewriting prior Run pins/layout or historical receipts. Historical migrations keep their own literal version. Failures abort the version change.

The unresolved Salvage Buffer input exists only to enforce the approved launch blocker; collection and Keep/Discard/Apply production workflows remain later tickets. The latest Attempt envelope and receipts support the approved diagnostic, not future combat rewards or permanent progression. The first actual Attempt-start boundary invokes Ticket05's history invalidation only after successful commit.

## Verification contract

Public Domain/Application scenarios cover blockers, canonical snapshots, serialized admission, duplicate/lost-ack/retry behavior, difficulty ownership, current receipt replay and clock-independent recovery. Real Chromium/IndexedDB tests cover migration rollback, each operation's write/receipt rollback, diagnostic launch/reload, old-content recovery and corrupted startup rejection. Browser tests use disposable contexts and strict loopback ports4201/4202, not personal saves.

Review retains the original fixed point fd945fae4916b8500245e74d75d65e331fb6ba43, separates Standards/Spec, Architecture and Security, and keeps executable verification separate. See `TICKET06_DEVELOPMENT_VERIFICATION.md` for final evidence/disposition when recorded. No provider reviewers, review credentials, blocked orchestration, WFP/G-R/G-P, staging, commit, push or deployment is authorized.
