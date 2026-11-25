# Ticket 08 - Renderer Readiness and Q14 Packaging Decision

> Ticket08 engineering closeout: Q14 is Implemented / Locally verified / ChatGPT tri-axis PASS after the fault-footer correction and final full executable gate. See docs/product/TICKET08_DEVELOPMENT_VERIFICATION.md. User acceptance Pending; Tickets09-12 ON HOLD. Earlier Pending notes below are historical. No stage, commit, push or deployment is authorized.

> Q14 approved by the user on 2026-10-10: implement development-rendered-combat-ship-v1 with the exact audited 14 assets, schema 4 and unchanged development-combat-ruleset-v1. Old Runs retain their original pins and HUD/capability. Ticket08 authoring/implementation is now authorized; tri-axis and final executable verification remain Pending. Tickets09-12 ON HOLD; no stage, commit, push, deployment or provider/orchestration work. This latest notice supersedes the historical Q14 Pending wording below.

Date: 2026-10-10 (Asia/Bangkok)

## Disposition

The user explicitly accepted Ticket 07 and requested the next step. Ticket 07 is **Approved / User accepted**. Ticket 08 is **Authorized / development-only / packaging decision pending**. Tickets **09-12 remain ON HOLD**.

The existing active renderer handoff plan is reused: `docs/plans/completed/ui-components-fixed-camera-renderer.md`. No competing active renderer plan is introduced. ChatGPT-only tri-axis review and isolated headed Chromium smoke remain required for the eventual implementation. This readiness report is not a renderer implementation, tri-axis PASS or final acceptance.

Original fixed point and verified HEAD: `fd945fae4916b8500245e74d75d65e331fb6ba43`, branch `tech-selection-poc`. No staged changes. No provider reviewer, credentials, suspended orchestration, WFP/G-R/G-P, commit, push or deployment is authorized.

## Settled authority - no repeat approval requested

`docs/adr/0012-first-durable-slice-presentation-and-content.md` and `IMPLEMENTATION_SPEC.md` explicitly approve Three.js (T2), semantic DOM and read-only renderer boundaries. T4 permits retaining the currently reviewed assets and provenance for internal slice evaluation. The latest accepted visual baseline is bright, crisp sci-fi with fixed camera, mounted letter-first equipment, Combat on the left, Falling Blocks on the right, words below Combat and acknowledged harvest below the well.

The asset review gate requires inspecting the actual selected manifest, not approving Three.js or the art direction again. The prototype is visual prior art only; its timing model, state, saves, synthetic actions and host must not be promoted into production.

## Actual asset audit

All **14 manifest entries** match both their declared byte lengths and SHA-256 digests. Total selected bytes: **10,499,913** (approximately 10.50 decimal MB). This is the selected raw asset set, not the eventual encoded pack size or GPU memory consumption.

| Group | Verified selection | Use and limitation |
| --- | --- | --- |
| Two models | `ships/Striker.gltf`, `ships/Dispatcher.gltf` | Player and enemy decorative hull shells; both Scout and Boss may use the existing enemy shell without changing statistics |
| Two faction textures | `ships/Striker_Blue.png`, `ships/Dispatcher_Red.png` | Existing blue/cyan player and red/orange enemy direction; both images are 2048 x 2048 |
| Seven particle textures | `circle_03`, `flame_01`, `flare_01`, `muzzle_01`, `smoke`, `spark_05`, `trace_01` | Previously reviewed transparent effects, not new combat mechanics |
| Three license files | Quaternius, Kenney Particle, Kenney Smoke | Supplied documents declare CC0; preserve them and provenance, without certifying the entire raw asset folder or a public release |

The selected glTF documents declare glTF 2.0, one mesh/material each, no required extensions and embedded buffer/image data, not external fetch URIs. Striker has 4,911 POSITION entries; Dispatcher has 1,169. These are accessor counts, not claimed triangle counts. Six particle textures are 512 x 512; smoke is 381 x 346.

Exact entry hashes and parsed metadata: `.scratch/ticket08-development/asset-audit.json`. Original manifest: `prototypes/fixed-camera-renderer/review/assets/manifest.json`. No source asset was modified or copied into a new runtime pack during this audit.

The inspected prototype lockfile pins Three.js **0.186.0** and Lucide **1.49.0**. Neither Three.js nor its TypeScript definitions is present in the root application. The implementation must use explicit compatible pinned dependencies, not an unverified latest upgrade. No dependency installation was performed in this readiness step.

## Q14 - Proposed packaging and existing-Run behavior (Pending)

The remaining choice concerns compatibility, not the already accepted picture or library. The approved Ticket 07 pack is immutable and has an explicitly empty asset manifest. Appending assets to it under the same content version would change its verified bytes. An independent application-art bundle would instead allow existing combat Runs to gain visuals without a new gameplay content pin; that separate lifecycle has not been specified. It is not introduced as an implicit shortcut here.

**Recommended: use a new immutable content pack through the existing compiler/cache/pinning path.**

