# MVP Product Specification

## Implementation Handoff

The current prototype visual design was accepted on 2026-10-01 (Asia/Bangkok), after the no-scroll layout revision. See the [refreshed first-slice implementation specification](IMPLEMENTATION_SPEC.md) and [proposed ticket breakdown](IMPLEMENTATION_BREAKDOWN.md). The specification, T1-T4 and all 12 tickets were approved on 2026-10-01 at 02:48 Asia/Bangkok. They preserve the full MVP below. Execution is explicitly ON HOLD; no ticket may start until the user requests it.

## Objective

Create an English-only, game-first vocabulary web game for learners aged approximately 10–13 in which the learner earns letters through falling-block play, turns those letters into English words to engineer a spaceship, and sees those vocabulary decisions become deterministic combat power.

Learning evidence must remain separate from combat success. Spelling or winning must not be treated as automatic proof of meaning mastery or pronunciation ability.

## Primary loop

```text
Pre-Run Salvage
    ↓
Build Phase
    ↓
Falling-Block + Auto-Battle Map Attempt
    ↓
Boss / Result
    ↓
Optional Vocabulary Review
    ↓
Build / Replay / Next Map
```

## MVP platform boundary

- PC/laptop web application.
- English-only product UI and learning support.
- Offline-first after initial successful load.
- Optional PWA installation; installation is not required.
- Local Guardian Workspace with multiple independent Pilot Profiles.
- One writable active browser tab.
- No cloud account or multi-device sync in MVP.
- Full Workspace export/import backup.

## Pre-Run Salvage completion and recovery

Pre-Run Salvage is enemy-free with a finite content-defined collection quota. The opening content must support a viable starter containing a target word of at least three letters including a Weapon Tile. Finish Salvage becomes available once that minimum is collected; collection stops at quota exhaustion. Top-out or reload preserves committed tiles and remaining quota while resetting the transient board, without duplicate grants or reroll farming. Tutorial skip does not bypass these conditions (Q271). Exact quota values remain content-tuning inputs, not new UI defaults.

## Falling-block rules

