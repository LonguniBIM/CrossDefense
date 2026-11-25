# First Durable Playable Slice: Implementation Specification

> Latest user authority - 2026-11-25 (Asia/Ho_Chi_Minh): The user explicitly accepted Ticket10 and authorized staging, committing, pushing and merging the completed product work. Ticket10 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted, development-only; see [the acceptance record](TICKET10_ACCEPTANCE_20261125.md), [verification record](TICKET10_DEVELOPMENT_VERIFICATION.md) and [completed plan](../plans/completed/ticket10-review-occurrence.md). Q15 remains approved: the SHIP noun water-vessel Review fixture, 1 completion Credit + 1 independent-first-response bonus, event-triggered immediate-due occurrence policy, and immutable development-review-ship-v1 with old Run pins preserved. Ticket09 remains Implemented / Integrated verification PASS / User acceptance Accepted. Ticket11 is the next-session implementation target and has not started in this session; Ticket12 remains ON HOLD. No Ticket02/03 final acceptance is inferred. Earlier Pending, hold and no-Git notices are historical where superseded. Deployment, publication beyond the authorized Git actions, provider reviewers, credential setup, suspended orchestration and WFP/G-R/G-P operations remain unauthorized. The refused snapshot operation remains prohibited.

> Historical authority - 2026-10-11: Ticket08 is Approved / User accepted. Ticket09 outcome settlement and staged Salvage is authorized development-only with ChatGPT-only tri-axis review and isolated Chromium smoke. Existing Q13 rewards and Q14 content pins remain authoritative; no new content selection is required. Tickets10-12 remain ON HOLD. No stage, commit, push, deploy, provider/orchestration or WFP/G-R/G-P work is authorized. See docs/plans/active/ticket09-outcomes-salvage.md.

> Ticket08 engineering closeout: Q14 is Implemented / Locally verified / ChatGPT tri-axis PASS after the fault-footer correction and final full executable gate. See docs/product/TICKET08_DEVELOPMENT_VERIFICATION.md. User acceptance Pending; Tickets09-12 ON HOLD. Earlier Pending notes below are historical. No stage, commit, push or deployment is authorized.

> Q14 approved by the user on 2026-10-10: implement development-rendered-combat-ship-v1 with the exact audited 14 assets, schema 4 and unchanged development-combat-ruleset-v1. Old Runs retain their original pins and HUD/capability. Ticket08 authoring/implementation is now authorized; tri-axis and final executable verification remain Pending. Tickets09-12 ON HOLD; no stage, commit, push, deployment or provider/orchestration work. This latest notice supersedes the historical Q14 Pending wording below.

> Current frontier - 2026-10-10: Tickets 04-07 are Approved / User accepted. Ticket 08 is explicitly authorized development-only with ChatGPT-only tri-axis review and isolated Chromium smoke. Its selected asset audit is complete; Q14 packaging/old-Run behavior is proposed, not approved. No renderer runtime or new content pack has been implemented. Tickets 09-12 remain ON HOLD. See docs/product/TICKET08_RENDERER_READINESS.md and docs/plans/completed/ui-components-fixed-camera-renderer.md. Earlier evidence remains historical; official acceptance criteria are unchanged.

Status: APPROVED. Ticket 01 was explicitly authorized, implemented, and verified on 2026-10-01. Ticket 02 was explicitly authorized for development-only execution on 2026-10-04 and is Implemented / Locally verified; ChatGPT-only engineering review applies; the approved SHIP starter is authored, compiled and locally verified; final user acceptance remains Pending. Tickets 06-12 remain ON HOLD. Approved on 2026-10-01 at 02:48 Asia/Bangkok.
Current Ticket 04/05 boundary: Ticket 04 is Approved / User accepted. Ticket 05 is authorized development-only, implemented with focused local verification, and uses ChatGPT-only tri-axis review plus separate Chromium smoke. See TICKET05_EDITING_CONTRACT.md and TICKET05_DEVELOPMENT_VERIFICATION.md. Ticket 05 final user acceptance remains Pending; Tickets 06-12 remain ON HOLD.
Current Ticket 03 boundary: Q3-A/Q4 are explicitly approved; development-only implementation is locally verified. ChatGPT-only review applies; final user acceptance remains Pending. The current evidence record is TICKET03_DEVELOPMENT_VERIFICATION.md. No later ticket is opened automatically.
The user accepted the visual design, then explicitly approved this specification, T1-T4 and all 12 tickets. Content/asset fixture gates remain as specified.

## Problem Statement
The accepted Build, Combat, and Falling Blocks experience currently runs as an isolated in-memory study. Players cannot yet rely on it to retain Pilot progression, collected Letter Tiles, or completed outcomes across reloads. The production source tree is a boundary scaffold, not an implemented game.

