# Ticket 08 - Fixed-Camera Renderer: Development Verification

> Latest user authority - 2026-10-11: Ticket08 is Approved / User accepted. Ticket09 outcome settlement and staged Salvage is authorized development-only with ChatGPT-only tri-axis review and isolated Chromium smoke. Existing Q13 rewards and Q14 content pins remain authoritative; no new content selection is required. Tickets10-12 remain ON HOLD. No stage, commit, push, deploy, provider/orchestration or WFP/G-R/G-P work is authorized. See docs/plans/active/ticket09-outcomes-salvage.md.

## Disposition

**Implemented / Locally verified / ChatGPT tri-axis PASS - development-only.** Final user acceptance remains **Pending**. Tickets **09-12 remain ON HOLD**.

Q14 is explicitly approved. Original fixed point and HEAD: fd945fae4916b8500245e74d75d65e331fb6ba43; branch tech-selection-poc. No stage, commit, push, deployment, provider reviewer, review credentials, suspended orchestration or WFP/G-R/G-P action was performed.

This continuation recovered the existing implementation and completed reviews/tests rather than overwriting them. It then found a fault-state layout gap during screenshot inspection, reproduced and fixed it, performed selective and fresh full tri-axis review, and ran a new full executable gate. Earlier results and red evidence remain preserved.

## Delivered scope

| Area | Implemented behavior |
| --- | --- |
| Immutable content | development-rendered-combat-ship-v1, schema 4, unchanged development-combat-ruleset-v1 and exact Q10-Q13 gameplay |
| Selected assets | Exactly 14 audited model/texture/particle/license files; no additional art/audio, resampling or silent replacement |
| Renderer | Fixed-camera Three.js scene, canonical mounted letters/subtypes, faction hulls and event-driven effects; no renderer-owned gameplay |
| HUD and words | Aligned Hull/Shield counters and bars, camera/well bottom alignment, paired supported word occurrences and honest empty enemy-word states |
| Collection | All nine harvest categories reflect acknowledged collection only; visual effects cannot grant loot or consume gameplay randomness |
| Graphics recovery | Loading blocks simulation; decode failure allows Retry; actual WebGL context loss pauses both games; restoration needs explicit Resume |
| Resource ownership | Immediate allocation registration, partial-fleet rollback, shared/per-instance separation, late bitmap cleanup and normal teardown |
| Fault layout | Decode, context, storage and combined faults retain visible acknowledgment/help/Retry without document overflow at the tested minimum/reference sizes |
| Compatibility | Old Runs keep their original pins and DOM HUD/capability; no forced conversion or free equipment |

No damage, mitigation, cooldown, difficulty, Threat, payload, currency or Player Data schema 7 policy was changed. Currency settlement and Salvage Keep/Discard/Apply remain Ticket09. Unresolved Salvage therefore correctly prevents another Start.

## Content, dependency and storage details

Selected raw assets total 10,499,913 bytes. The canonical compiled manifest is **14,006,431 bytes**. Public and built-production file SHA-256: 37eca6c6af3ce199d28723b2ebde9e82c4524f08ce29e99778f4cd9b4f2e31ca. Real CLI recompilation reproduces the exact artifact; earlier packs remain unchanged.

The large encoded body is staged in replaceable IndexedDB database crossdefense-render-content-bodies behind the existing ContentPackRepository. The existing localStorage active/LKG/digest registry remains the only publication authority. Body staging precedes pointer publication; failure leaves prior published identity intact and an identical Retry can reuse a staged body. Old small-pack storage remains supported. This is not a new Player Data migration or independent content registry.

Source contract: docs/product/DEVELOPMENT_RENDERED_COMBAT_SHIP_V1.md. Copied assets: content/authoring/rendered-assets-v1/. Original audit: .scratch/ticket08-development/asset-audit.json. Supplied license files declare CC0 and are preserved; no public distribution or full raw-folder rights certification is claimed.

The implementation pins Three.js 0.186.0, Lucide 1.49.0 and @types/three 0.186.0. The prior installation record disables lifecycle scripts. The final lockfile comparison found no changes to pre-existing package versions/integrities. No dependency was installed during the footer correction. This is not a CVE audit. The build still reports its minified-chunk size warning: the JavaScript entry is approximately 1,019.98 kB (276.77 kB gzip). The build exits successfully; no warning threshold was raised or warning disabled. This delivery does not claim a completed bundle-size optimization or universal cold-start budget.

## Final executable evidence

| Gate | Observed result | Evidence under .scratch/ticket08-development/ |
| --- | --- | --- |
| TypeScript | PASS, exit 0 | footer-final-verification.log |
| Allowed headless suite | 161/161 PASS in 27 files | footer-final-verification.log |
| Headed development regression | 113/113 PASS, 660.898 seconds | footer-final-development-results.json |
| Production build | PASS, 2,024 modules | footer-final-verification.log |
| Headed production regression | 66/66 PASS, 546.321 seconds | footer-final-production-results.json |
| Integrity and screenshots | PASS; 21 final images inspected | footer-final-evidence-check.json; footer-final-screenshot-inspection.json |

All final command exit codes are 0. Chromium ran in disposable contexts on strict loopback ports 4221/4222 with one worker and zero automatic retries. Both JSON reports have zero unexpected failures, skipped cases, flaky cases and report-level errors. Traces retained: 113 development and 66 production. Counts overlap and must not be summed as unique tests.

