# Development Review SHIP v1 — approved Q15 contract

Date: 2026-11-25 (Asia/Bangkok)

## Authority and scope

The user explicitly approved Q15 as proposed and instructed Ticket10 implementation under the existing development-only authorization. This document records that approved fixture. [The completed execution plan](../plans/completed/ticket10-review-occurrence.md) records implementation and finding closure; [the verification record](TICKET10_DEVELOPMENT_VERIFICATION.md) records actual engineering evidence and limits. The user explicitly accepted Ticket10 on 2026-11-25 (Asia/Ho_Chi_Minh) and authorized stage, commit, push and merge of the completed product work; see [the acceptance record](TICKET10_ACCEPTANCE_20261125.md). Deployment and suspended operations remain unauthorized. Ticket11 is the next-session implementation target and has not started here; Ticket12 remains ON HOLD.

No new combat values, assets, Maps, audio, CEFR label, pronunciation judgment, mastery claim, daily cap or delayed-practice schedule is selected here.

## Immutable content identity

| Field | Value |
| --- | --- |
| Content version | `development-review-ship-v1` |
| Content schema | `5` |
| Combat Ruleset | `development-combat-ruleset-v1`, unchanged |
| Review definition version | `development-review-rules-v1` |
| Occurrence policy | `settled-outcome-immediate-due` |
| Authoring source | `content/authoring/development-review-ship-v1.json` |
| Compiled artifact | `public/content/packs/development-review-ship-v1/manifest.json` |
| Manifest payload SHA256 | `1b496a087a3c9f576164c83653736dbd40f6d749eeea9adffa5cda3fc127b9b6` |
| Compiled file SHA256 | `d6904be23e0421b13a5276c473cdbb20124653f56f79cc42430273c13d9649cc` |

The pack inherits the Q13 combat, Build, launch and Pre-Run definitions and the exact fourteen Q14 assets. Schema, content identity and the additive Review capability are the intended changes. Existing authored/compiled pack bytes remain unchanged. Renderer admission includes this exact reviewed manifest identity and retains asset metadata and decoded-byte validation.

## Learning Entry

| Field | Approved value |
| --- | --- |
| ID | `ship-noun-water-vessel-v1` |
| Spelling | `SHIP` |
| Part of speech | noun |
| Target sense | `water-vessel` |
| Initial prompt | A large boat that carries people or goods across water. Type the English word. |
| Accepted answers | `["SHIP"]` |
| Context hint | The ___ carries goods across the sea. |
| Letter hint | It starts with S and has four letters. |
| Full reveal | SHIP |

Matching removes outer whitespace and ignores case only. It does not remove internal spaces, correct spelling or use fuzzy similarity. A blank answer produces validation feedback without recording a submitted response. Unsubmitted typing is not an attempt. Retries are unlimited.

The initial meaning prompt is the question. Every requested context hint, letter hint or reveal is saved assistance. Combat spelling and a successful battle do not establish independent meaning recall.

## Reward policy

| Saved outcome for this occurrence | Completion Credits | Independent first-response Credits |
| --- | ---: | ---: |
| Correct first submitted nonblank response, without requested help | 1 | 1 |
| Wrong first response, then correct | 1 | 0 |
| Correct after any context hint, letter hint or full reveal | 1 | 0 |
| Wrong only, reveal only, skip or leave | 0 | 0 |
| Reopen or replay an already completed occurrence | 0 additional | 0 additional |

Review grants no Celestium or Blueprint. Completion evidence, the reward receipt, Pilot balance and Run economy revision must commit atomically. A retry retains its original operation identity; replay reads current saved state rather than restoring an earlier balance or layout. A reward ends the relevant Build undo history; Undo cannot reverse learning evidence or income.

## Occurrence and result identity

After an eligible victory or failed result is durably settled, its Attempt receives a permanent link to one Pilot/sense occurrence. An existing unfinished occurrence is reused; otherwise a new occurrence is created with `dueAt` equal to its saved creation WallClock time. Occurrence creation/reuse and its Attempt link commit together.

Every linked result keeps that link after completion. Reopening it cannot create another opportunity. A later previously unlinked eligible result may create a new occurrence after the earlier one is complete. Multiple results while one remains unfinished share that occurrence and preserve its first response and hint evidence.

Skip, leave and reload keep the same unfinished occurrence accessible as due Review from Build. Abandoned and interrupted results create no Review offer or occurrence. An already due occurrence remains reachable from safe Build. Optional Review and skip/leave must remain visible choices.

## Compatibility and verification boundary

New Pilots/Runs use the approved pack when it is activated. Older Runs retain their exact content and Ruleset pins; schema 1–4 remain supported. An older Run without Review capability never borrows definitions or rewards from the new active default. No Restart/Delete or automatic Run conversion is added.

Save schema v9 adds separate occurrence, Attempt-link, operation and reward stores. It preserves existing Pilots, Runs, outcomes, balances, Cargo and content pins; failed migration must roll back without resetting the Workspace.

The approved fixture proves immediate due access. It does not select an SRS algorithm, recurrence interval, delayed-recall threshold, catch-up queue or full vocabulary catalog. Engineering checks, review verdicts and their limits are recorded in [Ticket10 verification](TICKET10_DEVELOPMENT_VERIFICATION.md); explicit user acceptance is recorded separately in [the acceptance record](TICKET10_ACCEPTANCE_20261125.md).
