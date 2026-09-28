# MVP Product Specification

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

## Falling-block rules

- 10 columns × 20 visible rows plus spawn area.
- Seven four-cell tetromino-style piece geometries with original branding/art.
- Ghost Piece, Hold, and approximately three-piece Next Queue.
- Normally one visible payload-bearing cell per piece.
- Payload rotates with its cell.
- Payload is collected only if that exact cell is line-cleared.
- Multiple payload cells cleared together are all collected exactly once.
- Main payload: Letter Tile; rare payload: Blueprint Fragment.
- Celestium is not a falling-block payload.
- Threat rises when a piece locks; line clears do not reduce Threat.
- Difficulty does not change falling-block rules or gravity.

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

## Cargo / Salvage

- Starting Cargo Capacity: **24 Letter Tiles**.
- MVP target capacity: approximately **40**.
- Additional slots are permanent Pilot progression bought one at a time using Credits + Celestium, with escalating cost.
- Newly collected Letter Tiles enter Salvage Buffer.
- Salvage must be completely resolved before another Attempt begins.
- Unwanted letters may be discarded for no reward.
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

- Optional 1–3 prompts after a Map.
- Primary form: meaning/context → learner types the English word.
- Rewards are committed before Review begins.
- Review may be skipped without penalty.
- Each scheduled review occurrence may grant a small Credits completion reward once.
- Correct first recall without hints may grant a small additional bonus.
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
