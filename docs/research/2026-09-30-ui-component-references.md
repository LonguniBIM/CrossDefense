# Research: CrossDefense UI Components And Engine References

## Follow-Up Status (2026-09-30)

Desktop Commander reconnected after this research was completed. The user approved Q284-Q285 as recommended and chose the Q286 alternative: fixed-camera 2.5D plus a renderer experiment. The proposal frontier below is preserved as research history, not an unresolved vote. Current authority is docs/product/UX_UI_DESIGN.md and docs/plans/completed/ui-components-fixed-camera-renderer.md. The experiment is isolated in prototypes/fixed-camera-renderer.

## Question

Which UI components should be refined after the accepted UX behavior, how should subtype icons be presented, and what does the deployed Train Diorama actually establish about its renderer?

## Context And Authority

- Research date: 2026-09-30. The user confirmed the prior UX/UI Shared Understanding on 2026-09-29, then explicitly requested a component-level discussion referencing Tetris, Space Arena, and Train Diorama, with icons beside module subtypes.
- Treat this as a visual/component refinement round. Preserve accepted gameplay, capacity, evidence, persistence, accessibility, and recovery rules unless explicitly changed.
- The prior completion label was too broad for final component/art readiness: the accepted behavior, screen/state contract, and initial visual direction are settled; the detailed component kit and final artwork require this follow-up.
- Accepted composition remains Build Cargo left / Ship Grid center / inspector right; active play has Combat left and falling blocks right. Side-view 2D is still the approved Combat direction.
- Desktop Commander reported both available Windows devices offline. No current checkout inspection, repository mutation, commit, or push occurred in this round. The last previously verified branch/HEAD was tech-selection-poc / 2e5a73e7b2b005733564f252e2eb7f055f87ed9e; it is not reverified for today.
- All proposed repository documentation, UI labels, comments, and docstrings remain English.

## Evidence Ledger

| Claim | Evidence | Confidence | Limit |
| --- | --- | --- | --- |
| The supplied Tetris screenshot separates the tall board, Hold, Next, score/level/lines, and pause. | User attachment image(3).png, visually inspected; official entry https://play.tetris.com/ also retrieved. | High for the screenshot | The screenshot is not proof of the current live game's exact dimensions or internal engine. |
| Space Arena emphasizes modular ship builds, constrained cells, energy supply, and module characteristics. | Official FAQ https://space-arena.com/faq/, especially Gameplay questions 1, 6, and 7. | High | Its game balance, automatic motion, and damage rules are not CrossDefense requirements. The community homepage is not a playable ship editor. |
| Train Diorama maps three to a locally served Three.js module and uses plain browser module entry points. | Retrieved https://traindiorama.netlify.app/; import map points to vendor/three/build/three.module.js; entry is js/TrainScene.js. | High | Identifies the deployed assets, not the complete original development toolchain. |
| The inspected Train Diorama application code constructs WebGLRenderer. | Entry dynamically references https://traindiorama.netlify.app/js/c-MQW4PJUU.js; this deployed chunk assigns renderer = new Three namespace WebGLRenderer with antialias false. | High | Do not describe this inspected path as WebGPU. No performance benchmark was run. |
| The deployment includes Three.js revision 186. | https://traindiorama.netlify.app/vendor/three/build/three.core.js begins with Tc = "186" and exports Tc as REVISION. | High | This identifies the fetched deployment, not a recommended CrossDefense dependency version. |
| The application uses InstancedMesh, PerspectiveCamera, OrthographicCamera, CatmullRomCurve3, OrbitControls, PointerLockControls, and browser AudioContext. | Imports, constructors, and call sites in the same c-MQW4PJUU.js chunk. | High | Presence does not establish a whole architecture, frame-rate guarantee, or a library's necessity for CrossDefense. |
| React, Svelte, React Three Fiber, Rapier, Cannon, a GLTF asset pipeline, and Vite are not established by this inspection. | User attachments list possibilities; no package manifest or authoritative source repository was obtained. | High confidence in evidence limitation | Do not equate not verified with proven absent. Netlify hostname does not prove Vite. |

The web search reader could not open Train Diorama. Direct HTTPS retrieval of its public HTML and referenced JavaScript succeeded; findings above are based on those fetched assets, not search snippets. The attached security columns are not a vulnerability audit and should not be adopted as verified findings.

## Component Direction

