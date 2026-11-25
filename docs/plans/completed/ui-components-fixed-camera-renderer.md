# Execution Plan: UI Components And Fixed-Camera Renderer

> Ticket08 engineering closeout: Q14 is Implemented / Locally verified / ChatGPT tri-axis PASS after the fault-footer correction and final full executable gate. See docs/product/TICKET08_DEVELOPMENT_VERIFICATION.md. User acceptance Pending; Tickets09-12 ON HOLD. Earlier Pending notes below are historical. No stage, commit, push or deployment is authorized.

> Q14 approved by the user on 2026-10-10: implement development-rendered-combat-ship-v1 with the exact audited 14 assets, schema 4 and unchanged development-combat-ruleset-v1. Old Runs retain their original pins and HUD/capability. Ticket08 authoring/implementation is now authorized; tri-axis and final executable verification remain Pending. Tickets09-12 ON HOLD; no stage, commit, push, deployment or provider/orchestration work. This latest notice supersedes the historical Q14 Pending wording below.

> Current continuation - 2026-10-10: Ticket 07 is User accepted. Ticket 08 is authorized development-only; Q14 packaging/old-Run behavior is Pending after a successful selected-asset audit. This existing plan owns the renderer continuation. Tickets 09-12 remain ON HOLD. Historical prototype and earlier-ticket notes below do not override this frontier.

## Authority And Question
Active, 2026-09-30. User approved Q284-Q285 as recommended and Q286 as fixed-camera 2.5D with a renderer experiment. The prior Q228-Q283 behavioral baseline remains accepted; Q286 supersedes only the flat-2D Combat presentation portion of Q228/Q280.
Question: can a fixed-camera Three.js 2.5D Combat presentation coexist with a readable DOM HUD/falling-block board at 1280 x 720, with bounded rendering cost and safe pause/context-loss behavior?
Repository: D:\01_DCMvn\Workspace\CrossDefense; last verified HEAD 2e5a73e7b2b005733564f252e2eb7f055f87ed9e. Existing uncommitted design work is preserved.

## Scope
- Record approved component finish, nine subtype icons with labels, and 2.5D direction.
- Isolate executable experiment in prototypes/fixed-camera-renderer; use in-memory, read-only sample projections and generated geometry; the user-authorized asset follow-up adds selected local CC0 hulls and textures. No production scaffolding, persistence, physics engine, camera controls, or gameplay changes.
- Compare Three.js with a Canvas 2D reference using the same projection; this is a renderer experiment, not three competing page layouts.
- Inspect minimum/reference viewport, pause/resume, small viewport, context loss, resource size, frame intervals, and submission cost. Record machine/browser/GPU context and limits; do not claim a target-laptop benchmark from software rendering.

