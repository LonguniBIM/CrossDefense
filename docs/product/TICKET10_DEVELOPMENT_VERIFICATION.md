# Ticket10 Development Verification — Q15 Review

Date: 2026-11-25 (Asia/Bangkok)

> Subsequent user acceptance — 2026-11-25 (Asia/Ho_Chi_Minh): the user explicitly accepted Ticket10 and authorized stage/commit/push/merge of the completed product work. See [the acceptance record](TICKET10_ACCEPTANCE_20261125.md). Ticket11 is the requested new-session target and has not started here; Ticket12 remains ON HOLD. The evidence and Pending/no-publication statements below preserve the earlier engineering handback, before this later instruction. Deployment and suspended/refused operations remain excluded.

## Engineering handback disposition before user acceptance

**Ticket10: Implemented / Integrated verification PASS / ChatGPT tri-axis PASS, development-only. At this engineering checkpoint, user acceptance was Pending. Q15 was approved; Ticket09 remained Accepted; Tickets11–12 were ON HOLD.**

The applicable fresh ordered executable gate finished at **2026-11-25 16:00:44 Asia/Bangkok** (`2026-11-25T09:00:44.1994518Z`). The coordinator then audited every selected result and trace boundary, inspected the required saved images, checked source/build identity, and verified process cleanup. The failed and incomplete earlier attempts remain separate evidence below.

## Reviewed and tested identity

| Field | Value |
| --- | --- |
| Authorized repository | `D:\01_DCMvn\Workspace\CrossDefense` |
| Device | DESKTOP-DBD6QJO / `0bfdbd88-da2a-400d-b6cc-0951271002c5` |
| Original fixed point / comparison base / merge-base / HEAD | `fd945fae4916b8500245e74d75d65e331fb6ba43` |
| Branch / index | `tech-selection-poc` / empty |
| Reviewed and tested scope | 677 paths, held as transient path/digest metadata in remote memory |
| Candidate aggregate SHA256 | `e1e87f0682bac82357718253f4926071d129dfe3ecaae689deba3a5d166e7220` |
| FINAL-2 freeze / all-axis closing check | `2026-11-25T08:11:14.541Z` / `2026-11-25T08:42:05.322Z` |
| Post-production matching source check | `2026-11-25T09:01:57.558Z` |
| Fresh evidence root | `.scratch/ticket10-development/final2-gate-20261125-154223-131/` |

The original Git point is unchanged. The large pre-existing dirty worktree was preserved; this record does not attribute all of that work to Ticket10. The tested implementation identity is distinct from later status-documentation changes. No stage, commit, push, deployment or external publication occurred.

## Authority and delivered scope

The user approved Q15 as proposed and explicitly authorized Ticket10 development-only implementation. Ticket09 remains Accepted. Ticket10 user acceptance remains Pending, and Tickets11–12 remain ON HOLD. This engineering record does not grant acceptance or authorize deployment, publication, staging, commits, pushes, provider reviewers, credentials, suspended orchestration or WFP/G-R/G-P work.

The [approved Q15 contract](DEVELOPMENT_REVIEW_SHIP_V1.md) defines `development-review-ship-v1`, content schema 5, unchanged `development-combat-ruleset-v1`, `development-review-rules-v1` and `settled-outcome-immediate-due`. The entry is SHIP, noun, water-vessel. Only case and outer whitespace are normalized. A correct response completes the occurrence for 1 Credit; a correct unhinted first nonblank response adds 1 Credit. Wrong-first or assisted success receives completion only. Blank input, unsent typing, reveal-only and leaving do not earn a reward.

Delivered behavior includes optional Review after an acknowledged eligible result, due Review from safe Build, durable first/subsequent response and hint evidence, leave/reload continuation, stable Attempt links, reuse of unfinished evidence, exact pending Retry, current-state replay and atomic evidence/reward/economy publication. Abandonment and interruption create no new offer; existing due evidence remains available. Review income advances the existing Run economy boundary, so layout Undo cannot reverse learning or income.

