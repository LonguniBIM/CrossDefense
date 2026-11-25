# Falling Blocks Detailed Design

Status: Shared Understanding confirmed on 2026-10-01 (Asia/Bangkok), including Q299-Q319, the completion tables/input details, and the playable experiment scope. The user explicitly authorized implementation of this isolated prototype.
Authority: [UX decisions](UX_UI_DESIGN.md), [MVP specification](MVP_SPEC.md), [Combat timing](COMBAT_TIMING.md), and [technical architecture](../architecture/TECHNICAL_ARCHITECTURE.md).
The isolated renderer study now implements the playable board and shared Combat integration. See [run instructions](../../prototypes/fixed-camera-renderer/review/README.md). This document does not authorize production implementation.

## Accepted Presentation Contract
- Combat LEFT; falling-block cluster RIGHT. Following the 2026-10-01 no-scroll request, size the well to fit Tetris and harvest together within the viewport; this supersedes the earlier 22-pixel minimum and 220 x 440 target. Following user feedback on 2026-10-01, Hold and Next use the same cell, letter, and subtype-icon sizes as the active piece. Reserve four cell columns for each preview side. Scale the well with available height and width, without a fixed 44-pixel maximum. Equal preview sizing supersedes the earlier approximate 30-35% cluster-width target; Combat retains the larger remaining region.
- Below the well, place the compact collection/line summary, receipt, controls and the user-requested subtype harvest table. Leave safe viewport margins; no extra area is reserved for unspecified future features.
- Hold sits left of the well; exactly three Next previews sit right. Threat/time sit above this region; committed collection summary sits below.
- Payload cells show a primary letter, compact subtype icon, and colored border. Blueprint Fragments retain their distinct identity.
- Active cells have a clear outline; locked cells are quieter; Ghost uses outlines without duplicate payload labels. Active cells win overlaps.
- Movement and rotation display authoritative cell positions immediately; letters remain upright.
- Hard Drop trail: 80-120 ms. Line-clear highlight: 120-180 ms. Effects do not block input or add simulation delays.
- Only successful collection commits update receipts and collected totals. Reduced motion uses static cues.
- User-requested harvest breakdown (2026-10-01): show all nine subtypes with their canonical icon and English name, including zero-count entries. Within each subtype, show collected letters and its total collected letter-tile count for the current Attempt. Group repeated letters as A x2 while counting both tiles. The same letter in different subtypes remains separate. Update from acknowledged collections only; failed/pending commits and repeated acknowledgments add nothing. Restart resets this Attempt summary. Keep long letter lists accessible through local scrolling.
- The user moved this breakdown below Tetris on 2026-10-01. Place the well and harvest table in the right column. The later explicit no-scroll request supersedes local vertical scrolling: shrink the well to the available height, always keeping Hold/Next cells equal to the active cells. The fixed-camera frame and Tetris panel share one layout row so their bottom borders align. Their word/harvest panels share the row below. Changed counts receive a short restrained emphasis; reduced motion uses static updates. Non-letter payloads are not counted as subtype letter tiles.
- Below Combat, show two adjacent equipped-word tables: the player's words on the left and the enemy's words on the right. Each supported equipped word occupies one row with its actual letter tiles and subtype icons. Show actual tile multipliers, using a range when crossing tiles differ. Unsupported incidental sequences do not count as equipped words. An empty fleet displays No equipped words; never invent enemy words.
- Build includes the same Equipped Words projection from the committed Ship Grid, with word count and distinct participating-tile count. Placement/removal/Undo update it; hovering a placement preview does not. These are read-only tables and do not alter combat strength.
- Build layout refinement: Cargo spans both rows down to the usable viewport bottom. Equipped Tiles sits below Ship Grid and lists all nine subtype icons/names, equipped letters (duplicates grouped), and counts. Only committed tiles on the Ship Grid count; unplaced Cargo and hover previews do not. Equipped Words sits at the bottom-right below the equipment inspector.
- Hull/Shield/enemy HUD labels, numbers, bars and status space occupy matching rows, including when Shield status changes. Remove the redundant Combat module-tile strip and its selected-module detail row; this does not remove or change equipped modules or their cooldown rules.
- Locked cells in the top four visible rows activate a steady "Stack high" warning; this is distinct from top-out.
- Pause, hidden-tab, undersized-viewport, explicit Resume/countdown, and durability-barrier rules remain unchanged.