## Progress
- [x] Reconnected Desktop Commander and inspected authority/current files.
- [x] User choices Q284-Q286 recorded for implementation of this prototype.
- [x] Built isolated prototype with Three.js 0.186.0 and Lucide 1.49.0; dependency lockfile retained.
- [x] Syntax and browser smoke checks passed; minimum/reference layout, nine icons, fixed camera, pause/countdown, context loss/restoration, and blur-handler path checked. Visually inspected the 2.5D screenshot.
- [x] Recorded [experiment results](../../../prototypes/fixed-camera-renderer/RESULTS.md) and [run instructions](../../../prototypes/fixed-camera-renderer/README.md). Intel UHD median frame interval 16.7 ms; Three.js submission p95 0.9/1.5/3.7 ms at 2/8/24 ships. Initial overflow/favicon failures were corrected before the final passing run.
- [x] Reviewed the user's Space Arena recording and recorded approved Q287-Q289: shared module layout, equipment preview/commit feedback, and factual subtype effects.
- [x] Recorded approved Q290-Q293 in the product specification, UX contract, glossary, and [Combat timing detail](../../product/COMBAT_TIMING.md): subtype cadence, ownership, clock, scaling, and UI. Numerical intervals are experiment starting points.
- [x] Recorded Q294-Q298 approval: initial readiness, fixed impact delays/target loss, exact recharge boundary, damage-before-repair terminal ordering, and experimental magnitudes. Cooldown design frontier closed.
- [x] Built the isolated [Build/Combat interaction study](../../../prototypes/fixed-camera-renderer/review/README.md) with the same equipped layout and approved Q287-Q298 feedback/timing. Fourteen model checks and ten browser check groups passed; screenshots inspected. Corrected minimum-viewport overflow and stale reset preview. See [results](../../../prototypes/fixed-camera-renderer/review/RESULTS.md).
- [x] Reviewed the user-supplied asset packs and integrated two Quaternius hulls plus seven Kenney particle textures; copied licenses and recorded hashes. Fixed Combat viewport growth and camera fit. Fourteen model checks and eleven browser groups passed, with Combat tested from 1280 x 720 through 3440 x 1440; final screenshots inspected. See [asset review](../../../prototypes/fixed-camera-renderer/review/ASSET_REVIEW.md) and [updated results](../../../prototypes/fixed-camera-renderer/review/RESULTS.md).
- [x] User selected bright, crisp, readable sci-fi after reviewing the first asset pass. Implemented faction hull colors, distinct mounted modules, layered typed-hit effects, Shield waves/depletion, and an eight-second visual showcase. Existing layout and timing authority are preserved. Final results are recorded in the linked interaction-study evidence.
- [x] On 2026-10-01 local time, the user requested sharper tile equipment after accepting the overall improvement. Refined all nine subtype geometries/materials, plate details and letter textures; merged static parts and disposed instance geometry on reset. Twelve browser groups passed and final minimum/large screenshots were inspected. Gameplay and composition were preserved.
- [x] On 2026-10-01 (Asia/Bangkok), the user considered the refined equipment sufficient for now and requested the next design discussion. This is a stopping point for art iteration, not final production asset or renderer approval.
- [x] Recorded the user's approval of Q299-Q302: board sizing/Hold/three Next previews, compact payload identity, commit-confirmed collection feedback, and distributed Attempt HUD. Updated the UX authority and Next Queue specification; no prototype behavior changed.
- [x] Recorded Q303-Q308 approval on 2026-10-01: active/locked/ghost distinction, immediate cell feedback, short Hard Drop/lock/line-clear effects, Hold/Next feedback, and a steady high-stack warning for the top four visible rows. Documentation only; no prototype behavior changed.
- [x] Recorded Q309-Q315 approval on 2026-10-01: gravity/drop timing, key repeat, bounded rotation, Lock Delay, Hold eligibility, hidden spawn rows/top-out, and seven-shape shuffled groups. Updated the MVP pointer and domain glossary. No runtime changes.
- [x] Recorded Q316-Q319 approval on 2026-10-01: contact-loss Lock Delay, held input on incoming pieces, simultaneous row collapse, and final-tick collection/failure priority with atomic persistence. Preserved Q297 terminal-before-repair behavior.
- [x] Prepared [the consolidated Falling Blocks design](../../product/FALLING_BLOCKS_DESIGN.md), including proposed exact spawn/pivot/offset tables, input/tick completion details, and a bounded playable experiment. Coordinate sanity checks passed for seven shapes (visible spawn, four distinct integer cells, identity restored after four rotations); this is not gameplay validation.
- [x] On 2026-10-01, the user confirmed Shared Understanding for Falling Blocks, including the proposed completion tables/input details, and explicitly authorized the playable prototype.
- [x] Implemented the playable board, shared Attempt integration and DOM board/HUD. Thirty model checks and eighteen browser groups passed; minimum/large and save-retry screenshots were inspected. Corrected minimum-layout overflow and Pause/Retry recovery. See the interaction-study RESULTS.md for evidence and fixture limits.
- [x] Applied 2026-10-01 user feedback: Hold/Next cells, letters and subtype icons now match active-piece size. Removed the 44-pixel well-cell ceiling and widened the cluster responsively. Six viewport checks passed from 1280 x 720 through 3440 x 1876, with equal cell/icon measurements, no page overflow, and a compact lower margin. Minimum/large screenshots were inspected; evidence is recorded in the interaction-study results.
- [x] Added the user-requested subtype harvest summary on 2026-10-01: all nine icons/names, per-Attempt letter-tile counts, grouped duplicate letters, and restrained count feedback. Only acknowledged collections update it. Five focused browser groups passed, including real clear/failure/Retry, reset, duplicate letters/acknowledgment, reduced motion, and six viewport layouts. Minimum/large screenshots were inspected. Combat height makes room for the compact table while board/Hold/Next sizing remains equal.
- [x] Applied the next 2026-10-01 placement request: harvest below Tetris, paired player/enemy equipped-word tables below Combat, and an Equipped Words table in Build. All tables use committed/actual equipped data; unsupported enemy fixtures show an explicit empty state. Four word-table browser groups and five harvest regression groups passed, including six viewport layouts, Build preview/Return/Undo, populated enemy projection, clear/Retry, reset and duplicate letters. Short right columns scroll locally while preserving minimum/equal cell sizes; the reference layout shows the well and harvest together.
- [x] Applied the annotated six-point layout request and later no-scroll override: full-height Cargo, bottom-right Equipped Words, subtype Equipped Tiles below Ship Grid, aligned HUD numbers/bars, camera/Tetris shared bottom border, and removal of the redundant module strip. Falling Blocks now shrinks to fit with harvest without vertical scrolling, superseding the prior 22-pixel minimum. Five focused layout groups and five harvest regression groups passed, with four Build and six Combat viewport layouts; minimum/reference screenshots were inspected. See the interaction-study results and layout-six-results.json.
- [x] On 2026-10-01 (Asia/Bangkok), the user accepted the current design after the no-scroll revision and requested the next step. Current visual review is closed; this is not formal usability/accessibility certification.
- [x] Prepared the refreshed [first durable slice specification](../../product/IMPLEMENTATION_SPEC.md) and [proposed ticket breakdown](../../product/IMPLEMENTATION_BREAKDOWN.md), preserving the full MVP and explicit technology/content gates.
- [x] On 2026-10-01 at 02:48 Asia/Bangkok, the user approved the refreshed specification, T1-T4 and all 12 tickets, with an explicit instruction not to start them.
- [x] Ticket 01 completed and verified after explicit user authorization on 2026-10-01. Headless create/continue scenario passed; strict TypeScript and production build passed; four Playwright browser checks passed for IndexedDB reload, duplicate submission, second-tab ownership blocking/retry, and storage-bootstrap recovery without blank replacement. Tickets 02-12 remain NOT STARTED / ON HOLD.
- [x] Three.js is accepted for the first durable slice under T2; see ADR 0012.
- [ ] Final production asset/content acceptance remains open.

