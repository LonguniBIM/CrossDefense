# Approved Development Starter: SHIP v1

Authority: the user's explicit approval of Q1 and Q2 on 2026-10-05 (Asia/Ho_Chi_Minh): SHIP, quota 8, the proposed tiles and collection rules, and an empty assets list. Authorization covers authoring, compilation and real-pack verification for Ticket 02 only. Tickets 03-12 remain ON HOLD; final user acceptance is separate.

## Authored content

| Field | Approved value |
| --- | --- |
| Content version | `development-starter-ship-v1` |
| Schema version | `1` |
| Compatible Ruleset | `development-ruleset-2026-09-30` |
| Minimum App version | `0.1.0` |
| Target Word | `SHIP` |
| Collection quota | `8` Letter Tiles |
| Weapon required in starter word | `true` |
| Selected assets/audio | Explicitly empty: `assets: []` |

| Letter | Subtype | Count |
| --- | --- | ---: |
| S | Ballistic | 2 |
| H | Armor | 2 |
| I | Power | 2 |
| P | Armor | 2 |

Source: `content/authoring/development-starter-ship-v1.json`.
Runtime output: `public/content/packs/development/manifest.json`.
The two occurrences of each letter/subtype are distinct pool entries, not one entry with an implicit repeated reward. Array order preserves authored data; it is not a mandated `SHIPSHIP` falling sequence. The existing schema stores definitions, not runtime payload identities.

## Approved collection contract for the future Ticket 03 implementation

The eight entries define the finite Pre-Run Letter Tile pool. Starting a Run does not grant these tiles to Cargo. Payload selection must stay within this pool; it must not invent other letters/subtypes or additional rewards.

Once an entry is collected and committed it cannot be issued again as a new reward. Hold, Next and rotation preserve payload identity without rerolling its letter/subtype. After top-out or reload, an uncollected entry remains eligible with the same identity; committed tiles and remaining quota are retained. Collection and quota changes must commit atomically.

Finish becomes available when the committed collection contains a viable SHIP starter with a Weapon Tile, not merely any four tiles. For example, S/S/H/H does not satisfy the objective. After the starter minimum, the player may finish or continue to the finite quota. Collection stops at quota exhaustion.

The exact payload-selection algorithm, identity representation and collection implementation are not implemented or tested by this Ticket 02 authoring step. No probabilities or fixed spawn sequence are selected here. Ticket 03 still needs an explicit opening instruction.

## Compilation and compatibility

From the repository root, use the existing compiler with a new output path:

```powershell
npm run content:compile -- --source content/authoring/development-starter-ship-v1.json --assets-root content/authoring --out <new-staging-manifest.json>
```

The selected asset root is unused because the approved assets list is empty. The compiler still computes canonical manifest SHA-256 metadata. Integrity is corruption detection, not publisher authentication. No definition text, CEFR metadata, audio or external artwork is imported by this pack.

Compile twice to different staging outputs, require byte-for-byte equality, and validate through the actual runtime codec before placing the candidate at the runtime path. Do not hand-edit generated output or overwrite a different pack in place. A content change needs a newly authored version and the corresponding approval.

## Verification boundary

Ticket 02 verifies compile/activation, Last Known Good, StartRun, version/quota/objective pinning, duplicate Start, reload and Content Required/recovery using this real pack. It does not claim playable Falling Blocks, collection, Finish, ship placement, combat, full offline support or final product balance.

## Subsequent Q3/Q4 approval and Ticket 03 continuation

The user approved Q3 option A and Q4: shuffle all eight pool entries once using a stable Run seed, without prioritizing missing letters; persist that order and entry identities. Active piece, locked board, Hold and Next reserve an entry until it is collected or the transient board is reset. When every remaining entry is reserved, new pieces carry no reward, so existing payload cells can still be cleared. Reload/top-out reconstructs only uncollected entries in the saved order, with their original identities, never rerolling letters/subtypes or granting Cargo. Shape and payload-cell RNG streams are separate. This supersedes the earlier not-yet-selected payload policy; no SHIP manifest bytes or quota values change. Ticket 03 development-only implementation is now authorized; Tickets 04-12 remain ON HOLD.
