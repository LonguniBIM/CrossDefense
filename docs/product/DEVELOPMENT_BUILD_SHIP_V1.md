# Approved Development Build: SHIP v1

Authority: the user's explicit Q5-Q8 approval on 2026-10-06 authorizes Ticket 04 development-only implementation and ChatGPT-only Code/Spec, Architecture and Security review. Tickets 05-12 remain ON HOLD. Prior tickets' final user acceptance is not inferred.

## Content and compatibility

New Content version: `development-build-ship-v1`; new Ruleset: `development-build-ruleset-v1`. The new version retains SHIP, quota 8, S/Ballistic x2, H/Armor x2, I/Power x2 and P/Armor x2, with an explicitly empty asset list. The existing `development-starter-ship-v1` source and compiled bytes must not change. The Build pack uses content schema 2; schema 1 remains readable.

Q5 hull: `development-diamond-13`, a 5-column by 5-row development hull. Allowed cells are C1; B2/C2/D2; A3/B3/C3/D3/E3; B4/C4/D4; C5. Coordinates in JSON are zero-based x/y. No Hull HP, purchase, expansion or switching is introduced.

Q6 spellings: SHIP, SHIPS, HIP, HIPS, SIP, SIPS, all CEFR Unknown. These are complete contiguous horizontal or vertical sequences. SHIPS does not also count SHIP as a substring. Unsupported sequences retain intrinsic effects and use neutral Not supported feedback. No Learning Entry, definitions, audio or mastery claim is created.

Q7 numeric policy belongs to the new Ruleset: Technology Level 1, exact integer hundredths for Word multipliers and Power. Use the accepted length multipliers 120/135/155/180/210/240 hundredths, Unknown add-on zero, crossing max(horizontal, vertical)+15 capped at 260. An unbonused tile has multiplier 100. Power generates 3 times its multiplier; consumers retain the accepted unscaled demand. UI displays at most two decimals without trailing zeroes. Damage/Combat precision and mitigation K are outside Ticket 04.

Q8 new Runs use the new pack; old Runs retain their original content and Ruleset pins, collected tiles and quota. A legacy Run without Build definitions remains readable and receives a factual Build-content-unavailable surface. It cannot borrow hull/spellings from the current default. No content-pin migration is authorized.

## Placement contract

Cargo left, Ship Grid center, Inspector right; Equipped Tiles beneath the grid and Equipped Words bottom-right. Pointer drag/drop, click-select/place and keyboard placement emit the same Application intent. Occupied/out-of-hull targets reject without swaps or lost tiles. Moving an already placed tile to an empty valid cell remains placement; Return/Undo/Redo are Ticket 05.

Preview is transient and read-only: display affected words and before/after Power separately from committed summaries. Commit only validated canonical tile positions and hull identity, with a stable operation ID, revision check and atomic receipt. Save failures preserve the prior build and the exact pending operation for Retry. Reload reconstructs summaries from saved layout plus pinned content/Ruleset, not stored DPS/word/Power summaries.

Only retained, committed Pre-Run tiles can be placed. Placement does not change Cargo capacity usage, which counts both placed and unplaced tiles. No free starter grants, placement rewards, hints, Start Map, combat or permanent technology upgrades are added.

## Verification boundary

Public content compilation, Domain projection and Application placement/reload/retry seams; real Chromium/IndexedDB, equivalent pointer/click/keyboard routes, legacy content preservation, atomic failure/retry and minimum 1280x720 layout. Use isolated test browser contexts, not personal saves. Preserve the original review fixed point `fd945fae4916b8500245e74d75d65e331fb6ba43`, account for untracked files and freeze each review payload.