## Completion Boundary
The visual experiment has reached user acceptance. This same active plan now tracks its bounded handoff into the first durable playable slice; do not create a competing active plan. Three.js is accepted for the first durable slice. The refreshed specification and 12-ticket breakdown are approved; production coding is ON HOLD by explicit user instruction. Final balance, complete content/assets and broader hardware/accessibility evidence remain separate gates. Move this plan to completed only after the handoff is validated and the next authorized work is recorded.

## Ticket 02 remediation continuation - 2026-10-05

This existing plan remains the durable slice plan; no parallel orchestration plan was created. The user authorized bounded Ticket 02 remediation and ChatGPT-only Code/Spec, Architecture and Security review. Provider reviewers/orchestration and WFP/G-R/G-P remain suspended; Tickets 03-12 remain ON HOLD.

The migration, content compiler/resolution/admission, retry/receipt binding and recovery changes are implemented and locally verified. The latest combined local run passed 17 headless tests, 14 real-browser tests, strict typecheck and the production build. The authoritative final review record is [Ticket 02 ChatGPT tri-axis review](../../product/TICKET02_CHATGPT_TRI_AXIS_REVIEW.md). Authored starter content and final user acceptance remain Pending; historical earlier hold statements above describe their original checkpoints.

## Approved SHIP authoring continuation - 2026-10-05

