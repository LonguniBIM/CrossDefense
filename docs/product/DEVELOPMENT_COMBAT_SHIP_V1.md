# Approved Development Combat Pack: SHIP v1

Authority: explicit user approval of Q10-Q13 and Ticket 07 development-only on 2026-10-09. Tickets 04-06 are User accepted; Tickets 08-12 remain ON HOLD. Implementation review and final executable verification are separate from this content approval; Ticket 07 final user acceptance remains Pending.

## Immutable authored content

Content `development-combat-ship-v1`, Ruleset `development-combat-ruleset-v1`, schema 4 and capability `combat` define one `development-map-01` / `Map 1 - Development`. Existing schema 1/2/3 sources and artifacts remain unchanged. Old Build Runs remain Build-only, old Q9 Runs remain diagnostic-only, and no Run is silently migrated to new content.

Source: `content/authoring/development-combat-ship-v1.json`.
Compiled artifact: `public/content/packs/development-combat-ship-v1/manifest.json`.
Use the existing shared deterministic content CLI/codec. Assets are explicitly empty. The SHIP quota-8 starter, its eight tile definitions, diamond-13 hull, six Unknown spellings, Technology Level 1 and hundredths Word/Power rules are inherited unchanged.

Player Hull is 1200 with exactly the saved equipment. Scout has Normal Hull 240 and a 45-second encounter limit; its S/Ballistic, H/Armor and I/Power occupy B2, C3 and C4. Boss has Normal Hull 480 and a 75-second limit; P/Missile at B2, S/Shield at D2, H/Armor at C3 and I/Power at B4/D4. Neither enemy forms a supported word. Equipment/encounter identities are unique. After Scout dies, a 60-tick gap precedes Boss. Player resources and cooldowns persist; no refill or banked attack occurs.

## Ruleset and clock

Combat uses 60 integer ticks per second and resource/rating units of 1/10000. Exact integer/rational intermediate calculations use positive half-up rounding at resource boundaries. Build precision is not changed. K=100 applies in Engine -> Missile System -> Shield -> Armor -> Hull order. Missile reduces Armor rating by exactly 25%; Laser is x1.5 against Shield only and converts overflow back to unamplified damage before Armor/Hull. Laser allocates its rounded full-window amount over 36 ticks without losing remainders.

Q290-Q298 remain authoritative: independent ready Weapon timers, fixed flight deadlines, active/recovery Laser phases, shared Shield delay, injury-triggered Support, passive defensive/Power modules, and damage before terminal evaluation before surviving regeneration. Already launched projectiles do not retarget and do not disappear just because their source died.

Difficulty uses the approved enemy Hull and outgoing-damage ratios; it does not alter Player Hull, Shield capacity/regen, cooldowns or gravity. Threat is the actual lock count, starts at zero, and increments once for every real lock. Enemy damage factor is `1 + 0.10 * min(5, floor(Threat / 20))`; capture it on activation, including the entire Laser window. It has no retroactive effect on shots in flight.

Application owns one shared bounded clock and the durability barrier. A late/background interval is not simulated as backlog. Explicit pause requires explicit Resume and a 3-2-1 countdown with both simulations stopped. Ordinary acknowledged collection resumes without a countdown; acknowledgment does not cancel a manual pause.

## Finite payloads and durable outcomes

Twenty-four independent Attempt-scoped payload identities are created from the twelve approved definitions repeated twice: S/Ballistic, H/Armor, I/Power, P/Armor; S/Missile, H/Shield, I/Power, P/System; S/Laser, H/Engine, I/Power, P/Support. Shuffle their order once using a Payload stream separate from Piece and payload-cell RNG. Hold/rotation preserve identities; after reservations exhaust the pool, later pieces are reward-free.

Only a cleared payload cell collects. A tick's cleared entries and terminal outcome share one transaction and stable operation receipt. Failed/lost acknowledgments preserve exact Retry identity and do not advance another simulation tick. Retained Cargo/layout/Pre-Run quota remain unchanged; new payloads enter the unresolved Salvage Buffer. Failure wins over simultaneous victory, ordered Hull destruction, top-out, then timeout; preserve concurrent causes.

Save data contract v7 adds independent `combatOperations` and `combatOutcomes` tables. Migration validates previous owners, canonical state and receipts before additive publication; it does not rewrite old rows or content pins. Interrupted/abandoned combat also writes its independent outcome atomically with the end receipt. The latest Run Attempt can change later without erasing an earlier outcome.

The outcome freezes identity, Map/difficulty, content/Ruleset/digest/seed, collected IDs and reward definitions. Repeatable reward data is base 4 Credits (3/4/6/9 by difficulty) and zero Celestium; First-Clear data is an additional 20 Credits plus 1 Celestium once per Pilot/Map. **Ticket 07 never pays these currencies or consumes First-Clear entitlement.** Victory records `pending-ticket09`; other endings record `not-eligible`. Full settlement, progression and Salvage Keep/Discard/Apply remain Ticket 09. Unresolved buffer entries continue to block the next Start; there is no auto-keep/discard shortcut.

## Presentation and compatibility boundary

Ticket 07 uses a factual DOM HUD and the actual Falling Blocks board, not a 2.5D renderer. Hull/Shield, enemy, Threat, encounter time, shared ticks, save state and acknowledged harvest come from copied projections. The viewport/minimum and board-input rules remain accepted; renderer work remains Ticket 08. Reload recovers interruption with saved loot instead of resuming exact battle state. Unsupported spelling remains allowed; insufficient Power and unresolved Salvage remain hard blockers, and no-offense still requires explicit confirmation.

## Verification and limits

Primary seams are public Domain/Application behavior, real IndexedDB transactions/migration, actual HTTP artifacts and headed Chromium UI on isolated strict loopback 4211/4212. Tests use disposable contexts, never personal saves. Final reports must distinguish synthetic boundary fixtures, legal keyboard play, native browser events and controlled platform-input fixtures.

A native-tab visibility experiment in this Windows automation environment remained `visible` even when switching/minimizing the owned browser and disabling focus emulation. The retained diagnostics do not prove a native hidden transition. Native focus loss is tested separately with actual `document.hasFocus()` and the observed blur reason; a controlled `document.hidden` plus visibilitychange fixture verifies the hidden-input path. No production pause guard is removed, and no native-hidden certification is claimed. Final platform/settings coverage remains separately reviewable in Ticket 11.

The original fixed point remains `fd945fae4916b8500245e74d75d65e331fb6ba43`. Complete the ChatGPT-only initial tri-axis, remediation, selective re-review and final full tri-axis before final engineering disposition; executable tests are a separate gate. No provider, credentials, blocked orchestration, WFP/G-R/G-P, new dependency, stage, commit, push or deployment is authorized.
