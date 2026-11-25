# Approved Development Rendered Combat Pack: SHIP v1

## Authority and identity

Q14 was explicitly approved by the user on 2026-10-10. Ticket08 is development-only. This contract does not open Tickets09-12 or authorize final distribution, new gameplay, free equipment, save conversion or deployment.

- Content: `development-rendered-combat-ship-v1`.
- Schema: 4; compatible Ruleset remains `development-combat-ruleset-v1`; minimum App version remains 0.1.0.
- Source: `content/authoring/development-rendered-combat-ship-v1.json`.
- Asset source root: `content/authoring/rendered-assets-v1/`.
- Runtime: `public/content/packs/development-rendered-combat-ship-v1/manifest.json`.

The gameplay fields are exactly inherited from `development-combat-ship-v1`: SHIP starter/quota8, original eight starter entries, diamond13, six spellings, Player/Scout/Boss magnitudes, timing, Threat,24 Map payloads and unpaid reward definitions. Only content identity and the asset list differ. The original authored/runtime files remain immutable.

## Exact internal asset set

The pack includes14 audited entries: Striker/Dispatcher glTF, Blue/Red diffuse textures, seven Kenney particle textures and three supplied CC0-declaring license files. Source names/bytes/hashes are recorded in `.scratch/ticket08-development/asset-audit.json`; the runtime admission owner uses `src/domain/content/renderAssets.ts` to require that exact set. Raw bytes total10,499,913; the actual canonical compiled manifest is14,006,431 bytes. Base64 overhead is not a GPU-memory measurement.

No image was resized, recompressed or substituted. Original Quaternius/Kenney provenance and supplied license bytes are retained. This internal evaluation selection does not certify the unrelated raw asset folder, final modular art, audio, accessibility or public-release rights.

## Cache and compatibility

New Runs pin this rendered pack. Old combat Runs retain `development-combat-ship-v1` and the original DOM HUD; old Build/diagnostic Runs retain their prior capabilities. Renderer admission requires the exact pinned pack/digest, not whichever default is currently active.

The existing ContentPackRepository remains the logical storage boundary. The14 MB encoded body is physically staged in replaceable IndexedDB database `crossdefense-render-content-bodies`, table `bodies`; active/default, Last Known Good and immutable digests remain in the existing localStorage registry. This is not a second content registry or a Player Data migration. Legacy small-pack localStorage paths remain unchanged.

Body staging precedes registry publication. Body-write failure leaves the previous registry and body intact; pointer-write failure leaves an unreferenced staged candidate and the original registry. Identical Retry can publish that candidate; conflicting immutable identity is rejected. Retain/restore does not switch active/LKG. Every returned body crosses existing schema, digest and asset validation before use. Cache eviction must not remove Player Data.

## Presentation contract

Three.js0.186.0, Lucide1.49.0 and matching typings are explicitly pinned. The renderer is read-only: no clock advancement, game RNG, collision, targeting, damage, equipment grant, payment or authoritative mutation. Observational tick/module/weapon/loss metadata and bounded recent-event history deliver real events even when a display frame spans multiple simulation ticks. The old simulation formulas and Player Data schema7 remain unchanged.

Canonical module coordinates/identities drive mounted letter equipment. Decorative hull meshes do not create legal cells or weapons. Both fleets use shared word recognition; unsupported enemies retain an honest empty word list. All nine harvested subtype counts come only from acknowledged collection, not effects or pending saves.

Pause freezes both games and effect ages. Initial graphics readiness gates simulation. A native WebGL context loss or graphics failure safely pauses; restoring resources does not create another Attempt or automatically Resume. Decode failure uses graphics Retry. Resource ownership is immediate and partial fleet construction rolls back. Shared models/textures outlive per-fleet resets; late asynchronous arrivals after disposal are immediately released.

## Verification boundary

The active renderer plan owns progress and review. Tests include real CLI byte equality, exact asset admission, old-Run preservation, body/pointer publication faults, actual3D transforms and typed effect instances, nine-subtype synthetic presentation, real earned-starter combat, native context loss, late bitmap disposal, real-keyboard collection/Retry and a fixed-seed full Map. Synthetic renderer fixtures never write a production save or grant equipment.

Final local executable results and ChatGPT Code/Spec, Architecture and Security disposition must be recorded separately. Typechecking or a good screenshot alone is not a full gate; final user acceptance remains a separate decision.
