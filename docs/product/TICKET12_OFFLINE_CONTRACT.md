# Ticket12: Offline Slice And Safe Recovery Contract

Date: 2026-11-26 (Asia/Bangkok)
Status: Approved implementation scope; implementation complete; integrated verification PASS; fresh full R4 ChatGPT tri-axis PASS; user acceptance Accepted on 2026-11-26; publication explicitly authorized; live verification pending.

## Authority And Publication Boundary

The user's Ticket12 continuation instruction accepts the completed Ticket11 application and Cloudflare Workers Static Assets Free deployment, and explicitly lifts Ticket12 ON HOLD for development-only implementation and verification. Dependencies 05, 08, 09, 10 and 11 are satisfied in the accepted lineage.

This contract applies the already-approved Ticket12, implementation specification, UX state matrix, technical/platform architecture and ADR 0009. It does not introduce Q17 or reopen content, gameplay, Q16 Workspace settings, hosting or technology selection.

Ticket12 user acceptance and subsequent publication authorization were explicitly granted on 2026-11-26; see the [acceptance record](TICKET12_ACCEPTANCE_20261126.md). Staging, commits, pushes, pull-request creation, merge, deployment through the existing Cloudflare configuration and isolated production verification are authorized. Main is connected to automatic production deployment. Actual rollout evidence belongs in the [publication plan](../plans/active/ticket12-publication-live-verification.md).

## Observable Behavior

| Area | Required behavior | Authority |
| --- | --- | --- |
| Preparation | A production build prepares the complete accepted slice and reports Ready offline only after actual required cached bytes and local validated content are available. Failed/incomplete preparation remains factual and retryable. | Ticket12; IMPLEMENTATION_SPEC.md Testing Decisions; UX_UI_STATE_MATRIX.md Offline/update |
| Offline loop | After successful preparation, offline reload supports create/continue, Pre-Run, Build, Attempt, results/Salvage, optional Review and return to Build. | Ticket12 acceptance |
| Recovery | Reload preserves acknowledged Player Data and committed loot. An interrupted Attempt uses the existing recovery lifecycle and does not resume exact mid-Combat state or grant victory rewards. | Ticket06/07/09 acceptance; implementation recovery contract |
| Updates | A running page retains one coherent App build. New code may stage while playing; explicit activation/reload is available only at entry/Build after pending writes. | TECHNICAL_ARCHITECTURE.md App updates; UX state matrix |
| Content | Validate before activation. Invalid/incompatible candidates and immutable identity conflicts preserve Last Known Good. Old Run pins never silently switch. | Content Runtime; Ticket02/04/08/10 contracts |
| Retention | Preserve active/default, Last Known Good, Active Run and supported migration/inspection content. Missing pinned content preserves the Pilot/Run in Content Required. | Technical architecture cleanup criteria; user continuation instruction |
| Installation | Opening the URL is a supported entry. Optional PWA installation is not required to play. This ticket does not claim browser installation UI without separate proof. | PLATFORM_ARCHITECTURE.md Distribution |
| Ownership | One writable Workspace remains enforced by the existing Web Lock. Another open window prevents explicit worker activation. | Existing Workspace ownership contract; coherent App update requirement |

## Delivery And Storage Boundaries

Workbox/vite-plugin-pwa owns replaceable application delivery. ContentPackApplication remains the single activation/validation owner. The existing content repository retains active/default, Last Known Good and immutable identities; render bodies remain in their separate replaceable content database. DexieWorkspaceRepository remains the authoritative Player Data owner.

All six shipped immutable pack manifests are required precache inputs. The rendered and Review manifests are each approximately 14 MB and contain the accepted embedded art. An explicit 16 MiB per-file limit must not silently exclude either manifest. Every precache entry has build-generated SHA-256 integrity, and readiness checks the actual stored bytes.

Each App build uses its own cache. The bounded implementation conservatively retains earlier build caches and all shipped pack versions. No content garbage collector or save migration is introduced. A narrow verified route can serve exact older hashed JS/CSS resources from retained caches; unknown files and source/environment/Git paths retain ordinary 404 behavior.

