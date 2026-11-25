# First Durable Playable Slice: Approved Ticket Breakdown

> Latest user authority - 2026-11-25 (Asia/Ho_Chi_Minh): The user explicitly accepted Ticket10 and authorized staging, committing, pushing and merging the completed product work. Ticket10 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted, development-only; see [the acceptance record](TICKET10_ACCEPTANCE_20261125.md), [verification record](TICKET10_DEVELOPMENT_VERIFICATION.md) and [completed plan](../plans/completed/ticket10-review-occurrence.md). Q15 remains approved: the SHIP noun water-vessel Review fixture, 1 completion Credit + 1 independent-first-response bonus, event-triggered immediate-due occurrence policy, and immutable development-review-ship-v1 with old Run pins preserved. Ticket09 remains Implemented / Integrated verification PASS / User acceptance Accepted. Ticket11 is the next-session implementation target and has not started in this session; Ticket12 remains ON HOLD. No Ticket02/03 final acceptance is inferred. Earlier Pending, hold and no-Git notices are historical where superseded. Deployment, publication beyond the authorized Git actions, provider reviewers, credential setup, suspended orchestration and WFP/G-R/G-P operations remain unauthorized. The refused snapshot operation remains prohibited.

> Historical authority - 2026-10-11: Ticket08 is Approved / User accepted. Ticket09 outcome settlement and staged Salvage is authorized development-only with ChatGPT-only tri-axis review and isolated Chromium smoke. Existing Q13 rewards and Q14 content pins remain authoritative; no new content selection is required. Tickets10-12 remain ON HOLD. No stage, commit, push, deploy, provider/orchestration or WFP/G-R/G-P work is authorized. See docs/plans/active/ticket09-outcomes-salvage.md.

> Ticket08 engineering closeout: Q14 is Implemented / Locally verified / ChatGPT tri-axis PASS after the fault-footer correction and final full executable gate. See docs/product/TICKET08_DEVELOPMENT_VERIFICATION.md. User acceptance Pending; Tickets09-12 ON HOLD. Earlier Pending notes below are historical. No stage, commit, push or deployment is authorized.

> Q14 approved by the user on 2026-10-10: implement development-rendered-combat-ship-v1 with the exact audited 14 assets, schema 4 and unchanged development-combat-ruleset-v1. Old Runs retain their original pins and HUD/capability. Ticket08 authoring/implementation is now authorized; tri-axis and final executable verification remain Pending. Tickets09-12 ON HOLD; no stage, commit, push, deployment or provider/orchestration work. This latest notice supersedes the historical Q14 Pending wording below.

> Current frontier - 2026-10-10: Tickets 04-07 are Approved / User accepted. Ticket 08 is explicitly authorized development-only with ChatGPT-only tri-axis review and isolated Chromium smoke. Its selected asset audit is complete; Q14 packaging/old-Run behavior is proposed, not approved. No renderer runtime or new content pack has been implemented. Tickets 09-12 remain ON HOLD. See docs/product/TICKET08_RENDERER_READINESS.md and docs/plans/completed/ui-components-fixed-camera-renderer.md. Earlier evidence remains historical; official acceptance criteria are unchanged.

Status: APPROVED. Ticket 01 is COMPLETE / VERIFIED after explicit authorization on 2026-10-01. Ticket 02 is Implemented / Locally verified after development-only authorization on 2026-10-04; ChatGPT-only engineering review applies; the approved SHIP starter is authored, compiled and locally verified; final user acceptance remains Pending. Tickets 06-12 remain NOT STARTED / ON HOLD. Local ticket numbers are not tracker issue IDs.
Current Ticket 04/05 boundary: Ticket 04 is Approved / User accepted. Ticket 05 is authorized development-only, implemented with focused local verification, and uses ChatGPT-only tri-axis review plus separate Chromium smoke. See TICKET05_EDITING_CONTRACT.md and TICKET05_DEVELOPMENT_VERIFICATION.md. Ticket 05 final user acceptance remains Pending; Tickets 06-12 remain ON HOLD.
Current Ticket 03 boundary: Q3-A/Q4 are explicitly approved; development-only implementation is locally verified. ChatGPT-only review applies; final user acceptance remains Pending. The current evidence record is TICKET03_DEVELOPMENT_VERIFICATION.md. No later ticket is opened automatically.
Authority: [approved implementation specification](IMPLEMENTATION_SPEC.md). Local ticket documents are stored under .scratch/first-durable-playable-slice/issues/. No external tracker issues have been published.