## Accepted Control Contract
| Action | Rule |
| --- | --- |
| Gravity | One cell every 800 ms; constant within an Attempt; independent of Threat/difficulty. |
| Soft Drop | Held Down: one cell every 50 ms; ordinary Lock Delay still applies on contact. |
| Hard Drop | Move to the Ghost position and lock immediately; once per physical press. |
| Horizontal input | Immediate cell move, 150 ms initial repeat delay, then 50 ms per cell. Latest pressed direction wins while both are held. |
| Rotation | 90-degree CW/CCW, fixed bounded offset candidates, once per press; payload rotates with its cell, including O. |
| Lock Delay | 500 ms while grounded; at most 15 resets from successful grounded moves/rotations; blocked actions do not reset. |
| Leaving contact | Pause remaining Lock Delay while airborne; retain reset count. An eligible grounded action can reset before leaving contact. |
| Hold | One success before each lock. Empty slot consumes Next; occupied slot swaps without consuming Next. No reward reroll or Threat increase. |
| Incoming piece | Canonical spawn/orientation; fresh gravity and lock timers, including retrieval from Hold. Preserve piece/payload identity. |
| Held input on piece change | Restart horizontal 150 ms delay; held Down first steps after 50 ms. Do not carry discrete rotation/Hold/Hard Drop activations to the incoming piece. |
| Shape sequence | Seeded shuffled groups containing each of seven shapes exactly once; isolated Piece and Payload RNG streams. |
| Clear | Clear all full rows together; move whole rows down by the number of removed rows below them. No independent-cell gravity or automatic cascades. |
| Top-out | Incoming piece cannot spawn, or locked cells remain in hidden rows after clearing/collapse. Hold uses the same spawn validity check. |

Timing values are experiment starting points. All gameplay timers use Simulation Clock and stop at existing pause/barrier boundaries.
At the 15-reset limit, a valid move/rotation may still change position but cannot replenish Lock Delay. Airborne pieces do not lock; exhausted time locks on grounded evaluation.
The Ghost is the greatest collision-free downward displacement of the current piece without changing its orientation.

## Accepted Terminal And Collection Contract
- Complete eligible events of the terminal simulation tick; retain payloads cleared in that tick.
- Failure takes precedence over simultaneous victory.
- Primary failure precedence: Hull destroyed, then top-out, then timeout. Retain concurrent causes for diagnostics.
- Preserve Q297: due hits from both sides precede terminal evaluation; no repair or regeneration after termination and no revival from zero Hull.
- Collection and terminal outcome from that tick commit atomically. Publish saved receipts/results only after success; retries do not repeat simulation or grant again.
- No inputs or rewards occur after the terminal tick.
- Pre-Run uses its existing finite quota, viable starter, and recovery contract. No enemy combat or victory reward is invented for Pre-Run.

## Accepted Coordinate And Spawn Table
These concrete values complete Q311/Q314 and were accepted with Shared Understanding confirmation. They describe a project-specific rotation scheme, not compatibility with another game's rotation standard.
Coordinates: x increases right, y increases down. Board columns are 0..9; visible rows 0..19; hidden rows -4..-1. Cells outside those bounds or overlapping locked cells are invalid.
Each listed canonical cell has a stable identity; a payload is attached to that identity, not its array index after sorting. Rotation changes position only.
The origin is added to local coordinates. Incoming pieces start with their highest occupied cells in visible row 0. Odd-width shapes use the left of the two possible center alignments.

