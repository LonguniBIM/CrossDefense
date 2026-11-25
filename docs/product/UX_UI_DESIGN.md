# UX/UI Detailed Design

## Status And Authority

Shared Understanding confirmed by the user on 2026-09-29 for UX/UI + Detailed Design, including Q228-Q283 (56 UX decisions), the consolidated screen/state matrix, and visual direction. The behavioral frontier for this UX scope is closed. Production implementation still requires the refreshed implementation specification and approved final tickets.
See [UX_UI_STATE_MATRIX.md](UX_UI_STATE_MATRIX.md) for screen, action, persistence, focus, and recovery coverage, and [UX_UI_PREVIEW.html](UX_UI_PREVIEW.html) for the illustrative design review.
Read together with [MVP_SPEC.md](MVP_SPEC.md), [CONTEXT.md](../../CONTEXT.md), and the accepted architecture and technology decisions.

## Approved Foundation

| Decision | Approved behavior |
| --- | --- |
| Q228 Visual direction | Readable stylized 2D science fiction, with clear shapes and controlled color. Avoid overly childish styling and excessive glow. Detailed tokens and assets remain open. |
| Q229 First use | Skippable contextual guidance inside the first real Run, with help available again later. Teach collecting Letter Tiles, constructing a word, observing ship effects, and starting a Map. Exact steps remain open; Q237 defines pause behavior. |
| Q230 Build information | Ship Grid, Run Cargo, Power, and summary stats stay visible. Selecting a tile or word reveals contextual details. Start Map blockers, including insufficient Power and unresolved Salvage, remain easy to see. |
| Q231 Vocabulary assistance | Player-led word discovery with visible on-demand staged hints. Help may be advertised without automatically revealing answers. Preserve meaning/context, partial spelling, then explicitly requested full-answer progression and existing learning-evidence rules. |
| Q232 Combat attention | Falling-block play gets primary interaction attention. Auto-battle provides readable secondary feedback through HP, Shield, Threat, and important alerts, with restrained effects that explain build consequences. This does not decide or reverse region placement. |
| Q233 Viewport | Reference layout: 1366 x 768 CSS pixels. Minimum target gameplay viewport: 1280 x 720 CSS pixels. These refer to browser content space, not physical screen resolution; Q241 defines smaller-viewport behavior without changing browser zoom. |

## Approved Screen And Interaction Direction

| Decision | Approved behavior |
| --- | --- |
| Q234 Build layout | Run Cargo on the left, largest Ship Grid in the center, contextual tile/word details on the right. Power, summary stats, and Start Map remain easy to see. |
| Q235 Tile input | Equivalent drag/drop, select-then-place, and keyboard placement routes. All respect the same preview/commit boundary. |
| Q236 Hint surface | Help me build opens staged hints in the contextual detail area while Ship Grid and Cargo stay visible. The player requests each reveal. |
| Q237 Guided play | Prefer instruction in safe phases. Instructional overlays during active play pause falling blocks and Combat together; the player explicitly resumes. No separate tutorial reward mode. |
| Q238 Entry | Show Pilot selection, highlight the last-used Pilot, and require explicit Continue. Interrupted Attempts return to Build under the accepted recovery policy. |
| Q239 Attempt HUD | Stable Hull, Shield, Threat, timer, Hold/Next indicators; no routine floating damage numbers by default. Important events remain visible through concise feedback. |
| Q240 Visual/accessibility | Dark navy surfaces, readable contrast, letter-first tiles, module icons and labels rather than color alone, visible keyboard focus, and reduced-motion support. Exact tokens remain open. |
| Q241 Small viewport | Below the minimum gameplay target, pause active gameplay or prevent its start. Explain resize/fullscreen options without changing browser zoom. Settings, backup, and recovery remain accessible. Explicit resume is required once the viewport is suitable. |
| Q242 Victory flow | Show committed results/rewards, offer optional Review with equally visible skip, then return to Build for Salvage resolution. Resolve all Salvage before the next Attempt. Q262 extends the offer to completed failures and provides due Review access from Build. |
| Q243 Progression | Open Hull, Technology, and Cargo Upgrade panels from Build; closing returns to the Build layout. Permanent purchases require clear explicit confirmation. |