## Approval And Frontier
The user approved the specification, T1-T4 and the granularity/dependencies below. Ticket 01 was later explicitly authorized and is now complete / verified. Ticket 02 was later explicitly authorized for development-only execution and is Implemented / Locally verified; ChatGPT-only engineering review applies; the approved SHIP starter is authored, compiled and locally verified; final user acceptance remains Pending. Tickets 06-12 remain NOT STARTED / ON HOLD.
Do not request repeat approval of the settled specification or technology choices. Technology approval does not turn draft fixture values into product policy.
No enabling refactor is needed: production directories are scaffolds. Borrow evidence from PoCs while implementing the approved production boundaries; do not promote the entire prototype host.

## Approved Tickets

1. **01 - Create and continue a durable Pilot**
   - **Status:** COMPLETE / VERIFIED on the local working tree; no commit, push, or deployment performed.
   - **Delivers:** a launchable production app with bootstrap, one writable Workspace, Pilot creation/chooser, and explicit Continue.
   - **Acceptance:** strict TypeScript build runs; nickname/avatar and independent Pilot identity survive real IndexedDB reload; duplicate UI submission does not create twice; second tab is blocked; failed storage shows recovery rather than replacing the save.
   - **Proof:** public create/continue scenario plus real-browser reload and two-tab test. Corruption/import UI beyond the safe bootstrap boundary remains a later MVP ticket.

2. **02 - Start a pinned Run and validate its development pack**
   - **Blocked by:** 01; reviewed development pack manifest. T4 is approved.
   - **Delivers:** a new Run pinned to validated Ruleset/Content versions, entering Pre-Run Salvage with visible objective/quota.
   - **Acceptance:** incompatible/invalid pack cannot replace Last Known Good; authored quota can yield the required word/Weapon starter; repeated Start does not create duplicate Runs; reload retains versions and quota; missing pinned content preserves the Run in Content Required.
   - **Proof:** deterministic pack validation and public StartRun scenarios; browser reload/content-failure route.
   - **Content gate:** explicitly review missing fixture inputs listed in the specification before coding them. Invalid content never triggers invented starter grants.

3. **03 - Collect a durable Pre-Run starter**
   - **Blocked by:** 02.
   - **Delivers:** playable enemy-free Falling Blocks, Hold/Next/Ghost, accepted input rules, and commit-confirmed quota/collection feedback.
   - **Acceptance:** exact payload identity survives rotations/Hold; only cleared payloads collect; quota and tiles commit atomically; top-out/reload reset the transient board without reroll farming; Finish appears only at the viable minimum and collection stops at quota exhaustion.
   - **Proof:** public deterministic board/Pre-Run scenarios including lock/contact/input boundaries, plus keyboard clear/save-failure/reload in the browser.

4. **04 - Place a word on a saved ship**
   - **Blocked by:** 03.
   - **Delivers:** accepted Build layout with Cargo, Ship Grid, Inspector, Power, Equipped Tiles, and Equipped Words.
   - **Acceptance:** pointer/click/keyboard use the same placement intent; occupied/invalid targets preserve both tiles; preview is not durable and does not inflate summaries; supported contiguous words/crossings and Power derive from committed inputs; reload reproduces the build.
   - **Proof:** public placement/word/Power scenarios and real-browser equivalent input routes plus minimum-viewport screenshot.

