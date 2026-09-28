# Product Platform Architecture

## Status

Approved through Product Platform Design Q151–Q179.

## Platform shape

```text
┌──────────────── Presentation ────────────────┐
│ screens / input / animation / audio          │
│ reads projections, emits intents             │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────── Application ─────────────────┐
│ explicit game-language use cases             │
│ orchestration / serialized command gate      │
│ transactional units of work                  │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────── Domain Core ─────────────────┐
│ run │ ship │ words │ combat │ economy        │
│ learning │ progression │ threat              │
└───────────────┬───────────────────┬───────────┘
                │                   │
          durable truth       projections/events
                │                   │
┌───────────────▼─────────┐   ┌─────▼──────────┐
│ Local Persistence       │   │ UI / Telemetry │
│ aggregates+migrations   │   │ observers      │
└─────────────────────────┘   └────────────────┘

       Ruleset + compiled Content Packs
                    │
             validated before use
```

## Platform decisions

### Distribution

- Offline-capable web app.
- PWA installation is optional.
- One URL remains a valid entry point.
- After successful initial loading/caching, the full core MVP remains usable offline.

### Deployment shape

Use a **Modular Monolith**. One deployable web application is divided by domain responsibility rather than by screen or service boundary.

### Headless Domain Core

The Domain Core owns gameplay truth and must run without:
- DOM;
- UI framework;
- rendering engine;
- audio;
- browser storage;
- network.

UI expresses intent. Domain owns truth. Persistence stores committed truth.

### Modules by domain responsibility

Canonical bounded areas:
- Run / Map Lifecycle;
- Ship Build;
- Word / Vocabulary;
- Combat;
- Economy / Progression;
- Learning / Review;
- Content;
- Workspace / Pilot.

Screens are orchestration/presentation, not domain ownership boundaries.

### Lifecycle state machine

Use one explicit primary lifecycle state rather than combinations of booleans.

Representative lifecycle:

```text
NoRun
  ↓
PreRunSalvage
  ↓
Build
  ↓
MapAttempt
  ├─ Victory
  ├─ Failure
  ├─ Abandon
  └─ Interrupted
       ↓
     Build

Victory
  ├─ OptionalReview
  └─ Build
```

### State ownership

Persistent state is organized into a small number of aggregates rather than one giant object or hyper-granular entities.

Representative shape:

```text
Workspace
├── WorkspaceMeta
└── Pilots[]
      ├── ProfileProgression
      ├── ActiveRun
      ├── LearningState
      └── Settings
```

### Event model

Do not use full Event Sourcing.

Use current-state snapshots plus transactional domain/application operations and stable operation IDs where retry/idempotency matter.

Post-commit events are notifications/observers, not a second path for important state mutation.

### Application layer

Prefer explicit game-language use cases such as:
- StartRun;
- RetryMap;
- CollectPayload;
- MoveLetterTile;
- PurchaseUpgrade;
- SubmitReviewAnswer.

Do not introduce a generic enterprise command/event framework merely for uniformity.

### Read models / projections

Presentation does not bind directly to internal aggregates. Each screen consumes projections/read models suited to its UX.

Example Build projection:

```text
BuildViewModel
├── shipGrid
├── activeWords
├── invalidSequences
├── powerAvailable
├── powerRequired
├── statSummary
├── cargo
├── salvage
└── mapPreview
```

### Data-driven content

Separate:

```text
Ruleset     = HOW the game works
Content Pack = WHAT exists in the game
Player State = WHAT the player has done
```

Content authoring sources are compiled/validated into immutable runtime Content Packs.

### Version pinning

An Active Run pins a Ruleset Version and Content Version. New validated versions apply to new Runs; existing Runs continue on their pinned versions while required packages remain available.

### Content activation

New content uses staged validation and Last Known Good behavior:

```text
Authoring Source
→ deterministic validate/compile
→ candidate immutable pack
→ compatibility/integrity validation
→ available pack
→ activate only at a safe boundary
```

### Save policy

Durable state persists after each committed domain command with durable consequences. Do not rely on periodic autosave for correctness.

Preview-only UI interactions do not need durable writes.

### Fault policy

Never show durable success before durable commit succeeds. A storage failure pauses progression at a safe boundary rather than allowing the game to continue generating uncommitted permanent rewards.

### Internal diagnostics

Provide internal/debug visibility for at least:
- lifecycle state;
- App/Ruleset/Content versions;
- simulation tick/time;
- Threat;
- active enemy;
- ship stats;
- Power calculation;
- active words/multipliers;
- recent commands/events;
- persistence health.