## Approved Detailed Behavior

| Decision | Approved behavior |
| --- | --- |
| Q244 Cargo counting | Capacity counts all retained tiles, placed and unplaced; Salvage Buffer is separate. Example: 16 placed + 8 unplaced = 24/24. Placement does not free capacity. |
| Q245 Occupied cell | Reject placement into an occupied cell with a clear cue; preserve both tiles. No automatic swap, overwrite, or discard. |
| Q246 Undo/Redo | Undo/Redo covers tile-layout edits in the current uninterrupted Build editing context. Exclude purchases, rewards, discards, hints, and learning evidence. End history at reload, Attempt start, hull change, or retained-tile/economy changes. Undo is a validated durable command, not storage rollback. |
| Q247 Preview feedback | Highlight affected words and before/after Power or stats during preview. Only successful placement commits. Unsupported strings use neutral Not supported feedback, retain intrinsic tile effects, and do not alone block launch. |
| Q248 Word inspector | Show spelling, pronunciation playback, part of speech, selected target sense, a short definition and example, plus separate multiplier/combat effects. Keep Learning Entry identity distinct from spelling. |
| Q249 Tutorial progress | Track instructional steps per Pilot; allow skip/reopen and do not repeat completed guidance on every Run. Tutorial completion is not vocabulary mastery and has no separate reward. |
| Q250 Pilot creation | Local nickname and preset avatar; no requirement for real name, email, or birthdate. |
| Q251 Results | Distinguish victory, Hull destruction, top-out, timeout, abandon, and interruption. Clearly identify committed loot; Retry/recovery returns to Build. Use observed facts, not unsupported causal claims or guaranteed-win advice. |
| Q252 Review | Explicit text-answer submission, unlimited retries, optional staged hints, and skip/leave at any point. Preserve the first response and attempts-to-first-correct; no repeat rewards for the same occurrence, and no independent-recall credit for skipped or hint-assisted responses. |
| Q253 Map selection | Map cards show unlock state, theme, enemy traits, difficulty, and First-Clear versus Replay reward distinctions. Remember the last explicit difficulty selection; do not automatically increase it. Q263 defines the default and per-Pilot persistence scope. |
| Q254 Pause/input | Visible Pause and Escape pause both falling-block and Combat simulation when gameplay has focus. Focus loss or hidden-tab suspension requires explicit Resume. In Build, Escape cancels preview or closes the top panel. Text fields do not receive gameplay shortcuts. |
| Q255 Fault UI | Inline expected domain rejections; blocking recoverable-storage dialog with Retry; dedicated integrity-recovery screen; explanatory second-tab lock screen. Preserve data and never claim uncommitted rewards are saved. |

## Approved Cargo, Recovery, And Controls