Browser storage remains subject to browser/user eviction and quota limits. A failed cache write or corrupted cache cannot establish readiness and must not erase or replace Player Data. Explicit Retry repairs only required delivery resources and preserves validated content identities. This includes an already installed waiting build whose cache loses integrity: repair must target that build's own manifest and must not depend on a different worker script being published.

## Safe Update Admission

- Entry means the Pilot chooser or New Run screen after bootstrap/recovery has completed.
- Build means a successfully opened Build context after Review preparation and other preceding operations have acknowledged.
- Pre-Run, Map selection, Attempt, results, Salvage, Review, loading, blocked ownership and recovery screens are not activation points.
- Pending Pilot/Run operations, content recovery and its full Build/Review re-entry, Settings saves, open dialogs, queued or unacknowledged Build edits and Attempt transitions exclude activation. Leaving a content screen cancels its later presentation/commands but does not acknowledge an already-started operation; that operation must settle before update admission can reopen.
- Admission synchronously freezes Build commands and the current application UI before the asynchronous worker request. A definitive refusal releases the same Build without changing data or history. An acknowledgment timeout or a worker that is still activating is indeterminate and must retain the admitted boundary until a terminal refusal/cancellation or completed activation and safe reload.
- The worker separately checks the requested build identity, all required cached bytes and other in-scope windows before skipWaiting. There is no unconditional skipWaiting/clients.claim and no automatic play-time reload. The browser's normal activation after all previous clients close may make the prepared version available at the next entry; that is not an active-play hot swap.
- Reload is initiated only by the admitted explicit update action. Required old content remains present after activation.

## Verification Contract

Primary seams remain public Application/Domain scenarios with real domain collaborators and in-memory storage adapters. Browser proof uses the actual production bundle, native service workers, IndexedDB and Web Locks in isolated Chromium on an owned loopback origin. Vite development mode and mocked service-worker registration do not prove offline support.

Required evidence includes:

1. A complete offline played loop using actual HTTP content and keyboard-earned Pre-Run tiles.
2. Offline reload, interruption recovery, once-only results/Review rewards and retained committed loot.
3. Actual failed initial/candidate cache preparation and truthful recovery.
4. A real staged second production build during active play, rejection outside safe points, pending-write and second-window guards, then accepted safe reload preserving saves/pins.
5. Invalid candidate rejection preserving LKG, retained old pinned content, and Content Required when a pin is truly unavailable.
6. Semantic outcome parity between the real browser host and a public headless Application replay of the same startup, versions, seed and ordered inputs. Diagnostic exclusions for wall timestamps/operation identity must be explicit.
7. Current minimum/reference viewport screenshots and a bounded versions/seed/outcome record.
8. Typecheck, all intended tracked headless product tests plus new Ticket12 tests, production build, relevant browser regressions and affected deployment dry-run.
9. Independent ChatGPT-only Code/Spec, Architecture and Security reviews, including the required final full review and executable gate.

Use git ls-files -- 'tests/headless/*.test.ts' and explicitly add tests/headless/ticket12-update-boundary.test.ts plus any further Ticket12 product tests. Never include suspended untracked orchestration tests through unrestricted discovery.

## Operational Limits

The owned test server binds loopback, refuses an occupied port, serves compiled output and real 404 responses, and offers only token-protected test controls for selecting two compiled builds or introducing bounded HTTP faults. It is not shipped in production. Browser contexts are disposable and never use the user's normal profile or production Player Data.

Evidence and additional compiled test variants may use a task-owned C: directory because the existing D: volume has limited free space. Do not delete unrelated artifacts or create source snapshots/exports.

## Status Reporting

Record implementation, integrated verification, each review axis and user acceptance separately. Historical deployment evidence does not establish Ticket12 readiness. This milestone remains within the approved scope of the first durable slice. It does not establish full MVP completion, complete content/asset-rights acceptance or general release readiness. The user's later Ticket12 acceptance is recorded separately from engineering proof and publication authority.