5. **05 - Revise a build with Return, Undo and Redo**
   - **Blocked by:** 04.
   - **Delivers:** reversible layout editing with durable, validated history operations.
   - **Acceptance:** Return preserves tile ownership/capacity; Undo/Redo restore valid layout and summaries; history never reverses economy; reload, Attempt start, hull change and retained-tile changes clear history as specified; failed save retains the prior layout and retry identity.
   - **Proof:** public editing sequence with rejection/save failure and browser Return/Undo/Redo/reload.

6. **06 - Launch and recover a Map Attempt**
   - **Blocked by:** 04.
   - **Delivers:** Map/difficulty selection, hard blockers/no-offense advisory, immutable startup snapshots, and a recoverable Attempt envelope.
   - **Acceptance:** insufficient Power/unresolved Salvage cannot launch; no supported word is not an extra blocker; new Pilot defaults to Normal and explicit difficulty persists; duplicate Start creates one Attempt; reload marks it interrupted and returns to Build without victory rewards.
   - **Proof:** public launch/recovery scenarios and browser launch/advisory/reload. This ticket may use a diagnostic paused Attempt surface until 07; it does not claim playable combat.

7. **07 - Play a Map with deterministic auto-battle and durable collection**
   - **Blocked by:** 03 and 06; reviewed encounter/Threat/reward fixture.
   - **Delivers:** combined board/Combat simulation with a minimal factual DOM HUD and real collection barrier.
   - **Acceptance:** board lock changes Threat under the approved Ruleset; separate Piece/Payload RNG streams remain stable; subtype cadence, target loss, mitigation, Shield and Support follow the timing contract; both clocks stop at pause/barrier; final-tick collection and terminal outcome commit once with failure precedence; ordinary success resumes without countdown.
   - **Proof:** public fixed-seed scenario across frame schedules; real-browser collection failure/Retry and reload. Three.js presentation is independently added by 08; simulation is demoable through the HUD.
   - **Size boundary:** one development Map only, no full encounter catalog, final tuning or new effects.

8. **08 - Render the accepted ship and Attempt layout**
   - **Blocked by:** 07; reviewed asset manifest. T2 is approved.
   - **Delivers:** fixed-camera 2.5D read-only renderer with current bright sci-fi treatment, mounted equipment, typed effects and accepted summaries.
   - **Acceptance:** equipped layout matches Build; effects follow real simulation events; all nine harvest types update from acknowledgments only; supported player/enemy words occupy one row per occurrence; active/Hold/Next sizing matches; camera/HUD align; no vertical Attempt scroll at minimum size; context loss pauses safely and resource reset disposes owned resources.
   - **Proof:** browser layout/event/context-loss checks and visual inspection at minimum/reference sizes; record actual machine/browser and frame-cost evidence without claiming a universal performance guarantee.

9. **09 - Resolve outcomes and stage Salvage**
   - **Status (2026-11-25):** Implemented / Integrated verification PASS / User acceptance Accepted. Exact checkpoint validation and dated execution evidence: [acceptance record](TICKET09_ACCEPTANCE_20261125.md).
   - **Dependency:** 07 satisfied by the accepted implementation lineage.
   - **Delivers:** factual result/committed-loot screen and staged Keep/Discard/replacement flow back to Build.
   - **Acceptance:** authored encounter/boss completion reaches the proper result; victory/First-Clear/replay rewards and unlocks commit atomically and retry once; failures/abandon/interruption keep eligible committed loot without victory rewards; cancel changes nothing; Apply requires resolved capacity-valid choices and one destructive/build-impact summary.
   - **Proof:** public victory/failure/replay/Salvage scenarios, browser save failure/retry and capacity/cancel/apply checks.
   - **Size boundary:** one authored Map; later Map-unlock scale-up is outside this slice.