| Decision | Approved behavior |
| --- | --- |
| Q256 Cargo views | Default Unplaced view; optional All view with equipped badges; stable A-Z sort and subtype filters. Always show total capacity and placed/unplaced counts. Duplicate-looking tiles retain separate identities. |
| Q257 Return tile | Explicit Return to Cargo moves a selected placed tile to the unplaced pool, with impact preview and ordinary layout Undo. No destructive confirmation or implied discard. |
| Q258 Hull switch | Preview and confirm. Retain tiles in compatible positions under a consistent grid origin; unplace non-fitting tiles. Show word/Power impact; never discard or auto-optimize. Returning to a prior hull does not imply saved loadouts. |
| Q259 Salvage batch | Stage keep/discard/replacement choices against current Cargo, show final capacity/build effects, and commit the confirmed batch atomically. Cancel leaves authoritative state unchanged. Unresolved or over-capacity candidates cannot apply; no automatic discard or launch with unresolved Salvage. |
| Q260 Discard | Explicit summary of letters/subtypes/count and affected layout; no reward or layout-Undo recovery. The final Salvage confirmation can satisfy this requirement without a duplicate dialog. |
| Q261 Hint candidates | Use unplaced owned tiles by default, prioritize current-Map Target Words, and include equipped tiles only by explicit opt-in to rearrangement. Exclude unresolved Salvage, honor repeated-letter quantities, and report no supported candidate honestly. No auto-placement or guarantee of spatial/Power feasibility. |
| Q262 Review access | Optional 1-3-prompt offers after completed victories and failures, plus due Review access from Build. No automatic offer after abandon or interruption recovery. Preserve occurrence-level reward idempotency. |
| Q263 Difficulty | New Pilots default to Normal; remember each Pilot's last explicit choice across Maps and Runs. No automatic escalation. |
| Q264 Pilot switch | Switch from safe Build/no-Run screens. During an Attempt, require explicit abandonment confirmation, keep committed loot, and do not promise exact combat resume. Q271/Q273 preserve committed Pre-Run progress and unfinished Review evidence when those flows are left; neither promises exact falling-board resume. |
| Q265 Backup | Workspace Settings exposes Export Backup, Import Backup, local last-export time, and local-data scope. Import previews affected Pilots and replacement effects before existing staged atomic restore. No merge/cloud-sync implication. |
| Q266 Destructive actions | Restart Run lists Run losses versus retained permanent progression. Delete Pilot shows identity and permanent losses and requires typed nickname confirmation. Offer export without making it mandatory. |
| Q267 Readiness/update | Small factual offline/update indicators. Update/reload is offered only at safe Build/entry boundaries after pending operations finish; no mid-Attempt hot swap and no violation of Run version pinning. |
| Q268 Gameplay bindings | Left/Right move; Down soft drop; Up or X clockwise rotation; Z counterclockwise rotation; Space hard drop; C or Shift Hold; Escape Pause. Show controls before play. This does not redefine rotation/gravity/timing rules. |
| Q269 Audio | Separate Music, Effects, and Pronunciation volume/mute; pronunciation on request, visual/text equivalents, and non-blocking missing-audio feedback. |
| Q270 Alerts | Blocking integrity/storage states have highest priority, important Combat warnings are compact, and routine loot is quiet. Do not stack modal alerts; no screen shake by default; honor reduced motion. |

## Carried-Forward Product Constraints

Earlier confirmed product context retrieved on 2026-09-29 records auto-battle on the left and falling-block play on the right, explicitly requested for PC keyboard/mouse use on 2026-09-25. Preserve this orientation; Q234 is the separate Build screen layout.
The same prior context records controlled, enemy-free, finite Pre-Run Salvage yielding at least one viable target word of three or more letters including a Weapon Tile. Q271 below defines the approved completion and interruption policy.

## Approved Completion And Learning Contracts

| Decision | Approved behavior |
| --- | --- |
| Q271 Pre-Run | Finite content-defined collection quota; Finish Salvage requires a viable minimum starter including a target word of 3+ letters and a Weapon Tile. End collection at quota exhaustion. Top-out/reload preserves committed tiles and remaining quota but resets the transient board; no duplicate grants or reroll farming. Once the minimum is met, offer Build. Tutorial skip does not bypass gameplay requirements. |
| Q272 Review matching | Ignore case and trim outer whitespace, then match content-approved answers exactly. No fuzzy spelling correction, internal-space removal, or meaning substitution. Blank input is validation feedback, not an attempt. |
| Q273 Review resume | Persist occurrence identity, submitted responses, hints, and attempt evidence. Resume the same unfinished occurrence without resetting first-response evidence or duplicating rewards. Unsubmitted typing is not an attempt; leaving remains allowed. |
| Q274 Review Credits | One completion reward on the first correct submission per occurrence, including after hints. Extra bonus only for an unhinted correct first response. Skip/reveal alone gives no completion reward; assisted completion is not independent recall. |
| Q275 Word senses | Prefer the current-Map target sense when available; provide labeled content-defined alternatives by part of speech/sense. Record exposure to the sense actually shown, not all senses. Combat remains spelling-based. |
| Q276 Build keyboard | Tab between regions/controls, arrows within Cargo/grid, Enter to select/pick/place, Escape to cancel, explicit Return to Cargo, Ctrl+Z / Ctrl+Shift+Z for layout Undo/Redo outside text fields. Restore modal focus to its invoker. |
| Q277 Settings scope | Audio volume/mute and reduced motion belong to the local Workspace/device; difficulty, tutorial progress, and learning evidence belong to the Pilot. |
| Q278 Learning summary | Compact per-Pilot evidence summary for encountered/used words and independent, assisted, and delayed recall. No unsupported mastery percentage. |
| Q279 Resume | User-triggered Resume shows 3-2-1 while both simulations remain paused and stale held/queued inputs are cleared. Ordinary successful durability barriers do not trigger countdowns. |
| Q280 Combat composition | Originally side-view 2D Combat in the LEFT region, falling blocks on the RIGHT. Q286 now supersedes the flat-2D presentation with fixed-camera 2.5D. Restrained module-specific effects, no free camera, and no player aiming remain. |
| Q281 Controls | Remappable gameplay bindings with conflict feedback and Restore Defaults, preserving text entry and keyboard access to Settings. |
| Q282 Final Map | Celebrate all MVP Maps cleared, preserve the Run/Cargo/layout, allow unlocked-Map replays, and make New Run an explicit confirmed action. |
| Q283 No offense | Advisory plus explicit Start anyway confirmation for a build with no offensive output. No new supported-word hard gate; existing Power, Salvage, and validity blockers remain authoritative. |

