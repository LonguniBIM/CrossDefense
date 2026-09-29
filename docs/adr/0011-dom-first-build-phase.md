# DOM-first Build Phase with full deterministic recomputation

**Status:** accepted

Implement the Build Phase with semantic DOM interactions first and recompute Build-derived values from canonical inputs after each preview/commit unless later profiling proves this insufficient.

## Why

PoC-2 passed real Playwright drag/drop behavior and preserved preview-versus-committed state. A 5,000-iteration browser benchmark measured full recomputation at approximately 0.10 ms p95 and 0.50 ms maximum in the tested environment.

## Considered Options

- DOM-first Build UI with full recomputation;
- Canvas/WebGL Build UI;
- incremental cached Build-stat updates.

## Consequences

Do not introduce Canvas/WebGL or incremental stat-maintenance complexity for the Build Phase without new profiling evidence. This ADR does not select the Combat renderer or the overall UI framework.