The additive native save migration is v9. Existing player rows and content/Ruleset pins remain intact; schemas 1–4 do not borrow Review definitions from the active default. Q15 preserves the Q13 gameplay definitions and all fourteen Q14 assets. No SRS algorithm, delayed-practice interval, daily cap, additional vocabulary catalog, audio judgment, mastery claim, Blueprint or Celestium reward is introduced.

| Immutable input | SHA256 |
| --- | --- |
| Q15 canonical manifest payload | `1b496a087a3c9f576164c83653736dbd40f6d749eeea9adffa5cda3fc127b9b6` |
| Q15 compiled file | `d6904be23e0421b13a5276c473cdbb20124653f56f79cc42430273c13d9649cc` |
| Q14 compiled file, preserved | `37eca6c6af3ce199d28723b2ebde9e82c4524f08ce29e99778f4cd9b4f2e31ca` |

## Review history and finding disposition

Formal axes ran sequentially in fresh independent ChatGPT contexts. Each Code/Spec round was one pass with separate Standards and Spec judgments; bounded same-axis support did not constitute a dual formal pass. Candidate source, tests, content, configuration and authority remained frozen inside each round. Reviewers read the live worktree; no source snapshot, export, copied bundle or replacement on-disk inventory was created.

| Round | Frozen 677-path aggregate | Result and scope |
| --- | --- | --- |
| Initial full | `6085f09e21f5ea87baa45383d6e64774fecb3b0f1aeb4aef8cef66650ddf0dbd` | Code/Spec and Architecture identified the recovery defect; Code/Spec also identified the accessible-description issue. Security PASS. |
| Interim 1, full | `41bf2447c2fa6b9f2e39931e3e9f1a60ff24e5f8de9a19dde5c32fe70f01e618` | Recovery/accessibility corrections supported. Code/Spec found the legacy fixture routing defect; Architecture and Security PASS. |
| Interim 2, selective Code/Spec | `23a821a899d3bd3d1fec3d4b97a9677052fa7143229fefec7c7ef77fabf0325c` | Standards PASS / Spec PASS after matching three-case RED/GREEN. |
| First final full | `b9fc7021cdce81e9b9efff3058ab9b0562027e47520c23ac055a88c1558722d4` | All three static axes PASS; subsequent executable attempts below did not pass. |
| Interim 3, selective Code/Spec | `ccbe730cc6049b1ea685bd8054e16a324022f495593d8e14a34f8d74053f5021` | Standards PASS / Spec PASS for the demonstrated acknowledgment test race after focused GREEN. |
| Second final full, T10-FINAL-2 | `e1e87f0682bac82357718253f4926071d129dfe3ecaae689deba3a5d166e7220` | Standards PASS / Spec PASS; Architecture PASS; Security PASS. No new actionable findings. |

| Finding | Original classification | Correction and final disposition |
| --- | --- | --- |
| `T10-CS-SPEC-01` | Medium / BLOCKER | FIXED: Application-owned settled-unlinked reconciliation runs before Build, retains pending identity/content through Retry, and continues remaining recovery. |
| `ARCH-T10-I01` | P2 / BLOCKER | FIXED: the same recovery responsibility is at the accepted Application boundary, independently traced in final Architecture review. |
| `T10-CS-STD-01` | Low / NON_BLOCKING | FIXED: textbox description IDs exist and stale error text is cleared. |
| `T10-CS-STD-02` | Medium / BLOCKER | FIXED: browser fixtures use exact Q14/Q15 rendered identity via `hasRenderAssets`; the existing v8 migration case also continues to legacy Build with its old pin and no Review. |
| `T10-EXEC-ACK-01` | Coordinator-designated verification BLOCKER; no numeric severity invented | FIXED for test synchronization: the existing T07 case waits for positive saved receipt before reading collected count. No product durability repair is claimed. |