## Approved Component And Renderer Refinement (2026-09-30)

| Decision | Approved behavior |
| --- | --- |
| Q284 Component finish | Clean sci-fi panels and lightly beveled blocks, retaining navy surfaces, readable letters, and explicit interaction states. |
| Q285 Subtype icons | Consistent outline icons beside subtype labels: Ballistic/crosshair, Missile/rocket, Laser/scan-line, Armor/brick-wall, Shield/shield, System/cpu, Engine/flame, Power/battery-charging, Support/wrench. Letters stay visually primary. A prototype icon package is not a production dependency decision. |
| Q286 Combat depth | Expand Combat presentation to fixed-camera 2.5D and run a renderer experiment. This supersedes the flat-2D presentation part of Q228/Q280. Combat remains LEFT, falling blocks RIGHT; no free camera, player aiming, gameplay physics change, or renderer-owned domain truth. Build stays DOM-first. |

## Approved Build And Combat Feedback (2026-09-30)

| Decision | Approved behavior |
| --- | --- |
| Q287 Layout continuity | Build and Combat depict the same equipped module layout. DOM-first Build keeps Cargo left, the largest Ship Grid center, and Inspector right. The grid suggests the hull silhouette; letters remain primary with small subtype icons and restrained module detail. Fixed-camera 2.5D Combat translates that layout into visible modules. Selection shows icon, subtype, and effect in the Inspector. |
| Q288 Equipment feedback | Selection/movement shows a transient placement preview with valid/invalid cells, affected words, and before/after Power/stats. Only a successful authoritative commit triggers the short settle and single outline pulse; supported words may receive a restrained highlight. Rejection preserves the build and explains the reason. Reduced motion uses static state/outline changes. Do not display range rings without corresponding game rules. |
| Q289 Combat feedback | Restrained subtype-specific muzzle flashes, projectiles, missile trails/compact explosions, and thin brief laser beams originate from the equipped ship. Shield hit feedback and Hull damage reflect actual state/events. Engine exhaust is restrained; Power/System/Support activity cues require a real state/event basis. Preserve falling-block attention priority, no default screen shake or routine floating damage numbers, and no per-module destruction fiction without a corresponding rule. |

## Approved Combat Timing And Cooldown UI (2026-09-30)

| Decision | Approved behavior |
| --- | --- |
| Q290 Subtype timing | Ballistic uses 0.8-second shot intervals; Missile uses 3-second launch intervals; Laser is active for 0.6 seconds then recovers for 1.8 seconds. Shield regeneration waits 3 damage-free seconds and then uses 1-second pulses. Support repairs every 3 seconds. Armor/System/Engine/Power remain passive. These are starting experiment values, not final balance. |
| Q291 Timer ownership | Weapon and Support timers belong to individual equipped tiles. Shield uses a shared ship pool/recharge delay. No multiple banked attacks or repairs. Timers follow Simulation Clock pauses, not wall time; target changes do not reset cooldown. New Attempts initialize timers. |
| Q292 Scaling | Word bonuses and Technology increase effect magnitude, not activation cadence. Evaluate weapon DPS over the full cycle; existing effect placeholders still need explicit per-activation units and tuning. |
| Q293 Timing UI | Inspector shows subtype, Passive or activity/recovery timing, per-activation effect, and estimated DPS where applicable. Combat uses small bars/outlines; selected modules expose state and remaining time. Shield amount and recharge state remain distinct. Reduced motion omits decorative motion; avoid numeric countdowns over every module. |