Final execution began 2026-10-10T23:01:59.5347064+07:00 and finished 2026-10-10T23:22:34.1314627+07:00. The checked ports were released afterward. Development additionally exercises public TypeScript/cache/lifetime fixtures; production uses the built app. The all-nine equipment and allocation-failure cases are deliberately synthetic and do not write Player Data or grant a saved Run equipment. Real HTTP content, earned Pre-Run, keyboard collection, native animation frames and full Map scenarios remain separate evidence.

The WebGL loss test uses the browser's WEBGL_lose_context extension to lose/restore the actual context, not a fabricated DOM event. Hidden-state, native focus loss and context loss are distinct evidence types.

## Review and remediation

All reviews are logical, sequential ChatGPT assessments. Standards and Spec are distinct sub-verdicts of Code/Spec; Architecture and Security are separately recorded. No genuinely isolated reviewer context or provider dual pass is claimed.

| Stage | Standards | Spec | Architecture | Security |
| --- | --- | --- | --- | --- |
| Initial full review | PASS | Revision required | Revision required | PASS in scope |
| Initial remediation and re-review | PASS | PASS | PASS | PASS in scope |
| Earlier final review and test gate | PASS | PASS | PASS | PASS in scope |
| Later screenshot inspection | Preserved | CS08-02 found; closeout withheld | No new ownership change | No new trust boundary |
| Footer selective re-review | PASS | PASS | Final re-review required | Final re-review required |
| Fresh review-footer-final | PASS | PASS | PASS | PASS in development-only scope |

| Finding | Severity and verified resolution |
| --- | --- |
| CS08-01 | Medium verification blocker. Earlier diagnostics echoed intended equipment/events. New proof observes actual Three.js group positions, mesh counts and active effect objects across all nine synthetic subtypes, alongside real saved-Run gameplay. |
| AR08-01 | Medium lifetime blocker. Injected badge-construction failure retained 21 owned resources. Immediate allocation ownership and partial-fleet rollback now release the scope while preserving shared assets; negative/positive lifetime tests remain. |
| CS08-02 | Medium layout/verification blocker found during this continuation. Fault messages collapsed the receipt to 0 px and clipped help while ordinary tests passed. Four new cases first failed, then passed after CSS-only fault space reservation and nonshrinking footer children. Normal sizing, game clocks, saved state and all original assertions remain intact. |

No blocker was waived and no failed result was relabelled. Earlier final evidence with 161/109/62 passing tests is retained but does not verify the later CSS. Read-only footer probes were observations, not acceptance passes. Red evidence records four actual failures; focused green evidence records 14 passing cases. The new complete gate above applies to the corrected candidate.

Review records: review-initial/, review-interim/, review-final/, review-footer-selective/ and review-footer-final/. The pending-execution wording in frozen reports describes their original issuance; executable-closeout.md records the later completed gate. The task-local TypeScript helper failure from earlier implementation and all prior logs remain historical; no Harness policy was changed.

## Visual, resource and performance inspection

The final production Ticket08 screenshots and final development all-nine fixture were opened. The inspection manifest lists each exact path and observations, including normal layouts, graphics loss/failure, restored scene, saved collection, Boss/victory, native pause and all four fault-footer states at two sizes. These images are correlated with assertions; they are not continuous observation or full accessibility certification.

Graphics-unavailable states intentionally show no active scene and keep recovery messaging. Some native lost-context captures show a blank compositor surface; no successful texture rendering is claimed while the context is lost. The restored scene and explicit Resume are checked separately.

Measured browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36. GPU: ANGLE (Intel, Intel(R) UHD Graphics (0x0000A78B) Direct3D11 vs_5_0 ps_5_0, D3D11). Viewport 1366 x 768, DPR approximately 1.00. Recorded renderer sample: 349 observations, median 0.800 ms and p95 1.500 ms; 92 draw calls and 17,274 triangles in the recorded frame.

This measures local renderer CPU update/submission, not GPU completion, total app frame cost or a universal FPS guarantee. Samples can include static/paused frames. Initial native pause observation: Paused after a delayed frame. No elapsed play was simulated.. The delayed-frame guard was not disabled; initial decode/shader work may require explicit Resume.

Recorded fleet reset released 47/47 retired resources. Teardown recorded 162 releases with 0 still owned. These bounded object-owner measurements are not whole-process GPU memory measurements.

## Integrity and handback

Before documentation closeout, all 214 frozen files matched the final review payload; 159 protected predecessor files were unchanged. All 9 earlier content sources/artifacts and all 14 original/copied asset bytes retained their hashes. Official Ticket08 acceptance criteria and the four Tickets09-12 issues were unchanged. HEAD stayed at the original fixed point and the index was empty.

Documentation-only closeout records this report and moves the existing plan to docs/plans/completed/ui-components-fixed-camera-renderer.md. The closeout record lists permitted documentation updates and verifies that runtime, tests, packages and content still match the final reviewed payload. Moving the implementation plan does not grant user acceptance or open Ticket09.

To evaluate the new renderer, create a fresh Pilot/Run pinned to development-rendered-combat-ship-v1, earn the starter and launch normally. Existing Runs intentionally retain their prior HUD. No personal save was used for failure injection.

Formal accessibility, all-browser/native-hidden behavior, complete offline-service-worker delivery, final balance/public asset acceptance, currency settlement, Salvage Apply and public release are not claimed. **Final user acceptance Pending; Tickets09-12 ON HOLD.**