## Solution
Deliver one durable, offline-capable playable slice using a small explicitly labeled development Content Pack: create/continue a Pilot, complete Pre-Run Salvage, build a ship, play one Map including its authored encounter/boss sequence, resolve results and Salvage, optionally practice a Learning Entry, and return to Build. Reload must preserve committed progress and recover interrupted play safely.

This is the first delivery milestone, not a reduction of the full MVP. Three Maps, three hulls, the full vocabulary library, permanent upgrade catalog, complete backup/recovery screens, and the other accepted MVP capabilities remain required later.

## Authority And Precedence
- [MVP product contract](MVP_SPEC.md), [domain glossary](../../CONTEXT.md), [UX state matrix](UX_UI_STATE_MATRIX.md), and [UX decisions](UX_UI_DESIGN.md).
- [Falling Blocks contract](FALLING_BLOCKS_DESIGN.md), including exact coordinates, ordered rotation offsets, and tick boundaries; [Combat timing](COMBAT_TIMING.md).
- [Platform architecture](../architecture/PLATFORM_ARCHITECTURE.md), [technical architecture](../architecture/TECHNICAL_ARCHITECTURE.md), accepted ADRs 0001-0011, and [testing strategy](../architecture/TESTING_STRATEGY.md).
- Latest explicit layout feedback supersedes older presentation details: no vertical scrolling for the Falling Blocks/harvest surface, equal active/Hold/Next cells, shared camera/well bottom border, bottom Build summaries, and removal of the redundant Combat module strip/detail row.
- Existing behavioral rules remain authoritative. Fixture magnitudes, encounter duration, starter quota, words, and hull geometry do not silently become final balance/content.

## User Stories
1. As a **player**, I want **to create and explicitly continue a local Pilot**, so that **my progression remains separate from other learners**.
2. As a **player**, I want **a clear loading or recovery state before play**, so that **unavailable saves never look like a new empty game**.
3. As a **player**, I want **only one tab to own writable gameplay**, so that **two tabs cannot duplicate or overwrite progress**.
4. As a **player**, I want **enemy-free Pre-Run Salvage with a finite quota and viable starter objective**, so that **I can build a usable first ship without farming through reloads**.
5. As a **player**, I want **placement through pointer, click, or keyboard with a factual preview**, so that **I understand the change before committing it**.
6. As a **player**, I want **words, Power, equipped tiles, and equipped words derived from my saved layout**, so that **the ship summaries describe my actual build**.
7. As a **player**, I want **Return, Undo, and Redo for layout changes**, so that **I can experiment without changing ownership or bypassing validation**.
8. As a **player**, I want **clear launch blockers and the accepted no-offense advisory**, so that **I know why a Map can or cannot start**.
9. As a **player**, I want **responsive Falling Blocks controls and equal-sized Hold/Next previews**, so that **payload letters and subtype identities remain recognizable**.
10. As a **player**, I want **all nine subtype harvest entries to update only after a saved collection**, so that **the receipt is trustworthy**.
11. As a **player**, I want **my equipped ship to fight automatically with distinct subtype timing**, so that **word-building decisions have understandable combat effects**.
12. As a **player**, I want **pause and safe explicit resume to stop both games together**, so that **focus loss or resizing cannot cost unobserved progress**.
13. As a **player**, I want **Retry after a save failure to finish the same operation once**, so that **I neither lose nor duplicate earned rewards**.
14. As a **player**, I want **factual victory/failure results and atomic final-tick collection**, so that **a terminal frame does not discard earned payloads**.
15. As a **player**, I want **interrupted play to return to Build with committed loot**, so that **reload does not fabricate an exact resumed battle or another reward**.
16. As a **player**, I want **a staged Salvage decision with a capacity and build-impact summary**, so that **keeping and discarding tiles is deliberate**.
17. As a **learner**, I want **optional Review with persistent first-response and hint evidence**, so that **recall practice stays distinct from combat success**.
18. As a **player**, I want **the slice to work offline after successful initial caching**, so that **network loss does not block core play**.
19. As a **player**, I want **readable icons, names, focus, and reduced-motion feedback**, so that **color and effects are not the only way to understand state**.
20. As a **developer**, I want **the same scenario to run headlessly and in the browser**, so that **simulation and saved outcomes can be verified independently of frame rate**.

## Implementation Decisions

### Accepted Foundation
Use strict TypeScript + Vite, Dexie/IndexedDB, Zod at external data boundaries, Vitest, Playwright, Web Locks with diagnostic metadata, and Workbox/vite-plugin-pwa. These choices are already accepted; dependency versions must come from inspected compatible lockfiles rather than unverified latest-version assumptions.

Keep Presentation -> Application -> Domain dependency direction. Infrastructure implements ports. No UI, browser, renderer, storage, or audio imports in Domain. Do not copy the entire prototype host into production or import production rules from the prototype.