Q294-Q298 are approved: Ready weapons, injury-triggered Support cycles, fixed simulation-owned impact delays, distributed Laser damage with no target-loss reset, exact Shield recharge boundaries, damage/terminal/repair ordering, mutual-destruction failure, and explicit experimental effect magnitudes. See [COMBAT_TIMING.md](COMBAT_TIMING.md) for the complete contract; the cooldown decision frontier is closed. Q289 visual effects must reflect these authoritative timings. The original renderer benchmark predates this refinement. An isolated [Build/Combat interaction study](../../prototypes/fixed-camera-renderer/review/README.md) now implements the accepted timing and feedback for review; it is not production gameplay.

The initial Shared Understanding remains the behavioral baseline. Component detail and the new 2.5D visual treatment continue in [the active refinement plan](../plans/completed/ui-components-fixed-camera-renderer.md). The earlier UX_UI_PREVIEW.html is the historical flat-2D study; the new experiment is in prototypes/fixed-camera-renderer.

## Approved Falling-Block Layout And Attempt HUD (2026-10-01)

| Decision | Approved behavior |
| --- | --- |
| Q299 Board composition | Keep Combat LEFT and falling blocks RIGHT. The later explicit no-scroll request supersedes the earlier 22-pixel cell target: scale the 10 x 20 well to leave room for harvest without vertical scrolling. Place Hold to the left of the well and exactly three Next previews vertically to its right. Following user feedback on 2026-10-01, Hold and Next use the same cell, letter, and subtype-icon sizes as the active piece. Reserve four cell columns per preview side. Scale cells with available height and width without a fixed 44-pixel maximum; this supersedes the approximate 30-35% cluster-width target. Combat retains the larger remaining region. Preserve HUD/control fit and the minimum-viewport policy. Below the well, show the compact summary, receipt, controls and the subsequently requested subtype harvest table. The later no-scroll request removes vertical scrolling in this region; no extra lower area is reserved for unspecified future features. |
| Q300 Payload identity | Ordinary cells use simple neutral surfaces. A payload-bearing cell shows a primary letter, small subtype icon, and subtype-colored border. Hold and Next previews preserve the payload's actual cell position. Keep detailed equipment art in Ship Grid/Combat; use compact signs in the falling-block well. Existing non-letter payloads retain their distinct identity and must not be shown as Letter Tiles. |
| Q301 Collection feedback | Briefly highlight cleared rows and their collected payload cells. Only after the authoritative operation succeeds, show a concise adjacent receipt such as "Collected: A - Shield" and update the Salvage count. Batch payloads from the same clear. Feedback is nonmodal and adds no gameplay interruption; existing durability barriers still pause both simulations until commit succeeds. Never label an uncommitted collection as saved. |
| Q302 HUD distribution | Place Threat and Map time above the falling-block region; Hull, Shield, and enemy state above Combat; the collected-payload summary below the well. Use one compact, consistently placed strip for critical Combat warnings, never covering the active piece. Preserve storage/integrity priority and existing blocking recovery behavior. |

The user accepted Q299-Q302 as recommended on 2026-10-01 (Asia/Bangkok). The later Shared Understanding confirmation authorized the playable prototype. Further user feedback adds an Attempt harvest breakdown: all nine canonical subtype icons/names, zero-count entries, collected letters grouped with duplicate quantities, and a total letter-tile count per subtype. Update only after successful collection acknowledgment; pending/failed commits do not change the table. The user's later placement refinement puts it below Tetris, with equal active/Hold/Next cell sizes; the subsequent request explicitly shrinks the board to avoid vertical scrolling. It uses a short count emphasis with a reduced-motion fallback and resets on a new Attempt. Below Combat, show player equipped words on the left and enemy equipped words on the right, one row per supported word, with actual letter/subtype identity and tile multipliers. Build has the same Equipped Words table for the committed Ship Grid, updated after edits and Undo. Empty fleets show No equipped words. See the consolidated Falling Blocks design for the current contract.

