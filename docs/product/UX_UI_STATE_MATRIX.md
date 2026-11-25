# UX/UI Screen And State Matrix

## Status And Authority
2026-09-29. The user confirmed Shared Understanding for UX/UI + Detailed Design, including approved decisions Q228-Q283, this consolidated screen/state design, and its visual direction.
Read [UX_UI_DESIGN.md](UX_UI_DESIGN.md), [MVP_SPEC.md](MVP_SPEC.md), [Platform Architecture](../architecture/PLATFORM_ARCHITECTURE.md), and [Technical Architecture](../architecture/TECHNICAL_ARCHITECTURE.md) together. Existing domain and transaction rules remain authoritative.
[UX_UI_PREVIEW.html](UX_UI_PREVIEW.html) is an illustrative interaction study, not production gameplay. No real saves, purchases, rewards, imports, or exports occur in it.

## Screen Flow And Commit Boundaries

| Screen / state | Visible information and action | Transition / persistence contract | Trace |
| --- | --- | --- | --- |
| Bootstrap | Concise loading status; no gameplay controls before storage, ownership, schema, and content checks succeed. | Ready leads to Pilot chooser; failures use the recovery matrix below. Never render a fresh Workspace over unreadable data. | Architecture bootstrap |
| Pilot chooser / empty | Local nickname and stock avatar creation; existing Pilots show last-used highlight and explicit Continue. | Continue resolves that Pilot's actual saved state. No automatic map launch. | Q238, Q250 |
| Pilot learning summary | Encountered and used words; distinct independent, assisted, and delayed recall observations. | Read-only evidence projection; no inferred mastery percentage. | Q278 |
| New Run / Pre-Run Salvage | Enemy-free board; remaining content-defined collection quota; starter objective and Finish Salvage availability. | Minimum includes a viable target word of at least three letters with a Weapon Tile. Finish is enabled after the minimum; collection stops at quota exhaustion. Content validation must establish that the authored quota can satisfy the starter objective. | Q271; inherited starter constraints |
| Pre-Run top-out / reload | Retained collection progress; remaining quota; continue collection or enter Build if minimum already met. | Preserve committed tiles and quota; reset transient board only. No duplicate grants or reroll farming. Invalid content uses recovery, not invented starter grants. | Q271 |
| Build / ready | Cargo left, largest Ship Grid center, inspector right; Power and launch status persist. Default Cargo view is Unplaced; All marks equipped tiles. | Capacity counts every retained tile. Example: 16 placed plus 8 unplaced is 24/24. Salvage remains separate. | Q230, Q234, Q244, Q256 |
| Build / empty or filtered empty | Explain no matching unplaced tiles; retain counts and All/filter controls. Empty grid remains usable. | Filtering never changes inventory, tile identity, capacity, or build validity. No automatic hint reveal. | Q231, Q256 |
| Build / placement preview | Picked tile, legal target, affected words, before/after Power and stats. | Drag/drop, click-select-place, and keyboard produce the same validated intent. Preview is transient; commit succeeds only after validation and durable save. | Q235, Q247 |
| Build / rejected placement | Local reason at the target, such as occupied cell. Preserve both tiles. | No swap, overwrite, discard, or partial commit. Unsupported strings have neutral Not supported feedback and retain intrinsic effects. | Q245, Q247 |
| Build / return and history | Explicit Return to Cargo, Undo, Redo with enabled state. | Return is reversible without confirmation. History affects layout only; clear at reload, Attempt start, hull change, retained-tile/economy change. Undo itself is a validated durable command. | Q246, Q257 |
| Word inspector / hints | Spelling, pronunciation, POS/sense, definition, example; combat multiplier separately. Help me build reveals meaning, partial spelling, then requested answer. | Default hints use owned unplaced tiles, repeated letters correctly, Map targets first; equipped rearrangement is opt-in; exclude Salvage. No automatic placement or power/spatial guarantee. Exposure belongs to the shown sense; hint use persists independently of layout history. | Q236, Q248, Q261, Q275 |
| Hull change preview | Compatible coordinates retained; nonfitting tiles move to unplaced; show resulting words and Power. | Confirm one validated change. No discard or optimization; capacity unchanged by unplacing. Clear layout history after success. | Q258 |
| Permanent upgrade panel | Current balance, cost, actual effect, explicit purchase confirmation; return to Build. | Domain validates affordability and eligibility. Commit before displaying purchase success. No Undo of purchase. | Q243, Q246 |
| Map selection | Unlock status, theme/enemies, difficulty, First Clear versus Replay reward. | Remember selected Map and per-Pilot difficulty; Normal for new Pilot. No automatic escalation or auto-start. | Q253, Q263 |
| Start Map / blocked or advisory | List hard blockers: Power, unresolved Salvage, invalid state. No offensive output uses an advisory and Start anyway. | Hard blockers cannot be bypassed. Supported words are not an additional hard gate. Start only after a successful validated transition. | Q230, Q283 |
| Attempt / active | Fixed-camera 2.5D auto-battle LEFT (Q286 supersedes flat 2D); falling-block board RIGHT. Stable Hull, Shield, Threat, timer, Hold/Next. | Read-only simulation projections; input normalized into commands. Restrained effects, no player aiming or free camera. | Q232, Q239, Q280 |
| Attempt / paused | Pause reason, Resume, accessible settings, explicit abandon. | Pause both simulations for Escape, blur/hidden tab, instructional overlay, or insufficient viewport. Explicit Resume clears stale inputs, then 3-2-1 with clocks still paused. | Q237, Q241, Q254, Q279 |
| Results / completed | Distinguish victory, Hull destroyed, top-out, timeout; show factual outcome and committed loot. Review and Skip have equal discoverability. | Reward success appears only after commit. Optional 1-3 Reviews, then Build/Salvage. Retry returns to Build. | Q242, Q251, Q262 |
| Abandoned / interrupted | Explicit reason and already committed loot; return to Build. | No exact combat-state restoration; no automatic Review offer for abandon/recovery. Switching Pilot during an Attempt first requires explicit abandon. | Q238, Q251, Q264 |
| Final Map cleared | Celebrate; show replay and explicit New Run action. | Preserve current Run, Cargo, and layout; replay unlocked Maps. New Run requires a loss summary and confirmation. | Q266, Q282 |
| Review / open | Target meaning/context, labeled answer, Submit, staged help, Leave/Skip. Due Reviews also accessible from Build. | Resume the same unfinished Review Occurrence, preserving submissions and hints. Unsubmitted typing is not an attempt. | Q252, Q262, Q273 |
| Review / blank, wrong, assisted, correct | Blank validation; wrong-answer feedback and unlimited retries; distinguish independent first recall from assisted/retried success. | Ignore case and outer whitespace only; match content-approved answers exactly. Blank does not count. First correct grants completion Credits once; bonus only for unhinted correct first response. Reveal or skip alone grants no completion reward. | Q272-Q274 |
| Build / unresolved Salvage | New tiles with staged Keep/Discard; optional retained-tile replacements; projected capacity and build impact. | Apply disabled until all choices resolve and capacity is valid. Cancel changes nothing. Final summary names letter/type/count and affected build; atomic Apply commits all changes. | Q259 |
| Discard confirmation | Specific tiles, affected words/layout, no reward, no layout Undo recovery. | Confirm before permanent discard. Salvage's final summary fulfills confirmation without stacking another modal. | Q260 |
| Settings / Controls | Separate Music, Effects, Pronunciation, reduced motion; remappable gameplay bindings with conflict feedback and defaults. | Audio/motion are Workspace/device scoped; difficulty/tutorial/learning are Pilot scoped. Text entry does not trigger gameplay bindings. | Q268-Q269, Q277, Q281 |
| Backup / export | Workspace scope and local last-export time; no cloud/merge claim. | Export reports real completion/failure. Do not label a pending operation complete. | Q265 |
| Backup / import preview | Validation outcome, affected Pilots/Workspace, replace summary, Cancel/Confirm. | Validate schema and invariants, take pre-import recovery snapshot, then atomic Workspace replacement. Preserve active Runs with missing pinned content as Content Required. | Q265; architecture import |
| Restart Run / Delete Pilot | Run losses versus permanent progress kept; Pilot identity and permanent losses; optional export. | New Run/restart uses explicit confirmation; Delete Pilot requires typed nickname. No mandatory export gate. | Q266 |