Q1/Q2 are approved: SHIP, quota 8, S/Ballistic x2, H/Armor x2, I/Power x2, P/Armor x2, finite-pool collection rules and no selected assets/audio. Source and actual runtime artifact are authored and compiled with deterministic byte equality. Local verification passed 22 headless tests, 18 development-browser tests and 4 real-pack production-browser tests. See [SHIP verification](../../product/TICKET02_SHIP_PACK_VERIFICATION.md). Runtime/collector code and dependencies were not changed in this step. Collection implementation is still Ticket 03, which remains ON HOLD together with Tickets 04-12. Final Ticket 02 user acceptance is Pending.

## Ticket 03 development continuation

Authority: user instructed the next step and approved Q3-A/Q4. Keep the original fixed point fd945fae4916b8500245e74d75d65e331fb6ba43 plus a pre-Ticket-03 worktree fingerprint. Implement finite pool identities/order, transactional collection/quota and Finish, deterministic board controls, and a read-only DOM projection. Do not implement Ticket 04 placement or later gameplay.

- [x] Current repository and prior SHIP content inspected; 22 existing headless tests and typecheck passed.
- [ ] Domain pool/board and Application durability scenarios.
- [ ] Real IndexedDB migration/rollback/retry and browser keyboard/collection/reload proof.
- [ ] ChatGPT Code/Spec, Architecture and Security review, remediation as needed, final full pass and local verification.

Evidence is confined to .scratch/ticket03-development; no provider execution, blocked orchestration, credentials, network policy changes, staging, commits, pushes or deployment.

### Ticket 03 verification checkpoint

Finite pool and board/Application scenarios, real v2-to-v3 migration rollback, keyboard clear/save-failure/retry/reload/Finish and minimum-viewport checks are locally verified. The allowed regression suite passed 39 headless tests and 25 Chromium tests; seven production-build browser scenarios also passed. Source review found two bounded issues (pinned objective admission and viewport overflow), both fixed with executable evidence. Initial and impact-selected tri-axis reports are preserved under .scratch/ticket03-development. Final review disposition is recorded in docs/product/TICKET03_DEVELOPMENT_VERIFICATION.md; final user acceptance and Tickets 04-12 remain separate.

## Ticket 04 continuation - 2026-10-06

The user approved Q5-Q8: diamond-13 hull, six Unknown-CEFR spellings, exact hundredths for Level-1 Build word/Power policy, and a new immutable Build pack with legacy pins preserved. Ticket 04 alone is open development-only. The existing plan continues; no parallel plan is introduced. Content compilation, Domain/Application placement and browser persistence/UI integration are implemented; regression validation and the ChatGPT tri-axis gate are in progress. Tickets 05-12 remain ON HOLD.

Ticket04 close-out candidate: content, placement, persistence and UI are implemented. CS-01/ARCH-01 lifecycle, CS-02 minimum layout and CS-03 unsupported-word context have regression-backed fixes. Final review/verification is recorded in docs/product/TICKET04_DEVELOPMENT_VERIFICATION.md. Tickets05-12 and final user acceptance remain separate.

## Ticket 08 - Production renderer continuation (2026-10-10)

### Status and outcome

Authorized development-only; Q14 Pending before runtime authoring. Ticket07 accepted. Deliver the read-only fixed-camera Three.js renderer, truthful typed effects, mounted canonical equipment, paired equipped-word rows, acknowledgment-only nine-subtype harvest, equal preview cells and aligned no-scroll minimum layout. Preserve all Q10-Q13 gameplay and Player Data.

Original comparison point remains fd945fae4916b8500245e74d75d65e331fb6ba43. Baseline inventory has180 files; earlier work is protected. T2 already selects Three.js and T4 permits the reviewed internal assets, so neither approval is reopened. No second active renderer plan is created.

### Reviewed assets

The14 selected entries match byte length/SHA-256: two Quaternius models, Blue/Red faction textures, seven Kenney particles and three supplied licenses, total10,499,913 raw bytes. glTF has embedded resources and no required extensions. Supplied license files declare CC0. This does not approve the raw397-file asset folder or public release. Prototype lock pins three0.186.0/lucide1.49.0; root has no Three.js dependency yet. Detailed evidence: .scratch/ticket08-development/asset-audit.json and docs/product/TICKET08_RENDERER_READINESS.md.