| Component family | Reference to borrow | CrossDefense refinement |
| --- | --- | --- |
| Falling-block well | Tetris screenshot's clear well and adjacent Hold/Next | Keep board legible inside the right gameplay region; define active/locked/ghost/payload/top-out states. Use quiet grid lines and readable letters. Hold and Next belong near that board, not on opposite sides of the entire app. |
| Letter/module tile | Tactile blocks plus modular ship language | Large letter, small subtype icon plus code/name, restrained bevel, explicit selected/equipped/invalid state. Color is secondary. |
| Cargo/filter rows | Module categories and inspectable selection | Icon plus full subtype name in filters/inspector/Salvage; preserve counts and identity. Native text-only selects can remain text-only or be replaced by an accessible icon-bearing control after keyboard design. |
| Ship Grid | Modular ship configuration | Recognizable hull silhouette and slot boundaries; readable letter overlay; legal-placement and word highlights; no new adjacency/power rules from Space Arena. |
| Module/word inspector | Selected-module details | Separate intrinsic module effects, word multiplier, and learning definition/evidence. Show selected subtype icon next to its name. |
| Combat HUD | Restrained sci-fi instrumentation | Stable Hull/Shield/Threat/timer and clear pause. Add module-specific effects only where they explain the accepted build behavior. |
| Actions and dialogs | Consistent component system | Primary/secondary/destructive actions; hover/focus/disabled/loading states; one clear confirmation surface. Reuse accepted save/recovery behavior. |

## Subtype Icon Proposal

The user has authorized icons beside subtypes. These specific glyph choices remain a reviewable proposal, not a selected production icon dependency.

| Group | Subtype | Proposed symbol / preview glyph |
| --- | --- | --- |
| Weapon | Ballistic | Reticle / crosshair |
| Weapon | Missile | Missile silhouette / rocket |
| Weapon | Laser | Beam / scan-line |
| Defense | Armor | Plating / brick-wall |
| Defense | Shield | Shield outline / shield |
| Defense | System | Circuit chip / cpu |
| Utility | Engine | Thrust flame / flame |
| Utility | Power | Energy supply / battery-charging |
| Utility | Support | Maintenance tool / wrench |

Use one consistent outline family. Pair every icon with text in the component catalogue, filters, inspector, and Salvage. Small Ship Grid cells should prioritize the letter; show compact icon/code only when it fits, with the full name available in the inspector and accessible label. Decorative icons are hidden from assistive technology when adjacent text already names them. Do not communicate gameplay meaning through color or hover alone. The preview shows all nine subtypes and switches the selected tile example; it does not modify any gameplay data.

## Renderer Implications

- Three.js is confirmed for the reference deployment. It is a rendering library, not a substitute for CrossDefense's deterministic Domain Core, transaction boundaries, or UI framework.
- Keep the current DOM-first Build contract. Rendering ships with richer shading does not require moving forms, vocabulary text, Cargo controls, or dialogs into a canvas.
- Recommendation: refine the 2D side-view visual target first. If the user requests real 2.5D/3D depth, evaluate a fixed-camera Three.js presentation prototype against a 2D option using the same read-only simulation fixture. Do not silently reopen Q280 or introduce camera controls/physics.
- The smallest useful renderer experiment measures visual clarity, letter/UI legibility, frame-time variability, startup size/time, pause behavior, and context-loss recovery on the intended laptop at 1280 x 720. No such experiment was run here.

## Review Frontier

- Q284: Recommended component finish: clean sci-fi panels and lightly beveled blocks, preserving the navy direction and readable text; avoid copying the reference's chrome/background treatment wholesale. Alternative: entirely flat components.
- Q285: Recommended icon treatment: consistent outline icons plus subtype labels using the proposed nine-symbol mapping. Alternative: custom miniature module illustrations, which require more asset work and small-size testing.
- Q286: Recommended ship treatment for MVP: modular-looking hull in Build and polished 2D side-view combat with restrained weapon effects. Alternative: explicitly expand visual scope to fixed-camera 2.5D and validate Three.js before choosing a renderer.

After these choices: create the component sheet with normal/hover/focus/selected/disabled/error states, revise Build and Combat at actual viewport size, verify long labels and maximum inventories, then select the framework/renderer against those concrete requirements. This research does not authorize production implementation or select a new stack.

## Sources

- https://play.tetris.com/
- User-supplied image(1).png, image(2).png, image(3).png
- https://space-arena.com/
- https://space-arena.com/faq/
- https://traindiorama.netlify.app/
- https://traindiorama.netlify.app/js/TrainScene.js
- https://traindiorama.netlify.app/js/c-MQW4PJUU.js
- https://traindiorama.netlify.app/vendor/three/build/three.core.js
- https://threejs.org/docs/