### State And Use-Case Boundaries
- Workspace/Pilot owns local identity, scoped settings, schema version, and independent progression.
- Run/Lifecycle owns Pre-Run, Build, Attempt, committed results, Salvage, replay/retry, and pinned Ruleset/Content versions.
- Ship Build/Words owns canonical tile identity/position, contiguous supported words, crossing multipliers, Power, and validated layout history.
- Falling Blocks/Combat owns deterministic ordered inputs, isolated RNG streams, fixed-step timing, Threat, and terminal events.
- Economy/Progression and Learning/Review own their distinct rewards and evidence.
- Content supplies immutable validated definitions. Presentation consumes read-only projections and sends intents through a serialized Application gate.

One durable business outcome is one Unit of Work. Preserve a stable OperationId across Retry. Publish receipts, summaries, and success only after acknowledgment. A failed write preserves the pending operation and stops simulation; retry must not rerun its tick.

Persist canonical inputs and version references, not authoritative derived DPS/word summaries. Keep transient board, renderer objects, active input, and frame accumulator out of exact-resume saves. Recover a running Attempt envelope as interrupted, retain committed loot, and return to Build.

### Accepted Visual Baseline
- Bright, crisp sci-fi; nine subtype icons accompanied by names where space permits; letter identity remains primary.
- Build: Cargo reaches the usable bottom; Ship Grid center; inspector right; Equipped Tiles below Ship Grid; Equipped Words bottom-right. Equipped summaries exclude unplaced Cargo and uncommitted preview candidates.
- Attempt: Combat left; 10 x 20 visible well right with four hidden spawn rows, Hold left, exactly three Next previews right. Active/Hold/Next cell, letter, and icon sizes match.
- Camera and well-panel bottom borders align. Hull/Shield/enemy numbers align with numbers, bars with bars, including Shield status changes.
- Your/enemy equipped words sit below Combat, one supported occurrence per row. Harvest sits below the well, includes zero-count subtypes, and groups repeated letters without reducing tile counts.
- Shrink the well to fit the accepted minimum 1280 x 720 CSS viewport without vertical page or Falling Blocks/harvest scrolling. This supersedes the previous 22-pixel cell floor. Bounded Build-region scrolling remains allowed.
- No redundant Combat tile strip or selected-detail row. The Build Inspector retains subtype timing information; compact ship/HUD feedback must reflect actual state without restoring the removed panel.
- Below minimum viewport: prevent launch or pause play; preserve recovery/settings access. Never force browser zoom.
- Preserve all accepted input timings, rotation tables, pause/countdown behavior, reduced motion, and gameplay/text-entry separation.

### Simulation And Terminal Contract
Use the detailed Falling Blocks tick order, not animation callbacks. Resolve due hits from both sides before terminal evaluation, then surviving repair/regeneration only while active. Failure wins simultaneous victory; failure priority is Hull destruction, top-out, timeout. Retain diagnostic concurrent causes. Include eligible payloads from the terminal tick in the same atomic outcome.

Each Weapon/Support Tile owns its timer; Shield owns a shared recharge delay/pool. Bonuses scale magnitudes, never cooldown length. Projectile impact deadlines and target-loss behavior belong to simulation. Visual interpolation/randomness never changes results or consumes gameplay RNG.

### Content And Save Compatibility
The first slice may use an explicitly identified development pack and the already approved experimental timing values. Before the affected ticket starts, review its complete fixture manifest: starter quota/viability, payload distribution, Ruleset numeric precision and mitigation constants, encounter/Threat/boss schedule, rewards, review entries, and asset/audio provenance. Do not invent missing gameplay policy as an implementation default.

Validate content before activation; preserve Last Known Good and content referenced by active Runs. Separate replaceable caches from authoritative Player Data. Migrations are explicit and staged; failure preserves original data. No prototype-save migration is needed because the interaction study has no durable player save.

### Accepted Technology Decisions (T1-T4)
T1. Use typed semantic DOM components for the first slice; defer an overall UI framework until concrete complexity justifies one. This extends the accepted DOM-first Build choice without selecting a framework for the entire future MVP.
T2. Select Three.js as the first-slice Combat renderer behind a read-only projection/event interface, with explicit resize, pause, context-loss, and disposal handling. Existing renderer evidence supports this proposal; acceptance of the picture alone is not dependency approval.
T3. Use Application-owned projections and local transient view state without a separate state-management library. Browser-native audio stays behind an observer interface; failure/mute cannot affect gameplay.
T4. Compile a small versioned development Content Pack using deterministic validation/build tooling; defer a visual content editor. Keep the currently reviewed assets with their provenance for internal slice evaluation, without declaring the entire asset folder release-ready.

