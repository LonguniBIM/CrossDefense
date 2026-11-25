# Ticket 02: Approved SHIP Pack Verification

Date: 2026-10-05, Asia/Ho_Chi_Minh.
Fixed point and unchanged HEAD: `fd945fae4916b8500245e74d75d65e331fb6ba43`.
Branch: `tech-selection-poc`.

## Outcome

**PASS: approved SHIP authoring, deterministic compilation and actual-pack local verification.** The user's Q1/Q2 decision gate is resolved. The artifact is available to the local application; this is not a deployment or final user acceptance of Ticket 02. Tickets 03-12 remain ON HOLD.

Source: `content/authoring/development-starter-ship-v1.json`.
Runtime artifact: `public/content/packs/development/manifest.json`.
Approved collection contract: [Development Starter SHIP v1](DEVELOPMENT_STARTER_SHIP_V1.md).

| Item | Implemented authored value |
| --- | --- |
| Content version | `development-starter-ship-v1` |
| Ruleset / minimum App | `development-ruleset-2026-09-30` / `0.1.0` |
| Starter / quota | SHIP including a Weapon Tile / 8 Letter Tiles |
| Tile definitions | S/Ballistic x2; H/Armor x2; I/Power x2; P/Armor x2 |
| Assets/audio | Empty, as explicitly approved |

The eight entries remain separate definitions. They are not starting Cargo grants or a fixed falling sequence. The collection/identity contract is documented for Ticket 03; its implementation and dynamic proof are not part of this work.

## Compilation evidence

The existing `content:compile` command compiled the real source twice to independent staging files. Both outputs were byte-identical. The actual runtime codec accepted the candidate with zero issues. Only then was the new artifact placed at the runtime path with exclusive-create semantics; no existing artifact was overwritten.

| Fingerprint | Value |
| --- | --- |
| Source file SHA-256 | `f38c90da1c896ac8b892fad8d815f0c90e578689ee08ffac866a39bec298817f` |
| Compiled file SHA-256, including final newline | `99e3140df3774fb445f354380b41965c605bc91a5063389da58898e64bec00fe` |
| Canonical payload SHA-256, excluding integrity field | `ce6a53c397db68bf871e12fe18658bbc43e03cc7e5128511228640306c0dfb49` |
| Compiled file size | 676 bytes |
| Asset count | 0 |

`dist/content/packs/development/manifest.json` has the same whole-file SHA-256 as the runtime source artifact. These checksums detect corruption and establish byte identity; they are not publisher signatures.

The repository has `core.autocrlf=true`. A new path-specific `.gitattributes` rule disables text conversion for only this generated manifest. `git check-attr` confirms `text: unset`; global Git configuration was not modified.

## Verification performed

| Verification | Observed result |
| --- | --- |
| Baseline typecheck and existing relevant headless suite | PASS; 17 tests |
| Source regression before authoring | Intended failure: approved source missing |
| Source regression after authoring | PASS |
| Runtime-path regression before publication | Intended failure: compiled runtime manifest missing |
| New SHIP headless suite | 5/5 PASS |
| Combined Ticket 01/02 headless suite | 22/22 PASS in 7 files |
| Combined Ticket 01/02 Chromium suite | 18/18 PASS in 6 files |
| Real-pack Chromium suite against production build | 4/4 PASS |
| Final typecheck | PASS |
| Production build | PASS; 114 modules; `index-DK2b8SR9.js` |
| Existing protected file fingerprints | 55 files checked; zero changes |
| Index / HEAD | Index empty; HEAD unchanged |

The real-pack positive browser test fetches the actual HTTP manifest and compares its bytes to the repository artifact, then uses the normal UI to create/continue a Pilot, Start Run twice and reload. No fulfilled content route is used in that positive test. Separate failure tests inject missing/tampered HTTP content only inside disposable browser contexts. They prove Content Required preservation/restoration, Last Known Good retention and no silent substitution of an older pinned Run when the real SHIP default activates.

Tests use separate Playwright contexts and dedicated loopback servers on ports 4177 and 4178, with existing-server reuse disabled. No personal production browser profile or save was used. Production screenshots of New Run and Pre-Run Salvage were visually inspected at a 1366 x 768 viewport (full-page captures); they display SHIP, correct versions and 8/8 quota. No layout certification or gameplay completion is claimed.

## ChatGPT review of this increment

**Standards: PASS; no open findings.** Existing application/compiler/dependency files and pre-existing tests were preserved. Tests exercise the public compiler, content/run interfaces and real browser boundary. The generated-artifact line-ending safeguard is scoped to one path.

**Spec: PASS for authoring/compile/real-pack verification; no open findings in that scope.** Source values match the explicit Q1/Q2 approval; generated content is not hand-authored; assets remain empty; the collection contract is recorded without implementing Ticket 03. Official acceptance criteria and final user acceptance remain separate.

This is a bounded ChatGPT Standards/Spec review of the new content, tests, packaging attribute and current documentation updates. The earlier full code/tooling tri-axis record is retained in [Ticket 02 tri-axis review](TICKET02_CHATGPT_TRI_AXIS_REVIEW.md); it is not represented as a newly executed full tri-axis review of all unrelated dirty working-tree files.

## Evidence and reproduction

Evidence directory: `.scratch/ship-pack-authoring-20261005/`.
It contains `source-red.log`, `source-verified.log`, `runtime-red.log`, both staging manifests, compile logs, `compilation.json`, `ship-headless.log`, `final-local-verification.log`, `ship-browser-production.log`, `final-build.log`, protected-file baseline, browser screenshots, and the isolated browser configuration.

```powershell
npm run content:compile -- --source content/authoring/development-starter-ship-v1.json --assets-root content/authoring --out <new-staging-manifest.json>
npm run typecheck
npm test -- --run tests/headless/ticket02-ship-pack.test.ts
npm run test:e2e -- --config .scratch/ship-pack-authoring-20261005/playwright.config.ts tests/e2e/ticket-02-ship-pack.spec.ts
$env:SHIP_PACK_BUILD = '1'
npm run test:e2e -- --config .scratch/ship-pack-authoring-20261005/playwright.config.ts
```

The combined verification commands are preserved verbatim in `final-local-verification.log`. Provider/orchestration test files were intentionally excluded. This is not a repository-wide, CI, hosted deployment or offline milestone verification.

## Remaining boundary

Q1/Q2 content is approved, authored, compiled and locally verified. Final Ticket 02 user acceptance is Pending. Ticket 03 collection, payload identities, Finish, ship placement and combat remain unimplemented in this authoring step. No stage, commit, push, deploy, provider reviewer, review credentials, blocked orchestration or WFP/G-R/G-P operation was performed.