## Error, Loading, And Recovery Matrix

| Condition | Presentation and available action | Required preservation |
| --- | --- | --- |
| Healthy command pending | Local Saving status; prevent duplicate/conflicting submission. Ordinary durability barriers do not introduce a resume countdown. | Do not claim saved or award twice. Resume normal flow only on acknowledged success. |
| Expected domain rejection | Inline actionable reason and retained editing context. | Last committed state stays intact; rejection is not a corrupt-save warning. |
| Storage unavailable / failed write | Blocking save explanation and Retry; pause durable gameplay. | Keep last durable truth and unresolved operation identity; retry through idempotent application contract. No blind duplicate command or false success. |
| Second tab owns Workspace | Explain another tab is active; offer retry after it closes. | No write, takeover, or reset masquerading as a recovery shortcut. |
| Ownership lost during use | Stop gameplay and writes, explain lost ownership. | Cancel transient drag/input; resolve durable state through ownership/recovery checks before re-entry. Do not replay uncommitted input automatically. |
| Corrupt Pilot, scope identifiable | Isolate affected Pilot and show recovery actions; other valid Pilots remain available when safe. | Preserve recoverable data; no silent deletion or currency reset. |
| Root/schema integrity uncertainty | Dedicated Workspace Recovery Mode; explain unavailable data and supported backup/recovery actions. | No blank-save replacement; uncertain contents are not represented as valid. |
| Content Required | Name unavailable pinned content and suspended Run; explain retry/content recovery and backup access. | Preserve Pilot/Run. Never silently substitute a different pack, restart, or discard. |
| Import invalid / cancelled / fails | Precise validation or save failure; remain in recovery/settings with next action. | Do not partially replace Workspace. Preserve original data/recovery snapshot according to transaction outcome. |
| Below 1280 x 720 CSS viewport | Window too small guidance, resize/fullscreen options; settings, backup, recovery remain accessible. | Prevent start or pause active gameplay. No forced browser zoom; explicit Resume when suitable. |
| Offline / update available | Factual ready/offline/update status; actionable only when possible. | Update at safe entry/Build after pending writes; no hot-swap or broken Run content pin. |
| Pronunciation unavailable | Text meaning remains visible; concise audio feedback. | No block to play or Review; no penalty or claim of pronunciation mastery. |
| Several simultaneous alerts | Storage/integrity first, then compact combat notices; loot remains quiet. | No stacked blocking dialogs or default screen shake. Preserve one clear next action. |