- 10 columns × 20 visible rows plus spawn area.
- Seven four-cell tetromino-style piece geometries with original branding/art.
- Ghost Piece, Hold, and exactly three visible Next Queue previews (Q299). See [UX_UI_DESIGN.md](UX_UI_DESIGN.md#approved-falling-block-layout-and-attempt-hud-2026-10-01) for approved board composition, payload identity, collection feedback, and HUD distribution.
- Normally one visible payload-bearing cell per piece.
- Payload rotates with its cell.
- Payload is collected only if that exact cell is line-cleared.
- Multiple payload cells cleared together are all collected exactly once.
- Main payload: Letter Tile; rare payload: Blueprint Fragment.
- Celestium is not a falling-block payload.
- Threat rises when a piece locks; line clears do not reduce Threat.
- Difficulty does not change falling-block rules or gravity.
- Q309-Q315 define the approved experimental control baseline: 800 ms automatic gravity, 50 ms Soft Drop, immediate-lock Hard Drop, 150/50 ms horizontal repeat, bounded 90-degree rotation adjustments, 500 ms Lock Delay with at most 15 grounded resets, one Hold before each lock, four hidden spawn rows, post-clear top-out checks, and shuffled seven-shape groups. See [the detailed control contract](UX_UI_DESIGN.md#approved-falling-block-control-rules-2026-10-01). Q316-Q319 settle contact-loss timing, input carryover, row collapse, and same-tick collection/terminal behavior. The [consolidated Falling Blocks design](FALLING_BLOCKS_DESIGN.md) includes exact rotation/spawn data and experiment scope, confirmed by the user on 2026-10-01 for the isolated playable prototype.

## Ship / word construction

- Letter Tiles are discrete owned items with `letter + subtype` identity.
- Valid words are full contiguous A–Z sequences of at least 3 letters, horizontal or vertical only.
- Intersections are allowed; diagonals are not.
- Invalid side sequences are allowed but receive no word bonus.
- Unsupported strings should be described as unsupported by the game, not universally incorrect English.
- Duplicate combat words are allowed, but repeated use does not duplicate learning/discovery rewards.

### Word multiplier v0

| Length | Multiplier |
|---:|---:|
| 3 | ×1.20 |
| 4 | ×1.35 |
| 5 | ×1.55 |
| 6 | ×1.80 |
| 7 | ×2.10 |
| 8+ | ×2.40 |

CEFR add-on:

| Level | Add-on |
|---|---:|
| A1 | +0.00 |
| A2 | +0.05 |
| B1 | +0.10 |
| B2 | +0.15 |
| future C1 | +0.20 |
| unknown | +0.00 |

Crossing tile multiplier:

`max(horizontal, vertical) + 0.15`, hard-capped at **×2.60**.

Target and non-target supported words use the same combat formula.

## Combat modules

Weapon:
- Ballistic — reliable baseline sustained damage.
- Missile — burst-oriented with partial Armor penetration.
- Laser — especially effective against Shield.

Defense:
- Armor — Hull damage mitigation.
- Shield — renewable buffer.
- System — anti-Missile mitigation.

Utility:
- Engine — deterministic mitigation/evasion representation.
- Power — Power generation.
- Support — Hull regeneration.

Level-1 balance placeholders:

| Subtype | v0 effect |
|---|---|
| Ballistic | 10 baseline sustained damage |
| Missile | 12 burst-equivalent output, ~25% Armor penetration |
| Laser | 9 sustained output, ×1.5 vs Shield |
| Armor | +10 Armor Rating |
| Shield | +25 Shield Capacity + regen |
| System | +10 Anti-Missile Rating |
| Engine | +10 deterministic mitigation Rating |
| Power | +3 Power |
| Support | +1 Hull regeneration unit |

Five permanent technology levels per subtype: **100%, 110%, 122%, 136%, 152%**.

### Combat timing refinement (Q290-Q293)

See [COMBAT_TIMING.md](COMBAT_TIMING.md) for authoritative subtype activation, cooldown, regeneration, ownership, scaling, and UI contracts. Weapon damage is paced by activation cycles, Support repairs periodically, and Shield regeneration waits after damage. Armor/System/Engine/Power remain passive. Word and Technology bonuses do not shorten cooldowns. Numerical intervals are experiment starting points; Q298 supplies explicit experimental per-activation magnitudes and units for the Level-1 placeholders above. Q294-Q298 settle readiness, impacts, target loss, regeneration, terminal ordering, and experimental magnitudes in that document.

## Power Budget

| Subtype | Power |
|---|---:|
| Ballistic | −1 |
| Missile | −2 |
| Laser | −2 |
| Armor | 0 |
| Shield | −2 |
| System | −1 |
| Engine | −1 |
| Power | +3 |
| Support | −1 |

- Decimal display is allowed.
- Word bonus may increase Power generation.
- Word bonus does not increase consumers' demand.
- Start Map is disabled if Available Power < Required Power.
- The game never auto-removes modules to fix Power.
- A build with no offensive output gets an advisory and explicit Start anyway confirmation, not a new hard blocker. A supported word is not an additional launch requirement (Q283).

## Damage order

```text
Engine mitigation
→ System mitigation for Missile
→ Shield
→ Armor
→ Hull
```

Armor/System/Engine use diminishing-return ratings. A representative formula is `Rating / (Rating + K)`; exact K remains a tuning parameter.

Combat is deterministic: the same build, enemy, difficulty, ruleset, seed, and ordered input produce the same outcome.

## Difficulty v0

| Difficulty | HP | Damage | Repeatable victory reward |
|---|---:|---:|---:|
| Easy | ×0.75 | ×0.75 | ×0.75 |
| Normal | ×1.00 | ×1.00 | ×1.00 |
| Hard | ×1.40 | ×1.25 | ×1.50 |
| Insane | ×1.80 | ×1.50 | ×2.25 |

Victory on any difficulty unlocks the next Map in the current Run. Core content is not exclusive to Hard/Insane.

New Pilots default to Normal. Remember each Pilot's last explicit difficulty choice across Maps and Runs; do not automatically escalate difficulty (Q263).

## Progression

Permanent Profile assets include:
- Credits;
- Celestium;
- ships/hulls;
- hull upgrades/expansion ownership;
- subtype technology levels;
- Cargo Capacity;
- Blueprint quota/progression;
- learning history and review schedule.

Run-specific assets include:
- Letter Tiles in Run Cargo;
- ship word layout;
- current Map accessibility;
- Run-specific temporary state.

Restart Run resets the Run-specific assets and returns to Pre-Run Salvage / Map 1 while preserving permanent Profile progression.

Clearing the final MVP Map preserves the current Run, Cargo, and layout and allows replay of unlocked Maps. Starting a new Run remains explicit and confirmed (Q282).

## Cargo / Salvage

- Cargo Capacity counts every retained Run Letter Tile, including tiles placed on the ship and unplaced tiles (Q244). Moving tiles between these states does not change capacity used; the unresolved Salvage Buffer is separate.
- Starting Cargo Capacity: **24 Letter Tiles**.
- MVP target capacity: approximately **40**.
- Additional slots are permanent Pilot progression bought one at a time using Credits + Celestium, with escalating cost.
- Newly collected Letter Tiles enter Salvage Buffer.
- Salvage must be completely resolved before another Attempt begins.
- Resolve Salvage through a staged keep/discard/replacement batch with a final capacity/build-impact summary and atomic confirmation. Cancel does not change authoritative state; unresolved or over-capacity candidates cannot apply (Q259).
- Unwanted letters may be discarded for no reward, with an explicit destructive summary. A confirmed Salvage batch can satisfy that confirmation without a duplicate dialog (Q260).
- Scrap economy is deferred.

## Failure / retry / abandon

A Map Attempt fails on:
- Hull HP = 0;
- falling-block top-out;
- encounter timer expiry.

Retry returns to Build for the same Map and keeps already committed eligible loot.

Abandon keeps already committed loot but grants no victory/First-Clear reward.

Closing/reloading during a Map does not resume exact combat; committed loot remains and the Run returns to Build.

## Learning

- Gameplay spelling and Learning Entry identity are distinct.
- Learning Entry = `word + part of speech + target sense`.
- Track exposure, use in build, hints, first review response, attempts-to-first-correct, immediate recall, delayed recall.
- Do not infer mastery from battle success or spelling alone.
- Do not infer pronunciation ability from hearing audio.

Hints may progress from meaning/context → partial spelling → full answer when explicitly requested. Hints do not reduce combat power but are recorded as learning evidence.

## Review

- Optional 1–3 prompts after a completed victory or failure, plus due Review access from Build. Do not automatically offer Review after abandonment or interruption recovery (Q262).
- Primary form: meaning/context → learner types the English word.
- Rewards are committed before Review begins.
- Review may be skipped or left at any point without penalty.
- Allow unlimited retries with optional staged hints. Preserve the first response and attempts-to-first-correct; repeated success does not create additional rewards for the same occurrence, and hint-assisted answers are not independent recall (Q252).
- Each scheduled Review Occurrence grants its configured small Credits completion reward once on the first correct submission, including correct completion after hints; skipping or revealing alone does not qualify (Q274).
- Unhinted correct first recall qualifies for the configured small additional bonus. Assisted completion is not independent recall.
- Ignore case and outer whitespace, then match content-approved answers exactly; blank input is not an attempt. Do not silently correct spelling or internal spaces (Q272).
- Leaving/reloading resumes the same unfinished Review Occurrence with its submitted responses, hints, and attempts preserved; unsubmitted typing is not an attempt (Q273).
- No Blueprint/Celestium from Review.
- No daily cap in MVP.

## Content target

- 3 Maps.
- 4 difficulties per Map.
- 3 hulls.
- all 9 module subtypes introduced progressively.
- 5 technology levels per subtype.
- approximately 120–180 supported spellings.
- approximately 20–30 target words per Map.
- Normal Map Attempt target: approximately 4–6 minutes.

## Explicit MVP non-scope

- multiplayer/PvP/trading/chat;
- public leaderboards;
- ads or payments;
- cloud accounts and multi-device sync;
- live-AI word validation/grading;
- microphone pronunciation scoring;
- exact mid-combat save/resume;
- Scrap economy;
- Boss-only farming;
- random crit/miss/stun/heat/ammo/range systems;
- runtime dependency on Oxford or a remote dictionary.

## Content-rights gate

Oxford 3000/5000 may be used as curriculum/reference guidance only unless redistribution/runtime rights are verified. Public release must verify legal sources for definitions, examples, CEFR metadata, and pronunciation audio.