## Approved Falling-Block Interaction Feedback (2026-10-01)

| Decision | Approved behavior |
| --- | --- |
| Q303 Piece states | Give the active piece a clear bright outline. Locked cells use quieter surfaces while preserving letter readability. The Ghost Piece uses thin outlines without duplicate letters or subtype icons. Where the ghost overlaps the active piece, prioritize the active piece. |
| Q304 Movement and rotation | Display authoritative cell moves and rotations immediately, without sliding or turning animations that delay control feedback. Payload follows its actual cell while the letter remains upright. A blocked action preserves position; do not shake the board or repeatedly show rejection messages. |
| Q305 Hard Drop and lock | Show a short 80-120 ms trail along the actual Hard Drop path. An actual lock produces one outline highlight before the piece becomes visually locked. Update Threat from the authoritative lock event; presentation does not delay subsequent input. |
| Q306 Line-clear effect | Briefly highlight cleared rows for 120-180 ms and emphasize payload cells collected in that clear. Draw effects behind the active piece without obscuring letters or delaying gameplay. Batch collection receipts under Q301 and preserve its commit-success boundary. Reduced motion uses outline/color changes without moving trails. |
| Q307 Hold and Next feedback | A successful Hold updates both affected displays immediately and briefly highlights the Hold outline. When Hold is unavailable under the gameplay rules, show a subdued state and concise explanatory label. Update Next order immediately without flying pieces across the screen; preserve each payload's cell position in previews. |
| Q308 High-stack warning | When any locked cell occupies the top four visible rows, show a steady warning border and the label "Stack high" near the well. Remove the warning when that condition no longer holds. Do not flash continuously or cover cells with a tint. This is a visual warning, not a new top-out condition. |

The user accepted Q303-Q308 as recommended on 2026-10-01 (Asia/Bangkok). Effect durations are presentation tuning targets, not gravity, lock delay, or input-repeat rules. Existing pause, reduced-motion, and durability constraints remain authoritative.

## Approved Falling-Block Control Rules (2026-10-01)

| Decision | Approved behavior |
| --- | --- |
| Q309 Gravity and drop | Automatic gravity moves one cell every 800 ms, held Down moves one cell every 50 ms, and Hard Drop moves to the Ghost Piece position and locks immediately. Soft Drop reaching a surface retains the ordinary adjustment delay. Gravity remains constant within an Attempt and does not increase with Threat or difficulty. Timing values are starting experiment values. |
| Q310 Input repeat | Left/Right move one cell immediately on press, then repeat every 50 ms after a 150 ms initial delay. When both directions are held, the most recently pressed direction wins. Rotation, Hold, and Hard Drop activate once per press and require release before reactivation; operating-system key repeat must not create additional activations. |
| Q311 Rotation | Rotate in 90-degree steps. If the unshifted result is blocked, test a fixed ordered table of small one- or two-cell compensating offsets for that piece type; accept the first valid result, not an arbitrary nearby gap. Payload follows its cell, including inside the square piece whose outer silhouette may remain unchanged. No 180-degree binding in the MVP. Exact pivots, spawn coordinates, and offset tables must be explicit in the detailed rule data before implementation. |
| Q312 Lock Delay | When a piece cannot descend, allow 500 ms for adjustment. A successful move or rotation while grounded may reset this delay, at most 15 times per piece. Blocked actions do not reset it. Hard Drop locks immediately. The reset limit prevents indefinite grounded adjustment while Combat continues. |
| Q313 Hold eligibility | Allow one successful Hold before each piece lock. With an empty Hold slot, store the active piece and take the first Next piece. With an occupied slot, swap without consuming Next. A retrieved piece uses the canonical spawn position and orientation while retaining its identity, payload, subtype, and corresponding payload cell. Hold neither regenerates rewards nor increases Threat. |
| Q314 Spawn and top-out | Use four hidden rows above the 20 visible rows and a fixed centered spawn position for each shape. Top-out occurs when an incoming piece cannot spawn, including after Hold, or when locked cells remain in hidden rows after lock and line-clear resolution. A last-moment line clear may rescue the board. During an Attempt top-out is failure; Pre-Run recovery remains governed by Q271. |
| Q315 Shape sequence | Shuffle groups containing each of the seven shapes exactly once and consume each group in order. Shape order and payload selection use isolated gameplay RNG streams. Hold/Next never reroll payloads. Pre-Run continues to honor its finite, viable starter-content contract. |