The retained Vite adjustment ignores only generated `**/.scratch/**` files. Source/public content remain watched. The rejected `watch: null` probe is not evidence of a disabled watcher. Temporary observation wrappers were restored; no product caching/storage optimization, relaxed timeout, assertion removal, skip or automatic retry was retained.

Batch 2 and batch 3 omitted additional selective Architecture/Security passes because their changes were confined to established test seams. The separate full final rounds still covered all three axes. Original severities and failed evidence were retained.

Final reports: [Code/Spec](../../.scratch/ticket10-development/reviews/final2-code-20261125.md), [Architecture](../../.scratch/ticket10-development/reviews/final2-architecture-20261125.md), [Security](../../.scratch/ticket10-development/reviews/final2-security-20261125.md). These are static verdicts. `T10-CS-FINAL2-INFO-01` and `ARCH-T10-F2-INFO-01` explicitly required the separate fresh executable evidence below. Earlier final-round INFO records remain historical; no old failed candidate is retroactively relabelled PASS.

## Preserved failed and focused executable evidence

Detailed chronology and causal limits are retained in [the execution diagnosis](../../.scratch/ticket10-development/development-gate-diagnosis-20261125.md) and the [completed plan](../plans/completed/ticket10-review-occurrence.md).

| Evidence directory under `.scratch/ticket10-development/` | Observed outcome | Disposition |
| --- | --- | --- |
| `final-gate-20261125-134320-767` | Typecheck PASS; 288 headless PASS; development 161/169, all 35 Ticket10 cases PASS | Failed gate. One native D3D11 texture allocation OOM was confirmed; seven readiness/navigation failures have no established common cause. Build/production were not executed. |
| `reconnected-diagnosis-20261125-143021-605` | Exactly the eight failed identities passed once with their existing budgets and zero retries | Controlled environment comparison after reconnection/resource-state change. It does not relabel the failed full gate or establish a shared cause. |
| `final-gate-reconnected-20261125-143250-061` | Typecheck and 288 headless PASS; browser execution stopped after ENOSPC; partial log 87 PASS / 19 FAIL through case 106; no final JSON | Incomplete, invalid gate. D: had 8,192 free bytes. Only the owned runner was stopped. Build/production were not executed. |
| `final-gate-storage-20261125-144452-660` | Typecheck and 288 headless PASS; development 168/169, all 35 Ticket10 and the original eight cases PASS | Failed gate due to the confirmed historical T07 acknowledgment test race. Build/production were not executed. |
| `acknowledgment-green-20261125-145925-836` | The exact failed T07 case passed once, retry 0, with the unchanged 30-second test and 5-second assertion budgets | Focused proof of the synchronization correction; not a full gate. Selected identity SHA256 `b0a9e203ab5ce72a3865e0d31c4c1c29fbae495b063ad8a72547796d953034a8`. |

In the T07 RED trace, Retry/Resume were already hidden while the UI still said that saving was pending and collected remained zero. The immediate DOM read returned zero; the later error-context artifact showed the saved receipt and three tiles. The added assertion waits for the existing `combat-receipt` acknowledgment. All original operation-count, exact-payload, clock, reload, Power and Salvage assertions remain. This is the first failed collection, so no stale successful marker can satisfy the wait.

The corrected T07 file SHA256 is `c1f409082be3ec79206381df0532ff85c0d0aa5a6d099dde457ee0cbe329ce39`. Removing only the added assertion in remote memory reproduces the old SHA256 `a0a0abc2bcb7879b1d642fe5d77464c582dbce86e2b306b3b939b279c1683ca8`. Every original title, location, assertion and budget is preserved. No exact late acknowledgment-render timestamp or product durability failure is inferred.

## Evidence placement and connection recovery