T1-T4 were explicitly approved on 2026-10-01; see [ADR 0012](../adr/0012-first-durable-slice-presentation-and-content.md). Ticket 01 has since been authorized and verified; Ticket 02 is Implemented / Locally verified under the 2026-10-04 development-only authorization, with ChatGPT-only engineering review; the approved SHIP starter is authored, compiled and locally verified; final user acceptance remains Pending; Tickets 06-12 remain on hold. No remote service, cloud identity, physics engine, or new gameplay mechanic is introduced.

## Testing Decisions
Primary seam: public Application/Domain scenarios with an in-memory port adapter. This tests player outcomes, boundary invariants, and deterministic behavior without coupling to view internals.
Browser seam: the real production app with Dexie, Web Locks, keyboard/visibility handling, renderer lifecycle, and production service-worker build. A fake save adapter does not prove durability.

| Behavior | Required observable proof |
| --- | --- |
| Pilot and ownership | Create/continue survives reload; second tab cannot write; failed bootstrap never replaces data. |
| Build | Pointer/click/keyboard reach the same committed layout; invalid placement preserves tiles; preview leaves saved state/summaries unchanged; Return/Undo/Redo obey history rules. |
| Falling Blocks | Payload identity through Hold/rotation, lock-reset cap/contact loss, held-input boundaries, simultaneous clear/collapse and top-out rescue/failure. |
| Combat | Per-tile cadence, passive subtypes, damage order, target loss, shared Shield delay, no banking, damage-before-terminal-before-repair. |
| Determinism | Same versions, snapshots, seed and ordered inputs produce the same terminal digest across varied frame schedules and headless/browser hosts. |
| Durable collection | Pending/failure adds no receipt; Retry and duplicate acknowledgment grant once; terminal-tick payload and result commit together. |
| Recovery | Reload during play returns to Build with committed loot; failed commit/migration preserves last durable state. |
| Salvage/Review | Cancel changes nothing; atomic capacity-valid resolution; same Review Occurrence resumes and grants a first-correct reward at most once. |
| Offline | A production build reloads and completes the slice without network after successful installation/cache preparation. |
| Layout | At 1280 x 720, 1366 x 768, 1920 x 1080 and larger reference sizes: no Attempt vertical scroll, equal preview cells, aligned camera/HUD, accessible summaries and focus. |

Prior art: technology-selection PoCs demonstrate the selected infrastructure contracts; the fixed-camera interaction study demonstrates control/layout behavior. Latest prototype evidence is five layout groups and five harvest groups; broader earlier checks are historical, not a current production pass. Reuse scenarios and fixture intent, not test-only prototype APIs as production acceptance seams.

Each ticket must finish with its own typecheck and relevant behavior/browser proof. Run the integrated slice and production offline proof before accepting the milestone. No production tests have run for this specification.

## Out of Scope
- Public release/deployment, commits/pushes, tracker publication, or production coding in this documentation handoff.
- Full MVP content scale-up, final balance, final asset acceptance, and broad performance guarantees.
- Cloud accounts/sync, multiplayer, microphone grading, live-AI dictionary validation, or exact mid-Combat resume.
- Framework migration, global event bus, generic command framework, speculative prefactoring, or Worker migration without evidence.

## Further Notes
Visual acceptance recorded on 2026-10-01 (Asia/Bangkok) follows the no-scroll revision. It closes review of the current design, not formal accessibility conformance, target-hardware certification, final balance, or all production assets.
See the [approved ticket breakdown](IMPLEMENTATION_BREAKDOWN.md). The specification/ticket approval gate is satisfied; the explicit user hold now prevents execution. Wait for a later instruction to begin.
The full MVP remains governed by the linked product/state contracts; later tickets must cover its remaining capabilities rather than treating this slice as the complete game.

Current development-only remediation evidence and review disposition are recorded in [Ticket 02 ChatGPT tri-axis review](TICKET02_CHATGPT_TRI_AXIS_REVIEW.md). Official acceptance criteria remain unchanged; no real starter content was invented.

Approved SHIP content authoring and actual runtime/browser verification are now recorded in [SHIP pack verification](TICKET02_SHIP_PACK_VERIFICATION.md). Q1/Q2 content decisions are resolved; Ticket 03 remains ON HOLD.

Ticket 04 continuation (2026-10-06): the user approved Q5-Q8 and development-only implementation. The Build pack, hull/spellings, exact numeric policy and old-Run compatibility contract are recorded in docs/product/DEVELOPMENT_BUILD_SHIP_V1.md. Ticket 04 is implemented and locally verified through focused behavior checks. The final ChatGPT tri-axis and combined verification disposition is recorded in docs/product/TICKET04_DEVELOPMENT_VERIFICATION.md; final user acceptance remains Pending. Tickets 06-12 remain ON HOLD. Prior tickets and Ticket 04 final user acceptance are not inferred.