The user accepted Q309-Q315 as recommended on 2026-10-01 (Asia/Bangkok). These decisions authorize documentation, not production implementation.

## Approved Falling-Block Boundary Cases (2026-10-01)

| Decision | Approved behavior |
| --- | --- |
| Q316 Loss of ground contact | Suspend remaining Lock Delay while airborne and resume it on renewed contact. Only eligible successful grounded actions under Q312 replenish the delay. Preserve the reset count throughout the current piece's control period; descending to a lower surface does not grant 15 new resets. |
| Q317 Input across pieces | Held Left/Right continues with a fresh 150 ms repeat delay; held Down first descends after 50 ms. Incoming pieces, including Hold retrievals, start fresh gravity and lock timers. Do not carry consumed rotation/Hold/Hard Drop activations into the next piece. Pause/Resume still clears held/queued input. |
| Q318 Clear and collapse | Clear all full rows simultaneously. Move each remaining row down by the number of removed rows below it, preserving relative cell positions. No independent-cell gravity or automatic cascades. Payload follows its cell and is collected only if its actual row is cleared. |
| Q319 Same-tick terminal outcomes | Complete eligible events of the final simulation tick and retain payloads cleared in that tick. Failure wins over simultaneous victory. Primary failure precedence is Hull destroyed, then top-out, then timeout; retain concurrent causes for diagnostics. Persist collection and terminal outcome atomically; publish success only after commit. No further inputs or rewards after termination. Preserve Q297 damage-before-terminal-before-repair ordering. |

The user accepted Q316-Q319 as recommended on 2026-10-01 (Asia/Bangkok). See [FALLING_BLOCKS_DESIGN.md](FALLING_BLOCKS_DESIGN.md) for the consolidated contract, explicit spawn/rotation and input details, and playable experiment scope. The user confirmed this complete Shared Understanding on 2026-10-01 and explicitly authorized the isolated playable prototype. Production implementation remains gated.

## Current Annotated Layout Refinement (2026-10-01)

The user's annotated six-point request moves Build Equipped Words to the bottom-right, adds Equipped Tiles by subtype below Ship Grid, and extends Run Cargo through both rows. Equipped Tiles counts only committed grid tiles, including those outside supported words; Cargo and hover previews are excluded. Combat Hull/Shield/enemy labels, numbers and bars use matching rows. The fixed-camera bottom border aligns with the Tetris panel border. The redundant module tile strip and its selected-module detail row are removed, without changing module ownership or cooldown rules. Tetris and harvest must fit without vertical scrolling; smaller equal active/Hold/Next cells supersede the prior 22-pixel minimum. See FALLING_BLOCKS_DESIGN.md for the current contract.

## Preserved Constraints

- English-only product UI; all repository documentation, code comments, and docstrings are English.
- PC/laptop, offline-first, local Pilot Profiles, and one writable gameplay tab remain the MVP boundary.
- Preview is separate from committed Build state. UI renders projections and emits intents; Domain owns rules.
- Hints do not reduce combat power. Combat success, spelling, and audio playback do not prove meaning or pronunciation mastery.
- Rewards are displayed as saved only after successful commit. Interrupted Attempts return to Build with committed loot.
- UI framework and Combat renderer remain unresolved. Technology prototypes do not establish production usability.


## Current Visual Acceptance And Implementation Handoff (2026-10-01)

The user accepted the current design after the no-scroll Falling Blocks revision and requested the next step. Earlier statements that human visual review remains open are historical. Preserve this layout and art direction as the implementation baseline. This acceptance does not certify final balance, all production assets, accessibility conformance, or automatically select the production renderer.
See the [refreshed implementation specification](IMPLEMENTATION_SPEC.md) and [proposed ticket breakdown](IMPLEMENTATION_BREAKDOWN.md). Production coding still requires the repository specification/ticket gate; technology proposals remain explicit.
