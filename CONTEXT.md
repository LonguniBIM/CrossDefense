# Vocabulary Ship Game

This glossary defines canonical product/domain language for the vocabulary ship-building game. It intentionally excludes implementation details.

## Language

**Local Guardian Workspace**:
The browser-local container that owns all Pilot Profiles and the authoritative local game state for the MVP.
_Avoid_: Account, cloud account

**Pilot Profile**:
An independent learner/player progression inside a Local Guardian Workspace, including permanent progression, learning history, review schedule, and one active Run.
_Avoid_: User account, character account

**Run**:
A journey that begins with Pre-Run Salvage and Map 1 and owns Run-specific Letter Tiles, Cargo contents, word layout, and currently accessible Maps.
_Avoid_: Session, campaign

**Map Attempt**:
One try at one selected Map on one selected difficulty. Combat/falling-block simulation state exists only for that Attempt and is not resumed exactly after interruption.
_Avoid_: Run, match

**Pre-Run Salvage**:
The controlled opening phase of a Run in which the learner gathers an initially viable Letter Tile set without active enemies.
_Avoid_: Tutorial round, free farm

**Build Phase**:
The untimed safe phase where the learner manages hull choice, Letter Tile layout, words, Cargo, Salvage, upgrades, Map selection, and difficulty.
_Avoid_: Lobby

**Letter Tile**:
A discrete owned item combining one A–Z letter with one combat module subtype. A tile may participate in horizontal and vertical words without being consumed.
_Avoid_: Letter block, character token

**Run Cargo**:
The capacity-limited collection of Letter Tiles retained by the active Run between Map Attempts.
_Avoid_: Inventory, warehouse

**Salvage Buffer**:
Temporary post-Attempt holding for newly collected Letter Tiles that must be resolved into Run Cargo or discarded before another Map Attempt starts.
_Avoid_: Second inventory, stash

**Learning Entry**:
A learning identity defined by a word, part of speech, and target sense. It is distinct from the combat-valid spelling identity.
_Avoid_: Word mastery record

**Target Word**:
A supported word selected as curriculum content for a Map. Target status affects learning/discovery behavior, not the base combat formula.
_Avoid_: Required word

**Ruleset**:
A versioned definition of how gameplay behaves, such as word multipliers, damage order, difficulty rules, Power semantics, and rounding boundaries.
_Avoid_: Content pack, balance file

**Content Pack**:
A versioned immutable runtime package defining what exists in the game, such as Maps, enemies, hull definitions, vocabulary, learning content, audio manifests, and assets.
_Avoid_: Ruleset

**First-Clear Reward**:
A one-time Profile-level reward for first completion of a Map, independent of difficulty.
_Avoid_: First-win bonus per difficulty

**Replay Reward**:
A repeatable Map victory reward that may scale with difficulty after First-Clear rules are applied.
_Avoid_: First-Clear Reward
