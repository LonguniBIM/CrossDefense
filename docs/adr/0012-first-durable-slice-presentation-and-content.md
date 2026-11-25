# First durable slice presentation and development content

**Status:** accepted on 2026-10-01 at 02:48 Asia/Bangkok; execution ON HOLD by explicit user instruction.

## Decision
- T1: typed semantic DOM components for the first slice; defer a general UI framework.
- T2: Three.js for fixed-camera 2.5D Combat behind read-only projections/events, with resize, pause, context-loss and disposal handling.
- T3: Application-owned projections plus local transient view state; no separate state-management library. Browser-native audio remains an observer behind an interface.
- T4: a small versioned development Content Pack with deterministic validation/build tooling; defer a visual content editor. Retain reviewed asset provenance for internal evaluation.

## Evidence And Authority
The user explicitly approved T1-T4 with the [implementation specification](../product/IMPLEMENTATION_SPEC.md) and [12-ticket breakdown](../product/IMPLEMENTATION_BREAKDOWN.md). Foundation PoCs and the fixed-camera interaction study supplied the proposal evidence; no new runtime benchmark is claimed by this decision.

## Consequences
Keep Domain headless and deterministic. Renderers, audio and UI never own gameplay truth. These choices apply to the first durable slice, not a blanket approval of final balance, the entire asset directory or public release. Ticket-specific content/asset manifest reviews remain required.

Approval is distinct from permission to start. At the time this ADR was recorded, all tickets remained NOT STARTED / ON HOLD. Subsequent explicit instructions authorized Ticket 01 and later Ticket 02 for development-only execution; Tickets 03-12 remain ON HOLD. No production implementation was performed as part of recording this decision.
