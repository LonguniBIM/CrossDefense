# Combat Timing And Cooldowns

Status: Q290-Q298 approved on 2026-09-30. The cooldown decision frontier is closed. Numerical values are experiment starting points, not final balance; production specification/ticket gates remain.

## Authority
Read with [MVP_SPEC.md](MVP_SPEC.md), [UX_UI_DESIGN.md](UX_UI_DESIGN.md), and [the simulation ADR](../adr/0003-deterministic-fixed-step-simulation.md). Auto-battle remains automatic. Cooldowns govern actual domain effects; the renderer observes their state and events.

## Subtype Timing (Q290)
| Subtype | Approved behavior | Initial experiment timing |
| --- | --- | --- |
| Ballistic | Discrete shots with recovery between shots. | 0.8 seconds between shots. |
| Missile | Discrete launches with a longer recovery and burst-oriented output. | 3 seconds between launches. |
| Laser | A bounded damaging active window followed by recovery. | Active for 0.6 seconds, then recover for 1.8 seconds; full cycle 2.4 seconds. |
| Armor | Passive Hull damage mitigation. | No cooldown or periodic shutdown. |
| Shield | Remaining Shield absorbs damage; regeneration waits after damage and then occurs in pulses. | Wait for 3 damage-free seconds, then regenerate at 1-second intervals; subsequent damage restarts the delay. |
| System | Passive Anti-Missile Rating under the existing damage order. | No active interception ability introduced. |
| Engine | Passive deterministic mitigation Rating. | No active dodge/boost ability introduced. |
| Power | Stable Power generation under the Build Power Budget. | No cycling power supply, battery, or recharge mechanic introduced. |
| Support | Periodic Hull repair, capped at maximum Hull. | One repair pulse per 3 seconds. |

Shield Recharge Delay applies to regeneration, not to the availability of remaining Shield points. Laser cannot apply damage outside its active window. Armor/System/Engine retain existing diminishing-return mitigation semantics.

## Ownership And Clock (Q291)
- Each equipped Weapon Tile and Support Tile owns its own activation timer; equipping two identical weapons does not halve one weapon's cooldown.
- Shield is one ship-wide pool with one shared recharge delay; Shield Tiles contribute capacity and regeneration amount.
- A weapon without a target can remain Ready, but cannot bank multiple attacks. Support cannot bank multiple repair pulses while Hull is full.
- All timers use the authoritative Simulation Clock. Pause, focus loss, hidden-tab suspension, Resume countdown, and durability barriers do not advance Combat time.
- Changing targets does not reset cooldown. A new Map Attempt initializes its timers; weapons begin Ready; see Q294 below.
- No exact interrupted-Combat resume is added. Existing recovery returns to Build.

## Scaling And Balance (Q292)
- Word multipliers and Technology improve effect magnitude, not cooldown or active-window duration in the MVP.
- Keep existing subtype-specific magnitude rules, including consumers' unchanged Power demand.
- Compare weapon balance using total cycle damage divided by full cycle duration. Laser's active-window damage must be evaluated against its complete 2.4-second cycle.
- Existing Level-1 effect placeholders are not implicitly reinterpreted as damage per shot. Q298 below supplies their explicit experimental units and magnitudes.
- Numerical timing changes remain versioned Ruleset tuning inputs rather than renderer constants.

## UI Contract (Q293)
| Surface | Required information |
| --- | --- |
| Build Inspector | Icon plus subtype; Passive or activity/recovery timing; damage per activation and estimated average DPS where applicable. |
| Combat module | Compact progress bar or outline that does not obscure the module identity or letter. |
| Selected module | Ready, Firing, Cooldown, or Waiting for target as applicable, with remaining time. |
| Shield HUD | Current Shield amount separately from Recharge delayed or Recharging. |
| Reduced Motion | Text/state and progress feedback without decorative flashing or motion. |

Do not show a numeric countdown over every module at once. Passive modules must not display a fake cooldown.

Presentation override, 2026-10-01: the latest accepted layout removes the redundant Combat module strip and its selected-module detail row. The Selected module surface in the table above is historical and does not require reintroducing that row. Preserve the timing information in the Build Inspector and factual compact ship/HUD feedback; subtype timing rules are unchanged.

## Approved Timing Boundaries (Q294-Q298)

- Q294: weapons start Ready and may fire together when a valid target exists; each then follows its own timer with no random visual staggering. Support starts its 3-second wait when Hull becomes deficient, repairs periodically, and stops/reset its cycle when Hull becomes full. A later injury starts a new 3-second wait. No banked uses.
- Q295: Ballistic impacts 0.1 seconds after firing; Missile impacts 0.4 seconds after launch. Their cooldown begins at firing, not impact. Laser distributes its cycle damage over the 0.6-second active window. Impact timing is simulation-owned and independent of rendered distance/physics. A projectile whose target is destroyed does not retarget. Laser stops damaging a lost target and retains the original next-activation deadline.
- Q296: only actual positive Shield or Hull loss resets Shield Recharge Delay; fully mitigated damage does not. First regeneration is exactly 3 seconds after the last damaging hit, then every 1 second. No banked regeneration at full Shield. A damaging hit on a regeneration tick takes priority and cancels that pulse.
- Q297: resolve due hits from both sides, then terminal conditions, then repair/regeneration for surviving ships if the Attempt remains active. Support cannot revive Hull at zero. Mutual destruction is a Hull-destruction failure.
- Q298: per Level-1 tile before word bonuses and mitigation, use the experimental magnitudes below. Retain Missile Armor penetration and Laser Shield effectiveness. These are starting tuning values, not final balance.

| Subtype | Experimental amount per activation | Nominal sustained rate |
| --- | --- | --- |
| Ballistic | 8 damage every 0.8 seconds | 10 damage/second |
| Missile | 36 damage every 3 seconds | 12 damage/second |
| Laser | 21.6 damage across a 0.6-second active window; 2.4-second full cycle | 9 damage/second |
| Shield | 2 Shield per 1-second regeneration pulse after the delay | 2 Shield/second while regenerating |
| Support | 3 Hull per 3-second repair pulse | 1 Hull/second while repairing |

The cooldown decision frontier is closed by the user's acceptance of Q294-Q298 on 2026-09-30. Prototype visual review and final balance remain open.

## Prototype Boundary
The original fixed-camera renderer benchmark predates these decisions. The isolated [Build/Combat interaction study](../../prototypes/fixed-camera-renderer/review/README.md) now demonstrates Q287-Q298; its focused [results](../../prototypes/fixed-camera-renderer/review/RESULTS.md) are separate from production correctness and balance. Q294-Q298 now settle the timing boundaries for the isolated Build/Combat prototype; retain the production specification and ticket approval gates.
