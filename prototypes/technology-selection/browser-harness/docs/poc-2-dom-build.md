# PoC-2 — DOM Build Grid and Full-Recompute Preview

## Status

Objective browser criteria are verified green on 2026-09-29. Subjective interaction feel remains a later human UX check, but no performance evidence currently justifies a Canvas/WebGL renderer for the Build Phase.

## Prototype question

Can the Build Phase use a semantic DOM grid with drag/drop, non-durable live preview, and full deterministic stat recomputation without visible performance pressure?

## Scope

This is throwaway Technology Selection code. It is not production Build UI or production combat math.

The prototype proves only:

- a semantic HTML grid can host Letter Tiles and native drag/drop;
- preview calculation can remain separate from committed Build state;
- a drop can commit the candidate placement;
- active horizontal/vertical words can be recomputed from canonical placements;
- full recomputation can be measured in the real browser.

The final Build layout, visual design, accessibility polish, and input alternatives belong to UX/UI Detailed Design.

## Representative scenario

The prototype starts with two valid crossing words:

- `LASER` horizontally;
- `ARMOR` vertically.

Dragging the `S` tile away from `LASER` produces a preview in which:

- `LASER` disappears;
- `ARMOR` remains;
- the committed Build still contains both words until the drop occurs.

After the drop, the candidate becomes the committed Build.

## Observed evidence

Environment:

- Windows 11 Home
- Node.js v24.13.1
- Playwright 1.63.0
- Chromium 153.0.8010.12

Validation:

```text
npm run typecheck
PASS (exit code 0)

npm run test:e2e -- poc2-dom-build.spec.ts
2 passed (4.3s)
```

The drag/drop acceptance test passed against the real DOM.

The browser benchmark executed 5,000 full Build recomputations:

```text
iterations: 5000
averageMs: 0.00578
p95Ms: 0.10
maxMs: 0.50
```

The PoC threshold was:

- p95 < 4 ms;
- max < 16 ms.

The measured result is comfortably below one 60 FPS frame budget for this representative Build size.

## Defects found during PoC execution

### TypeScript closure narrowing

The first typecheck found that DOM query results narrowed by an outer guard were not considered non-null inside nested functions.

The fix preserved explicit non-null host references after the guard and used those references inside the render closure.

### Invalid word fixture

The initial vertical fixture accidentally spelled `AMROR` instead of `ARMOR`.

The failing browser acceptance test exposed the fixture error. The tile order was corrected and the original test passed.

## Decision

For the Build Phase, keep the leading rendering direction **DOM-first**.

Rationale:

- the semantic grid passed real drag/drop interaction;
- preview and committed state remain cleanly separated;
- full recomputation is far below the current frame budget;
- DOM preserves straightforward keyboard/focus/accessibility semantics;
- Canvas/WebGL complexity is not justified for this screen by current evidence.

Use full deterministic recomputation for Build preview initially. Do not introduce incremental stat recalculation until profiling of production-scale data demonstrates a real need.

This decision is specific to the Build Phase. It does not select the Combat renderer. PixiJS or another 2D renderer may still be appropriate for the animation-heavy combat surface.

## Manual inspection route

From the browser harness:

```text
http://127.0.0.1:4173/?poc=2
```

The route is a prototype only and must not be treated as final UX.

## Remaining uncertainty

- Final Build information hierarchy and visual layout.
- Keyboard and non-drag interaction design.
- Production-scale vocabulary validation cost once the full curated library is integrated.
- Combat rendering technology remains unresolved.