### Q14 - Packaging and old-Run proposal, NOT approved

Recommend content development-rendered-combat-ship-v1, existing schema4, compatibleRuleset development-combat-ruleset-v1, exact inherited gameplay definitions and the14 audited assets with provenance. Use the current compiler/validation/cache/pinning path. New Runs use rendered content. Existing Ticket07 combat Runs keep their original pack and DOM HUD; earlier Build/diagnostic Runs keep their capability. No silent content mutation, renderer-only registry, free starter grants or personal-save conversion. The renderer demonstration consequently uses a fresh Pilot/Run.

The alternative of supplying application-level art to an existing empty-assets pack has a materially different old-Run/content lifecycle and is not chosen implicitly. Only this packaging/compatibility decision is requested; the model selection, T2 and art direction are already settled for internal evaluation. Actual compiled size/decode cost must be measured; any substantive asset substitution remains a separate decision.

### Implementation and review sequence after Q14

1. Author/compile/validate the new immutable pack with real asset bytes and provenance; test incomplete/tampered content, byte-identical rebuilds and exact old-artifact preservation.
2. Introduce a narrow readonly projection/event adapter. Add only required observational tick/module/weapon/loss metadata and capture every event across multiple ticks in one frame; compare authoritative simulation outcomes with/without the renderer.
3. Adapt selected visual geometry into production presentation, not the prototype simulator/host. Preserve letter-first equipment, distinct truthful effects, empty enemy-word state where appropriate and accepted layout.
4. Test loading/error/Retry, actual context loss/restore, explicit Resume, resize, teardown and ownership/disposal of models/textures/materials/geometries/listeners. Both clocks and committed loot remain protected.
5. Freeze full Ticket08 payload; all initial Code/Spec (Standards and Spec separate), Architecture and Security axes before remediation; focused fixes and risk-based re-review; then fresh final full tri-axis.
6. Run final allowed headless, development and production headed Chromium proof on isolated strict loopback ports with one worker/zero auto-retries, real screenshots and named-host/GPU/frame-cost evidence. No universal performance or release-readiness claim.

### Boundaries and recovery

No renderer owns authoritative gameplay, clock, targeting, collision or RNG. No new physics/camera controls, economy settlement, Salvage Apply, audio/content selection, general framework, provider workflow, WFP/G-R/G-P, stage, commit, push or deploy. Tickets09-12 remain ON HOLD. Missing or corrupt graphics must not reset saves; context recovery requires explicit Resume and must not duplicate an Attempt. Keep native-hidden evidence limitations distinct from actual WebGL loss proof.

### Progress and evidence

- [x] Record Ticket07 acceptance and Ticket08 authorization.
- [x] Audit exact selected asset bytes, embedded glTF references and supplied licenses.
- [x] Capture180-file pre-edit baseline and run strict typecheck plus152 headless cases and11 headed Ticket07 UI cases.
- [x] Inspect fresh predecessor screenshots for victory, minimum layout and collection-save failure.
- [ ] Q14 packaging/old-Run approval.
- [ ] Runtime renderer implementation, tri-axis remediation and final executable verification.
- [ ] Final Ticket08 user acceptance.

Fresh predecessor evidence: .scratch/ticket08-development/readiness-20261010-200804-197/. Typecheck/headless/browser exit0;11 UI cases passed in25.8 seconds;180 inventoried files unchanged during execution, HEAD/index unchanged, test ports released. This is not a renderer PASS; no production build or GPU benchmark ran in this readiness step.

## Ticket 08 implementation and review checkpoint - 2026-10-10

Q14 is approved and implemented as the new immutable rendered pack. Source contract: docs/product/DEVELOPMENT_RENDERED_COMBAT_SHIP_V1.md. The exact14 assets produce a14,006,431-byte canonical manifest; original gameplay and old artifacts are preserved. Pinned Three.js/Lucide/typings were installed without lifecycle scripts. The existing logical content repository now stages this large body in replaceable IndexedDB while preserving the same active/LKG/digest registry and all old small-pack paths. No Player Data schema or ruleset changed.