10. **10 - Complete or leave one persistent Review Occurrence**
    - **Status (2026-11-25):** Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted, development-only. Explicitly accepted on 2026-11-25 (Asia/Ho_Chi_Minh); see [the acceptance record](TICKET10_ACCEPTANCE_20261125.md) and [verification record](TICKET10_DEVELOPMENT_VERIFICATION.md).
    - **Dependency:** 09 satisfied. The reviewed Learning Entry/answer/reward fixture was approved as Q15 on 2026-11-25; see [the completed plan](../plans/completed/ticket10-review-occurrence.md).
    - **Delivers:** optional post-result Review and due Review entry from Build, without conflating spelling and recall.
    - **Acceptance:** blank is not an attempt; normalization is case/outer whitespace only; hints, first response and attempts persist; leaving/reload resumes the same occurrence; first correct rewards once; assisted success is separate from independent first recall; abandonment/interruption does not auto-offer Review.
    - **Proof:** public response/hint/reward scenarios and browser leave/reload/duplicate-submit. Missing audio is nonblocking.

11. **11 - Preserve controls, focus and pause across settings**
    - **Status (2026-11-25):** Next-session implementation target; not started in this session.
    - **Blocked by:** 07.
    - **Delivers:** accepted remappable controls, scoped audio/reduced-motion settings, accessible pause/resume and focus behavior.
    - **Acceptance:** conflicts are explained; text input never triggers gameplay; blur/hidden/undersized/overlay pause both clocks; explicit Resume clears stale input and keeps clocks paused during 3-2-1; motion settings preserve factual cues; focus returns to modal invoker.
    - **Proof:** browser keyboard/visibility/resize/settings routes and pause-clock assertions. Default keyboard handling already exists in 03/07; this ticket completes settings and accessibility interactions.

12. **12 - Complete the slice offline and verify recovery**
    - **Status (2026-11-25):** ON HOLD.
    - **Blocked by:** 05, 08, 09, 10 and 11.
    - **Delivers:** production-build offline caching of the slice, safe updates/content retention, and an integrated playable milestone.
    - **Acceptance:** after initial load, offline create/continue -> Pre-Run -> Build -> Attempt -> result/Salvage -> optional Review -> Build works; reload preserves progress and recovers interruptions; update never hot-swaps active play; invalid packs preserve Last Known Good; required pinned packs are retained; headless/browser scenario digests agree.
    - **Proof:** production service-worker browser run plus integrated public scenario, current minimum/reference screenshots and a bounded diagnostic record of versions/seed/outcome.
    - **Completion:** user reviews the durable slice; do not claim full MVP or public-release readiness.

## Remaining Full-MVP Scope
The first-slice milestone does not approve omission of multi-Pilot management/deletion, complete tutorial/hints/word inspector, hull switching/expansion, permanent purchases/upgrades/Cargo expansion, all Maps/difficulties/content, learning summaries, full backup/import/migration/corruption recovery, Restart Run/final-Map flows, or release asset/content-rights checks. These remain in the MVP and UX contracts and require subsequent approved slices.

## Approval Record
The specification, T1-T4, and all 12 tickets including their granularity and dependencies were approved on 2026-10-01 at 02:48 Asia/Bangkok. No implementation was authorized for this turn. Fixture-dependent tickets retain their explicit content/asset gates. Resume only on a later user instruction.

Current development-only remediation evidence and review disposition are recorded in [Ticket 02 ChatGPT tri-axis review](TICKET02_CHATGPT_TRI_AXIS_REVIEW.md). Official acceptance criteria remain unchanged; no real starter content was invented.

Q1/Q2 starter approval is implemented as `development-starter-ship-v1`: see [approved content](DEVELOPMENT_STARTER_SHIP_V1.md) and [real-pack verification](TICKET02_SHIP_PACK_VERIFICATION.md). Final Ticket 02 user acceptance is Pending; Tickets 06-12 remain ON HOLD.

Ticket 04 continuation (2026-10-06): the user approved Q5-Q8 and development-only implementation. The Build pack, hull/spellings, exact numeric policy and old-Run compatibility contract are recorded in docs/product/DEVELOPMENT_BUILD_SHIP_V1.md. Ticket 04 is implemented and locally verified through focused behavior checks. The final ChatGPT tri-axis and combined verification disposition is recorded in docs/product/TICKET04_DEVELOPMENT_VERIFICATION.md; final user acceptance remains Pending. Tickets 06-12 remain ON HOLD. Prior tickets and Ticket 04 final user acceptance are not inferred.