The confirmed ENOSPC failure was corrected by moving only two task-created runtime output directories to `C:\Users\Admin\AppData\Local\CrossDefenseTaskEvidence\Ticket10-20261125-144259-78d80ee5\`, with junctions preserving their original repository-relative paths. All 466 existing files retained their byte length and SHA256. Source, tests, configuration, authority and unrelated user files were not moved. New runtime runs use the same dedicated area and matching logical paths. Keep that evidence area with the project records.

A later RDC session reset occurred during FINAL-2 static review. OS preflight at 2026-11-25T08:24:24.293Z found the lost helpers absent and task ports clear; no normal exit status was invented for those lost sessions. The existing scope-selection rules were read statically from the historical operational verifier, without executing it. Transient path/digest metadata was restored in remote memory. All 677 paths reproduced the exact FINAL-2 aggregate at 08:29:28.951Z; subsequent axis boundaries also matched. No refused snapshot operation was retried, reconstructed or rerouted.

No complete PASS is assembled from partial runs. The fresh ordered execution below is the applicable final gate.


## Fresh complete ordered executable gate

Every stage below belongs to the same new run, in this order. No stage was substituted with an earlier pass.

| Stage | Started UTC | Finished UTC | RDC runner PID / exit | Result |
| --- | --- | --- | --- | --- |
| typecheck | 2026-11-25T08:42:23.1505769Z | 2026-11-25T08:42:23.8248682Z | 4700 / 0 | PASS |
| headless | 2026-11-25T08:42:53.5788564Z | 2026-11-25T08:43:17.4836157Z | 28092 / 0 | 288/288 in 34 files |
| development | 2026-11-25T08:43:49.8343325Z | 2026-11-25T08:52:38.6312293Z | 3216 / 0 | 169/169 in 31 files |
| build | 2026-11-25T08:53:35.3738333Z | 2026-11-25T08:53:36.3076465Z | 28284 / 0 | PASS; fresh dist |
| production | 2026-11-25T08:54:12.0620571Z | 2026-11-25T09:00:44.1994518Z | 5564 / 0 | 85/85 in 10 files |

Evidence is under `.scratch/ticket10-development/final2-gate-20261125-154223-131/`. Each stage has `run.log` and `stage-summary.json`; headless/development/production also have `results.json`, and each browser stage has `traces/`.

| Selection | Actual result | Exact selected-identity SHA256 |
| --- | --- | --- |
| Allowed headless | 288 passed, 0 failed, 0 pending; 34 files | `5fbdb60e6cd783cb68a96a3e9ef1fae6d40fc1a1a8661db6ffa1514de9b859e7` |
| Development browser | 169 expected, 0 unexpected/skipped/flaky; 31 files | `0764d0b4ceeaec01d42b30b83b645eead9c999b2bdf64985e77680a59da167fe` |
| Production browser | 85 expected, 0 unexpected/skipped/flaky; 10 files | `0f4cceca8c6cace2ebd95e6b01c4bc1ffaa20f9a652f6f9cc12f97e792ce841d` |

The 34-file headless selection hash is `6f3b7896c81e9ef637f62d494dc3bea68bb9b29bdc0004b3b05033d102ba487a`. Historical 218 headless, 134 development and 74 production identities were retained; their preservation had been checked during actual discovery, and this final run matches the established complete selections. Ticket10 contributes 70 headless cases (24 Domain, 23 Application, 23 content), 35 development cases (3 migration, 21 native persistence, 11 UI), and the same 11 UI cases in production.

Headless used one concurrent worker, with per-file isolation and unchanged cache/config-loader flags. Its console duration was 23.59 s. The displayed 34 workers spawned is the cumulative count of isolated file workers, not 34 concurrent workers. Development reporter duration was 528.109 s; production reporter duration was 391.454 s.

Both browser reports independently satisfy workers=1, retries=0 and repeatEach=1. Every expected spec/project identity has exactly one passed retry-0 result, the established runtime budget, no result error and one distinct existing nonempty trace. Reporter errors are empty. All 169+85 trace files passed local ZIP header, end-of-central-directory and central-directory-bound checks. These are structural checks, not a claim that every archived event or media decoder was independently replayed.

Commands were the existing `npm.cmd run typecheck`, the allowed explicit Vitest file selection with `--maxWorkers=1 --no-cache --no-fsModuleCache --configLoader=runner`, the isolated Ticket10 Playwright configuration with `--workers=1 --retries=0 --repeat-each=1 --reporter=list,json`, and `npm.cmd run build`. Production used the newly produced dist through the task preview server. No test assertion, timeout, retry policy or runtime heap profile was changed for this gate.

### Built artifact

The fresh build contains **9 files**, aggregate SHA256 `1cf93150215e56629f9e41717020c90e3d9ae28052ce8735b2b8bfdda74d03e7`. This identity was captured after build and remained exact after production execution. All **6** actual public manifests match their built copies byte for byte; their aggregate is `6a580c9a867dd41ddb976ef7346adb378e185816c58beec5d7816ed2c363edc2`.

Vite completed successfully and emitted a nonfatal chunk-size warning: the main JavaScript output is **1,104.41 kB minified / 297.23 kB gzip**, above the configured 500 kB warning threshold. This is retained as an observable build limitation. No warning threshold or bundle configuration was changed to suppress it; bundle optimization is not claimed by this ticket.

The new gate satisfies the required executable evidence for `T10-CS-FINAL2-INFO-01` and `ARCH-T10-F2-INFO-01`. It also verifies the corrected acknowledgment case in both development and production. This is a pass on the corrected FINAL-2 candidate, not a retrospective pass for earlier failed candidates.

## Actual visual inspection

The coordinator actually opened and inspected all nine final production Ticket10 PNGs below. Text, controls, feedback, balances and layouts are coherent and legible without visible overlap in these captures.

| Final production capture | Observed state |
| --- | --- |
| [review-offer.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-settled-victo-9e943-fore-a-first-correct-reward/review-offer.png) | Results shows 24 Credits / 1 Celestium, acknowledged settlement, enabled Review and Skip/Back controls, readable outcome/reward panels. |
| [review-independent-complete.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-settled-victo-9e943-fore-a-first-correct-reward/review-independent-complete.png) | Completed Review shows 26 Credits / 1 Celestium and 2 Credits saved, split into 1 completion Credit + 1 independent-response Credit; saved first response and Back control legible. |
| [review-assisted-1280.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-blank-typing--40379-ave-and-pay-completion-only/review-assisted-1280.png) | At 1280 × 720, unfinished Review shows 24 Credits, one saved SH IP wrong response, all three hints, empty focused answer and visible Leave/Submit; full-page capture extends vertically. |
| [review-assisted-1366.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-blank-typing--40379-ave-and-pay-completion-only/review-assisted-1366.png) | At 1366 × 768, the same unfinished assisted state is legible and consistently spaced, without visible overlap; full-page capture extends vertically. |
| [review-save-failed.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-failed-Review-de964-ies-the-identical-operation/review-save-failed.png) | Injected save error is readable, Retry is prominent, balance 24 and response count 0 retained; Leave/answer/hints disabled and no completion reward shown. |
| [review-recovery-retry.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-Build-Review--50d1a-e-exact-occurrence-identity/review-recovery-retry.png) | Readable Review recovery explanation and injected failure, prominent Retry preparation control, no overlap. No visual focus-ring claim is made. |
| [review-recovered-build.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-reload-after--6bdf9--Review-directly-from-Build/review-recovered-build.png) | Recovered Build shows enabled Due Review (1), retained 24 Credits / 1 Celestium, Cargo/Grid/Inspector and summaries coherently placed at 1366 × 768. |
| [review-pack-rendered-abandoned.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-Q15-actual-re-7903b-Attempts-without-new-offers/review-pack-rendered-abandoned.png) | Actual initial combat render: both ships, equipment, HUD and board visible at tick 0 before the later abandonment action. |
| [review-pack-rendered-interrupted.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/production/traces/ticket-10-ui-Q15-actual-re-7903b-Attempts-without-new-offers/review-pack-rendered-interrupted.png) | Actual initial combat render: coherent ships/equipment/HUD/board at tick 0 before the later reload/interruption action. |

The coordinator also inspected these two final development captures of the corrected T07 acknowledgment path:

| Final development capture | Observed state |
| --- | --- |
| [collection-save-failed.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/development/traces/ticket-07-ui-actual-keyboa-f724d-oad-with-unresolved-Salvage/collection-save-failed.png) | Visible Retry and injected-save error, no saved payload, 0/24 harvested, disabled Abandon, stopped clock projection; legible with no overlap at 1366 × 768. |
| [collection-saved.png](../../.scratch/ticket10-development/final2-gate-20261125-154223-131/development/traces/ticket-07-ui-actual-keyboa-f724d-oad-with-unresolved-Salvage/collection-saved.png) | Saved to Salvage receipt, 3/24 harvested, clocks advanced to 10, Retry absent and active combat controls; legible with no overlap at 1366 × 768. |

All these captures use full-page output. The assisted pair explicitly uses 1280 × 720 and 1366 × 768 viewports; full-page images may extend beyond viewport height. No claim is made that all Review content fits without vertical scrolling. The tests separately assert the assisted Leave/Submit controls are in the viewport and there is no horizontal document overflow.

The Review scenarios use prepared saved outcomes and content. The two rendered combat PNGs capture the initial live Q15 scene at the controlled frame boundary before the later abandonment or reload action; ending behavior and preservation of due evidence are established by the subsequent executable assertions. These are not unaided full-game playthrough screenshots. Pixel inspection supports layout and affordance observations; persistence identity, atomicity and once-only rewards are supported by the tests.

## Cleanup and practical limits

All five runners completed with exit 0. The isolated test ports were clear after the fresh build and again at `2026-11-25T09:03:50.2452033Z`. The latter OS check found no surviving observed owned descendants, matching both PID and process creation time to avoid PID-reuse mistakes. Unowned processes and the unrelated port 4175 server were left alone. Review helpers exited normally where confirmed; lost-session cleanup is qualified in the recovery section above. The coordinator's small metadata helper remains only until documentation checks complete, and its final exit is recorded in the closeout audit.

Endpoint evidence at cleanup: C: had 55,386,873,856 free bytes, D: had 2,433,998,848; committed memory was 22,121,058,304 / 29,221,576,704 bytes, with 3,809 MiB available and a paging sample of 7 pages input/s. These are endpoint samples, not a claim of a paging-free run or a performance benchmark.

The previous native graphics OOM is confirmed, but its upstream host/GPU/resource-lifetime cause is not established. The seven earlier readiness failures also have no single established cause. The final pass demonstrates the selected behavior under this run's conditions; it does not erase those observations or establish broad GPU performance guarantees.

This development fixture does not deliver full SRS, delayed recall, a broader vocabulary catalog, general hostile-media protection, cryptographic anti-cheat, production hosting, or Tickets11–12. User acceptance remains a separate decision.

## Documentation handback

Status updates were made directly in English, and the execution plan is moved to [completed](../plans/completed/ticket10-review-occurrence.md) after validation. The Ticket09 acceptance record preserves its earlier Pending-Q15 checkpoint, original hashes/counts and historical execution; a dated subsequent note records the later Ticket10 outcome.

Post-verification changes are limited to the approved status/verification documents and plan move. The final post-documentation identity, allowed-path comparison, UTF-8/link checks and metadata-helper cleanup are recorded in [the closeout audit](../../.scratch/ticket10-development/final2-closeout-audit-20261125.md). No source/test/content/configuration change is authorized by that documentation step, and no new execution is inferred from it.

**Engineering result: Ticket10 implemented and integrated verification PASS, development-only. User acceptance Pending; Tickets11–12 ON HOLD.**