The optional production renderer loads only the exact pinned Q14 assets, uses the accepted equipment geometry and canonical coordinates, displays paired word occurrences and acknowledgment-only harvest, and observes typed simulation events across multi-tick frames. Initial ready/loading, errors/Retry, native context loss/restoration, late bitmap completions, per-fleet reset and disposal have focused browser proof. Old combat Runs retain their prior DOM HUD. An actual fixed-seed keyboard workload traversed Scout/Boss/victory with the renderer; currency and Salvage Apply remain outside scope.

Initial read-only logical tri-axis on211 frozen files: Standards PASS; Spec revision required for input-echo diagnostics/insufficient actual-object proof (CS08-01); Architecture revision required for partial fleet allocation rollback (AR08-01); Security PASS limited to inspected boundaries. All initial axes completed before remediation. Candidate verification before these findings passed160 headless and13 focused browser cases.

The added red tests demonstrated21 still-owned resources after an injected badge-construction exception and absent actual module-transform evidence. Remediation registers29 constructor allocation sites immediately, owns merged geometry, rolls back incomplete fleets without disposing shared asset hulls, and exposes actual object transforms/mesh counts/active effect pools. Real-browser red/green evidence plus existing cache/UI cases passed15/15 in2.9 minutes, with no automatic retries. The all-nine presentation fixture is deliberately synthetic and writes no Player Data; the ordinary real-pack/earned-starter/whole-Map routes remain separate proofs. Existing acceptance assertions and gameplay rules were not weakened.

A task-local edit helper initially assumed a JavaScript compiler API not exposed by installed TypeScript7; it failed before any product edit. It was replaced with a bounded source-constructor rewriter using the inspected file. This is tooling friction, not a product failure or a change to Harness guidance. Prior logs are retained.

Current state: implementation and focused remediation verified; selective/final full review and final whole-suite development/production gates are still required. User acceptance Pending. Tickets09-12 remain ON HOLD. No stage, commit, push, deployment or suspended-provider action is authorized.

## Ticket08 post-verification footer correction - 2026-10-10

The interrupted response was resumed by inspecting the live repository. Its saved final gate had completed: 161 headless,109 development and62 production cases, all exits0, and213 frozen files matched. These results were preserved, not rerun blindly. Final screenshot inspection nevertheless found CS08-02, a Medium layout/verification blocker: graphics failures could collapse the collection receipt to0px and clip bottom help even though ordinary viewport assertions passed.

Read-only observations and four new regression cases cover decode failure, native context loss, collection storage failure and combined GPU/storage failure at1280x720 and1366x768. All four initially failed the visible-acknowledgment assertion; this red evidence is retained. The bounded remedy changes only rendered CSS: normal-state sizing stays unchanged, graphics/error notices reserve additional footer space by reducing the shared well/camera height, and direct footer children no longer flex-shrink to invisibility. No clock, input, Ruleset, save, asset or renderer object-lifetime rule changed.

Focused verification passed strict typecheck and14/14 headed browser cases (four new fault states plus the ten original renderer UI scenarios), exit0, zero automatic retries. The four inspected correction screenshots show the receipt and help fully visible and camera/well bottoms aligned; blank/lost graphics remain visibly unavailable, not falsely restored. Evidence: footer-probe*, footer-red*, footer-green* under .scratch/ticket08-development/.

CS08-02 requires selective Code/Spec re-review followed by fresh final full tri-axis and a new complete executable gate on the updated snapshot. The earlier final gate remains historical; no user acceptance is inferred. Tickets09-12 ON HOLD. No stage, commit, push, deployment, provider reviewer or suspended orchestration action is authorized.

## Ticket08 completed development result

The corrected candidate passed final full Code/Spec, Architecture and Security review, then the complete executable gate. The implementation report records exact counts, CS08-01/AR08-01/CS08-02 red-green evidence, screenshots, local performance limits, unchanged content and predecessor compatibility. Earlier failed/incomplete observations remain historical. This completes the authorized development-only renderer implementation, not public asset acceptance or the full MVP. User acceptance Pending; Tickets09-12 ON HOLD.