## Focus, Tutorial, And Presentation Contract
- Build uses Tab between controls/regions, arrows within Cargo/grid, Enter to select/pick/place, Escape to cancel, and Ctrl+Z / Ctrl+Shift+Z outside text fields. Closing a modal returns focus to its invoker. Equivalent pointer routes must not bypass validation.
- Default gameplay keys: arrows move, Down soft drop, Up or X clockwise, Z counterclockwise, Space hard drop, C or Shift Hold, Escape Pause. Show controls before play; remapping does not change rotation/timing rules.
- Guidance order: collect a Letter Tile, inspect its module, place a viable word, inspect Power/effects, start a Map. Track steps per Pilot, allow skip/reopen, and pause both simulations when an active-play overlay needs attention. Skipping guidance never bypasses Pre-Run requirements.
- English-only UI, docs, comments, and docstrings. Labels and module codes accompany color; letter identity stays prominent. Preserve native visible focus, readable contrast, and reduced motion. Learning evidence must never imply unsupported mastery.
- Accepted visual direction uses these preview tokens: navy background #0b1220, panel #121e30, text #edf3fb, secondary text #afbed1, action mint #8de3cd, warning #f0cd8a, error #ff9d9d. Spacing and colors remain reversible refinements; final production artwork and assets remain deferred.
- The reference gameplay viewport is 1366 x 768 CSS pixels, minimum 1280 x 720. Build's grid, capacity, Power and launch action and Combat's board/HUD must remain visible. Long Cargo lists/details need bounded regions or contextual expansion in production; no shrinking text to hide overflow.

