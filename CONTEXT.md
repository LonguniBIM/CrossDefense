# Vocabulary Ship Game

This glossary defines canonical product/domain language for the vocabulary ship-building game. It intentionally excludes implementation details.

## Language

**Local Guardian Workspace**:
The browser-local container that owns all Pilot Profiles and the authoritative local game state for the MVP.
_Avoid_: Account, cloud account

**Workspace Settings**:
Device-local gameplay bindings, audio channel preferences and reduced-motion preference shared by every Pilot in the same Local Guardian Workspace. They remain distinct from Pilot difficulty, tutorial and learning state.
_Avoid_: Pilot preferences, Ruleset

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

**Falling Piece**:
An active or queued four-cell shape whose cells may carry a collectible payload. It is distinct from a Letter Tile retained for ship construction.
_Avoid_: Letter Tile, ship module

**Payload Cell**:
The specific cell of a Falling Piece carrying a collectible reward; that reward is collected only when this cell is cleared. Its identity follows the cell through rotation and Hold.
_Avoid_: Whole-piece reward

**Lock Delay**:
The adjustment interval after a Falling Piece becomes unable to descend, before its cells become fixed in the board. It is distinct from visual lock feedback and weapon timing.
_Avoid_: Module Cooldown, lock animation

**Letter Tile**:
A discrete owned item combining one A–Z letter with one combat module subtype. A tile may participate in horizontal and vertical words without being consumed.
_Avoid_: Letter block, character token

**Module Cooldown**:
The recovery period in which an equipped active module cannot begin its next activation. It is distinct from the time during which that module is actively applying its effect.
_Avoid_: Animation duration, Power recharge

**Weapon Cycle**:
One weapon activation together with its recovery before the next activation. Its full duration provides the basis for comparing average damage output.
_Avoid_: Map Attempt, firing animation

**Shield Recharge Delay**:
The damage-free waiting period before the ship's shared Shield pool may regenerate. It does not disable the protection provided by remaining Shield points.
_Avoid_: Shield shutdown, module cooldown

**Run Cargo**:
The capacity-limited collection of Letter Tiles retained by the active Run, including both tiles placed on the ship and unplaced tiles. Newly collected tiles awaiting acceptance remain in the separate Salvage Buffer.
_Avoid_: Inventory, warehouse

**Cargo Capacity**:
The maximum number of Letter Tiles retained in Run Cargo, counting placed and unplaced tiles equally. Moving a retained tile onto or off the ship does not change the capacity used.
_Avoid_: Unequipped tile limit

**Salvage Buffer**:
Temporary post-Attempt holding for newly collected Letter Tiles that must be resolved into Run Cargo or discarded before another Map Attempt starts.
_Avoid_: Second inventory, stash

**Learning Entry**:
A learning identity defined by a word, part of speech, and target sense. It is distinct from the combat-valid spelling identity.
_Avoid_: Word mastery record

**Review Occurrence**:
One tracked opportunity to practice a particular Learning Entry, distinct from the retries within it. Resuming an unfinished occurrence does not create a new first response or a second completion reward.
_Avoid_: Attempt, Map Attempt

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