| Shape ID | Canonical local cells | Pivot | Spawn origin |
| --- | --- | --- | --- |
| I | (0,1), (1,1), (2,1), (3,1) | (1.5,1.5) | (3,-1) |
| O | (0,0), (1,0), (0,1), (1,1) | (0.5,0.5) | (4,0) |
| T | (1,0), (0,1), (1,1), (2,1) | (1,1) | (3,0) |
| J | (0,0), (0,1), (1,1), (2,1) | (1,1) | (3,0) |
| L | (2,0), (0,1), (1,1), (2,1) | (1,1) | (3,0) |
| S | (1,0), (2,0), (0,1), (1,1) | (1,1) | (3,0) |
| Z | (0,0), (1,0), (1,1), (2,1) | (1,1) | (3,0) |

Clockwise: x' = px - (y - py), y' = py + (x - px). Counterclockwise is the inverse. Rotate all cell identities, then test translated results in the exact order below.
Offsets are relative to the unshifted rotated result, not cumulatively applied. Negative dy moves up. All CW/CCW transitions use the same candidate order for their shape group.

| Shape group | Ordered (dx,dy) candidates |
| --- | --- |
| J, L, S, T, Z | (0,0), (-1,0), (1,0), (0,-1), (-1,-1), (1,-1), (0,-2) |
| I | (0,0), (-1,0), (1,0), (-2,0), (2,0), (0,-1), (-1,-1), (1,-1), (0,-2) |
| O | (0,0) |

No candidate may overlap occupied cells or leave board bounds. If all fail, preserve the entire piece and timers. O changes payload position even though its occupied-cell set remains unchanged.
Only full visible rows are eligible to clear. Collapse may move hidden cells into visible rows before the remaining-hidden-cell top-out check.

## Accepted Input And Tick Details
- Soft Drop replaces automatic gravity while held; do not add both downward steps. Measure descent age from activation or the last scheduled descent attempt; attempt a step when this age reaches the current mode's 50/800 ms interval, then reset that age. Changing drop mode does not reset descent age, so toggling Down cannot postpone gravity indefinitely. Horizontal movement/rotation does not restart gravity.
- Releasing the winning horizontal direction while the opposite remains held starts that remaining direction's 150 ms repeat delay without an extra immediate step.
- Piece changes reset repeat schedules without synthesizing a fresh key press. Fresh presses on later ticks retain normal immediate horizontal response.
- Commands identify the active piece they target. After a lock or Hold changes the active piece, discard remaining discrete commands targeting the prior piece.
- Within a fixed tick: apply ordered eligible inputs and board timing; resolve any lock, Threat increment, visible-row clear/collapse, and top-out/spawn check; compute due Combat events; evaluate the combined terminal result; repair/regenerate only if still active.
- Collect all durable outcomes of that tick into one commit request. Stop before the next tick until acknowledgment. A failed write preserves that pending operation for Retry.
- A newly activated piece receives no additional timed descent during its activation tick. An ordinary successful barrier resumes the existing timers without a countdown.
- Exact fixed-step accounting must avoid charging Lock Delay for time before first ground contact. The experiment can use the existing 60 Hz host (800/150/50/500 ms = 48/9/3/30 ticks).

## Approved Playable Experiment Scope
Question: can the player place and collect payloads comfortably while reading the accepted fixed-camera Combat presentation?
Extend the existing isolated study with a playable board, Hold/Next/Ghost, approved keyboard controls, collection feedback, and shared pause/terminal flow.
Keep the current bright sci-fi equipment direction. Use explicit seeded fixture payloads and a simulated commit success/failure adapter; do not claim production vocabulary distribution, economy, persistence, or progression.
Include a board-focused scenario and a combined board/Combat scenario with enough survival time to assess repeated placement. Preserve accepted weapon timing; label fixture-only enemy/durability settings.
Do not add production scaffolding, saved progression, final balancing, new dependencies, commits, or pushes as part of this experiment.
Focused evidence must cover payload identity through four rotations/Hold, wall/floor collisions, reset cap/contact loss, held-input transitions, multi-row clear/collapse, top-out rescue/failure, same-tick collection and terminal priority, commit failure/retry without duplication, and pause freeze.
Visually check 1280 x 720 and a larger viewport, letter/icon legibility, effects behind the active piece, and shared layout fit. Existing passing renderer evidence does not prove these new behaviors.
Build the approved experiment for user review. Production still requires the refreshed implementation specification and approved final tickets.