## Presentation / Application Boundary
The following are logical UI needs, not new public API names or a state-management-library choice.

| Projection | Essential information | Intent boundary |
| --- | --- | --- |
| Entry / health | Workspace ownership, bootstrap status, Pilot summaries, content readiness, recovery reason | Select/continue Pilot, retry supported recovery; no direct aggregate edits |
| Build | Tile identities, equipped coordinates, unplaced items, total capacity, words, effects, Power, launch blockers, history availability | Preview locally; submit validated placement/return/history/hull/purchase/start intents |
| Attempt | Read-only clocks, board, Hold/Next, combat actors, HUD, pause/outcome status | Ordered gameplay inputs, pause/resume, explicit abandon |
| Results / Salvage | Committed outcome/rewards, unresolved buffer, retained tiles, projected staged result | Open/skip Review; submit one atomic Salvage resolution |
| Learning / Review | Learning Entry sense, Review Occurrence identity, submissions/hints, first-response evidence, completion/reward status | Submit answer/reveal/leave; record durable evidence through Application |
| Settings / backup | Settings scope, key conflicts, export time, import validation/replace summary | Validated settings changes and atomic backup operations |

## Verification And Explicit Deferrals
- 2026-09-29: existing Windows Playwright/Chromium rendered all seven main preview screens at widths 1366, 1280, 1024, 620, and 320 CSS pixels without document-level horizontal overflow or page JavaScript errors.
- Review smoke checks exercised blank rejection, wrong answer, hint, case/outer-space normalized correct answer, two submitted attempts, and completed-state retention across preview navigation. Salvage checks exercised overcapacity blocking and a valid four-for-four replacement summary. Content Required recovery selection rendered.
- Visual inspection covered Build, Combat, and Salvage. After desktop spacing refinement, the application surface measured 712 px high for Build and 623 px for Combat at both 1280 x 720 and 1366 x 768. The external design-review toolbar is excluded from gameplay sizing.
- These are preview checks, not proof of production persistence, deterministic simulation, accessibility conformance, full key remapping, roving grid focus, drag/drop equivalence, or every recovery branch. Production acceptance tests must exercise real public behavior.
- Preview tabs select illustrative states, not in-game navigation. Settings/upgrade/audio/backup actions partly explain proposed behavior. Sample hull shapes, counts, rewards, words, multipliers, combat values, and artwork are fixtures, not new content/balance decisions.
- Narrow preview layouts stack to support conversation review; this does not permit gameplay below the approved minimum viewport. Dynamic long-content and maximum-inventory fit still require production validation.
- UI framework, Combat renderer, state-management library, production audio abstraction, and content compiler remain deliberate technology deferrals. Fixed-camera 2.5D Combat (Q286) and DOM-first Build constrain evaluation but do not select a winner. Exact starter quota and final content/assets require content validation and tuning.
- No production implementation, final ticket approval, commit, or push is implied. The behavioral frontier for this UX scope is closed; final consolidated Shared Understanding was confirmed by the user on 2026-09-29.
