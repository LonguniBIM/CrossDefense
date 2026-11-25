# Development Pack Fixture Inventory

Status: Q1/Q2 development starter content approved by the user on 2026-10-05 (Asia/Ho_Chi_Minh). The approved SHIP source is authored and compiled; verification is recorded in [SHIP pack verification](TICKET02_SHIP_PACK_VERIFICATION.md). ChatGPT-only review remains the authorized engineering gate. Official Ticket 02 acceptance criteria are unchanged; final user acceptance is separate.

## Ticket 02 boundary

Ticket 02 implements the versioned Content Pack contract, deterministic compilation/validation, Last Known Good activation, Run version pinning, idempotent Start Run, durable quota/objective persistence, and Content Required recovery. Authoring and real-pack verification do not authorize Ticket 03 collection implementation.

## Manifest and fixture inventory

| Input | Authority | Current status | Development action |
| --- | --- | --- | --- |
| Version and compatibility | Q1; ADR 0005; runtime version contract | Approved: `development-starter-ship-v1`, schema 1, Ruleset `development-ruleset-2026-09-30`, minimum App `0.1.0` | Preserve these pins and the immutable compiled identity. |
| Pre-Run finite quota | Q1; Q271 | Approved: 8 Letter Tiles | Use the authored quota, not a UI default. |
| Starter Target Word | Q1 | Approved: SHIP | The starter must include a Weapon Tile. |
| Starter Letter Tiles/subtypes | Q1 | Approved: S/Ballistic x2, H/Armor x2, I/Power x2, P/Armor x2 | Keep all eight entries; do not deduplicate repeated definitions or grant them at Start. |
| Pre-Run collection/payload policy | Q1 and [approved SHIP contract](DEVELOPMENT_STARTER_SHIP_V1.md) | Finite pool, committed entries not reissued; uncollected identity retained on recovery; minimum requires SHIP with Weapon | Implementation and dynamic proof remain Ticket 03; no fixed falling order/probabilities selected here. |
| Payload distribution outside this starter | Implementation specification fixture gate | Pending later-ticket decision | Do not generalize the starter policy to Map combat. |
| Q290-Q298 activation timing and Level-1 experimental magnitudes | COMBAT_TIMING.md | Approved experiment inputs | No changes in this content-authoring step. |
| Numeric precision/rounding and mitigation K | Technical architecture and MVP damage rules | Pending affected-ticket decision | Do not select values here. |
| Encounter, Threat and boss schedule | Implementation specification fixture gate | Pending later-ticket fixture review | Not part of SHIP starter authoring. |
| Rewards and progression fixture | Implementation specification fixture gate | Pending later-ticket fixture review | No currency or reward values added. |
| Learning Entries, accepted answers and Review rewards | Implementation specification fixture gate; Ticket10 dependency | Q15 approved; Ticket10 implemented, verified and explicitly accepted on 2026-11-25 (Asia/Ho_Chi_Minh) | The SHIP noun water-vessel Learning Entry, exact answer, staged hints, 1+1 Credits and immediate-due occurrence policy are recorded in [the approved Q15 contract](DEVELOPMENT_REVIEW_SHIP_V1.md). The immutable development-review-ship-v1 pack and preserved older bytes/pins are covered by [Ticket10 verification](TICKET10_DEVELOPMENT_VERIFICATION.md). Explicit user acceptance is recorded in [the acceptance record](TICKET10_ACCEPTANCE_20261125.md). |
| Starter assets/audio | Q2 | Approved: explicitly empty `assets: []` | Generated `assetManifest` is empty. No external art/audio selected. |
| Later renderer/audio assets and provenance | ADR 0012 and affected-ticket gates | Pending later-ticket review | The prototype asset folder is not declared release-ready. |
| Manifest integrity | Shared compiler/runtime codec | Implemented; computed for the actual SHIP source | Compare deterministic outputs and validate before activation; never fabricate checksums. |

## Authoring and compilation

Source: `content/authoring/development-starter-ship-v1.json`.
Runtime artifact: `public/content/packs/development/manifest.json`.
Collection contract: [Approved Development Starter: SHIP v1](DEVELOPMENT_STARTER_SHIP_V1.md).

```powershell
npm run content:compile -- --source content/authoring/development-starter-ship-v1.json --assets-root content/authoring --out <new-staging-manifest.json>
```

The source explicitly names the version, compatibility, starter and empty assets list. The compiler emits deterministic canonical JSON and SHA-256 metadata. It refuses to overwrite an existing output. The small development format supports embedded asset bytes, but this starter embeds none. Integrity is corruption detection, not publisher authentication.

The SHIP source is real user-approved development content. Existing TEST/quota-4 fixtures remain synthetic test data; they are not silently promoted or rewritten. Invalid/missing content must preserve Player Data and use the appropriate recovery route.

## Review and acceptance state

The former starter-authoring decision gate is resolved by Q1/Q2. Code/tooling and actual pack verification are reported separately in [the earlier tri-axis record](TICKET02_CHATGPT_TRI_AXIS_REVIEW.md) and [the SHIP verification record](TICKET02_SHIP_PACK_VERIFICATION.md). Final Ticket 02 user acceptance remains Pending. Tickets 03-12 remain ON HOLD; authoring approval does not open them.

## Subsequent Build content approval - 2026-10-06

Q5-Q8 explicitly approve the separate development-build-ship-v1 pack and development-build-ruleset-v1. See [approved Build content](DEVELOPMENT_BUILD_SHIP_V1.md) for the 13-cell hull, six spellings (CEFR Unknown), and hundredths policy. The legacy starter artifact remains unchanged. Ticket 04 is open development-only; Tickets 05-12 remain ON HOLD. Earlier status paragraphs record the Ticket 02 authoring checkpoint and do not override this later authorization.

## Ticket10 fixture frontier - 2026-11-25

Ticket09 remains Implemented / Integrated verification PASS / User acceptance Accepted. Ticket10 is Implemented / Integrated verification PASS / ChatGPT tri-axis PASS / User acceptance Accepted, development-only, with explicit acceptance on 2026-11-25 (Asia/Ho_Chi_Minh). See [the acceptance record](TICKET10_ACCEPTANCE_20261125.md), [completed plan](../plans/completed/ticket10-review-occurrence.md) and [verification record](TICKET10_DEVELOPMENT_VERIFICATION.md). Stage, commit, push and merge of the completed product work are authorized; deployment and suspended operations remain unauthorized. Ticket11 is the next-session implementation target and has not started here; Ticket12 remains ON HOLD. Earlier dated hold statements above are historical checkpoints.