| Item | Proposed contract |
| --- | --- |
| Content version | `development-rendered-combat-ship-v1` |
| Compatible Ruleset | Keep `development-combat-ruleset-v1`; no new damage, RNG, reward, difficulty or balance rule |
| Content schema | Reuse schema 4 and its existing asset manifest/embedded-byte support; do not add a second content registry merely for rendering |
| Gameplay inheritance | Preserve the exact approved SHIP starter/quota, hull cells, spellings, Player/Scout/Boss values, timers, 24 Map payloads and unpaid reward definitions |
| Assets | Include the exact 14 audited files and explicit provenance, retaining supplied licenses; no other asset pack or audio selection |
| New Runs | Pin the new rendered pack as the development default; use the fixed-camera renderer when that pinned pack provides the complete validated render asset set |
| Existing combat Runs | Keep original pins and their accepted Ticket 07 DOM combat HUD; do not silently borrow assets from the new pack |
| Existing Build/diagnostic Runs | Preserve their original capability and all Player Data; no forced conversion or restart |
| Try the new renderer | Use a fresh Pilot/Run, earn the starter normally, build and launch; do not inject free equipment or migrate the personal Run |

A new pack containing base64-encoded assets will be larger than the raw asset set. Measure the actual compiled size, decode/loading cost and frame cost before accepting Ticket 08. Do not silently resize/recompress or substitute models to meet a guessed budget; material visual/content changes require a separate decision.

Q14 approval is limited to this packaging/compatibility contract and exact internal asset set. It does not reopen Q10-Q13 or authorize later tickets, public distribution, arbitrary dependency changes or gameplay tuning.

## Implementation sequence after Q14

| Step | Observable work and required proof |
| --- | --- |
| 1. Author and admit the real pack | Compile to a new artifact, verify byte-identical rebuilds and unchanged gameplay definitions; preserve every old artifact and Run; reject missing, tampered or incomplete rendering assets without replacing Player Data |
| 2. Read-only renderer seam | Supply immutable equipment coordinates/identities and ordered simulation events; preserve combat results and gameplay RNG across rendered and non-rendered scenarios |
| 3. Production presentation | Adapt only relevant visual geometry and asset loading, not the prototype combat host; show mounted letters/subtypes, truthful timed effects, paired word rows and all nine acknowledgment-only harvest entries |
| 4. Lifecycle and layout | Exercise loading/error/Retry, actual WebGL context loss/restoration, explicit Resume, resize, shared clocks and complete resource disposal; preserve equal active/Hold/Next size and aligned camera/well bottom at minimum viewport |
| 5. Engineering gate | Full initial Code/Spec, Architecture and Security review; remediate; selective re-review; fresh final full tri-axis; then separate final typecheck, allowed headless regressions and isolated headed development/production tests |

The current combat event contract is intentionally small. Real effects require module/weapon identity, tick and actual Shield/Hull loss information at the producer, and delivery of all relevant events when one rendered frame advances several simulation ticks. Add only necessary observational metadata and prove unchanged authoritative outcomes; do not infer fake shots, hits or repair from visual timers.

The accepted procedural equipment direction remains usable for internal evaluation. Whole-ship baked details do not grant weapons, alter legal hull cells or replace canonical mounted modules. The approved enemies have no supported word; display an honest empty enemy-word state rather than inventing vocabulary for the screenshot.

A loader/context fault must stop both games at a safe boundary and retain the current Attempt and committed loot. Restoring GPU resources does not automatically resume gameplay or manufacture another Start operation. Asset decode cancellation, late async completion, shared versus per-instance GPU objects, observers and context handlers require disposal tests.

Native hidden-tab observation remains a disclosed platform limit from Ticket 07, not a reason to disable pause guards. Native context-loss proof is separately required for this renderer ticket. Hardware/browser and frame-cost measurements must name the actual environment and cannot be advertised as universal FPS guarantees.

## Fresh predecessor verification

Evidence: `.scratch/ticket08-development/readiness-20261010-200804-197/`.

| Check | Observed result |
| --- | --- |
| TypeScript | PASS, exit 0 |
| Allowed headless suite | 152/152 PASS in 25 files |
| Ticket 07 UI on isolated headed Chromium | 11/11 PASS in 25.8 seconds; one worker, zero automatic retries |
| Before/after inventory | All 180 inventoried files unchanged during verification; original HEAD preserved; index empty |
| Test server | Port 4211 released; neither 4211 nor 4212 listening after completion |

These are fresh predecessor checks, not Ticket 08 rendering tests. The browser run uses disposable data and the current accepted combat pack, not the user's personal save. No production build or renderer benchmark was rerun at this readiness checkpoint.

## Next action

Confirm Q14 packaging and old-Run behavior before authoring the new runtime pack. Ticket 08 implementation, renderer tri-axis verdicts, GPU/asset lifecycle proof and final user acceptance remain Pending. The source, tests, packages and all existing runtime content remain unchanged in this readiness step.
