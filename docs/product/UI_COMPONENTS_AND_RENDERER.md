# UI Components And Renderer Refinement

Status: Q284-Q298 approved on 2026-09-30; Q299-Q319 approved on 2026-10-01 (Asia/Bangkok). Equipment/Combat feedback, cooldowns, falling-block presentation, controls, and boundary decisions are recorded in [UX_UI_DESIGN.md](UX_UI_DESIGN.md). The [consolidated Falling Blocks design](FALLING_BLOCKS_DESIGN.md) includes exact rotation/spawn and input details plus playable experiment scope, all confirmed by the user on 2026-10-01 with explicit prototype implementation authorization. Final balance and production renderer acceptance remain open.

## Accepted Direction
- Q284: clean navy sci-fi surfaces with lightly beveled tiles and visible hover, focus, selected, disabled, and error treatment.
- Q285: outline icons next to subtype labels. Use Ballistic/crosshair, Missile/rocket, Laser/scan-line, Armor/brick-wall, Shield/shield, System/cpu, Engine/flame, Power/battery-charging, Support/wrench. Full names appear in filters, inspector, and Salvage; compact tile marks must not crowd the letter. Icons with adjacent text are decorative for assistive technology.
- Q286: fixed-camera 2.5D Combat, superseding the flat-2D portion of Q228/Q280. No interactive orbit/zoom, aiming, or physical simulation changes. Combat remains left, falling blocks right, and Build remains semantic DOM.

## Approved Equipment And Combat Feedback
- Q287: preserve equipped module layout between the letter-first DOM Ship Grid and the fixed-camera 2.5D Combat ship. Keep the accepted three-region Build layout; show icon, subtype, and effect in the Inspector.
- Q288: preview valid/invalid placement, affected words, and Power/stat differences. A successful commit produces a short settle/outline pulse; rejection preserves state and explains why. Reduced motion uses static cues. Do not imply unsupported range mechanics.
- Q289: use restrained, distinguishable Ballistic/Missile/Laser effects, Shield impacts, factual Hull damage feedback, and engine exhaust. Power/System/Support activity must reflect actual state/events. No default shake, routine floating damage numbers, or unsupported module destruction.
- Source: user-supplied recording `2026-09-30 20-15-45.mkv` (50.917 seconds); Build/equipment references approximately 00:00-00:24 and Combat approximately 00:38-00:44. These observations are visual reference evidence, not imported Space Arena combat rules.
- Q290-Q293: approved real subtype activation timing, per-tile Weapon/Support timers, a shared Shield recharge delay, magnitude-only bonus scaling, and readable cooldown UI. See [COMBAT_TIMING.md](COMBAT_TIMING.md). Q294-Q298 settle boundary behavior and experimental effect magnitudes. The original renderer benchmark predates this refinement.

## Experiment
See [prototype run instructions](../../prototypes/fixed-camera-renderer/README.md). Question: can fixed-camera 2.5D coexist with readable DOM controls at the minimum viewport and safe pause/recovery behavior?
Three.js is evaluated as a candidate, with a Canvas 2D reference using the same immutable fixture. Low-poly meshes and numerical values are illustrative. An orthographic camera makes depth legible without perspective size changes; the exact angle is a prototype choice for review.

## Reference Evidence
- Tetris user screenshot: clear well, Hold/Next, ghost piece, and pause. Adapt information hierarchy, preserving CrossDefense's controls and rules. https://play.tetris.com/
- Space Arena official FAQ: modular builds and power units. Borrow modular readability, not its balance or damage rules. https://space-arena.com/faq/
- Train Diorama deployment inspected 2026-09-30: Three.js revision 186, WebGLRenderer, InstancedMesh, camera controls, curves, and AudioContext. Its original framework/build system and physics packages are not established. https://traindiorama.netlify.app/js/c-MQW4PJUU.js
- Renderer reference: https://threejs.org/docs/pages/WebGLRenderer.html and https://threejs.org/docs/pages/OrthographicCamera.html

## Experiment Result
The [2026-09-30 experiment](../../prototypes/fixed-camera-renderer/RESULTS.md) passed its focused browser checks on Intel UHD Graphics. The minimum/reference layouts fit; nine subtype icons render; pause, context recovery, and fixed-camera behavior were observed. Three.js remains a candidate pending visual review and representative assets, not an approved production dependency.

## Build And Combat Follow-Up

The [interaction study](../../prototypes/fixed-camera-renderer/review/README.md) connects the same equipped layout across Build and 2.5D Combat and exercises Q290-Q298 timing. Fourteen model checks and ten browser check groups passed; minimum/reference layouts fit after corrections. See [results and limits](../../prototypes/fixed-camera-renderer/review/RESULTS.md). Human visual review remains open.

## Review Boundary
The original benchmark checks the renderer seam; the follow-up studies equipment and timing interactions. Neither is playable CrossDefense, a full component library, or evidence of production persistence or accessibility conformance. Overall UI framework, final assets, and production renderer acceptance remain open. The original 2026-09-29 design closure remains historical; this is an explicitly authorized refinement.

## Approved Visual Direction: Bright Sci-Fi

On 2026-09-30, after finding the first asset integration visually unconvincing, the user selected bright, crisp and readable sci-fi inspired by Space Arena. Keep letters and subtype identity legible; use lighter metal equipment, distinct faction accents, physically supported module presentation, distinguishable weapon silhouettes and layered effects. Show Shield absorption/depletion and Hull impacts from actual damage events. Effects remain observers of accepted timing; they do not add charge delays, damage, local module damage, aiming or camera controls.

The isolated [visual study](../../prototypes/fixed-camera-renderer/review/README.md) implements this direction with a Watch 8 s review action. This selects the art direction, not final asset quality or the production renderer. Human judgment of the rendered result remains open. See [current evidence](../../prototypes/fixed-camera-renderer/review/RESULTS.md).


## Current Visual Acceptance And Implementation Handoff (2026-10-01)

The user accepted the current design after the no-scroll Falling Blocks revision and requested the next step. Earlier statements that human visual review remains open are historical. Preserve this layout and art direction as the implementation baseline. This acceptance does not certify final balance, all production assets, accessibility conformance, or automatically select the production renderer.
See the [refreshed implementation specification](IMPLEMENTATION_SPEC.md) and [proposed ticket breakdown](IMPLEMENTATION_BREAKDOWN.md). Production coding still requires the repository specification/ticket gate; technology proposals remain explicit.
