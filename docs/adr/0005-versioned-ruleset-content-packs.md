# Versioned Rulesets and immutable compiled Content Packs

**Status:** accepted

Game rules and game content are versioned separately. Human-editable authoring sources are deterministically validated/compiled into immutable runtime Content Packs, and an Active Run pins the Ruleset and Content versions it started with.

## Considered Options

- hard-code Maps/vocabulary inside application logic;
- mutable runtime content database updated in place;
- versioned Ruleset plus immutable compiled Content Packs.

## Consequences

Content updates can be staged and validated before activation, Last Known Good content remains available, old packs remain while referenced, and active Runs are not silently changed by a content/balance update.
