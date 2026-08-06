# Dragon Head / Dragon Head - Plus

Special-logic notes for the universal single-target burst mystic art. Both
versions ship as built-ins in every class folder; the skill JSONs are the
source of truth for all numbers — this file carries only what they can't.

## Sources

- Official names and the Plus's mechanics text (fixed→crit trade, Surging
  Waves): `reference/locale/zhToEnOfficial.json`.
- Base version deals fixed damage — cannot trigger crit, affinity, or
  abrasion: CN mystic-arts guide corroboration (gc.com.cn, checked 2026-08).
- Cast timing (246-frame cast, hit on the final frame): user-verified
  2026-08-06.

## Coefficient provenance

The lvl-110 workbook tabulates a single Dragon Head row, named
"(32 stacks +50%HP)" and with its "Guaranteed Precision" column set — that is
the **Plus** (25.200406 phys / 4695.46 flat / 37.800609 attr). Dividing by 0.7
(the Plus "reduces base damage by 30 %") recovers the clean base row
(36.00058 / 6707.8 / 54.00087); the ratio is asserted in
`tests/engine/dragonHead.test.ts`. The row's 0.57 universal damage boost is
that scenario's stack/HP state and is deliberately **not** baked into the
skill — the stack mechanic is modeled live instead (below).

## How the mechanics map

- Base uses `guaranteedNormal` (fixed damage), Plus uses `guaranteedPrecision`
  (never abrades) — both generic `Skill` flags, documented in TIMELINE.md § 2.
- Surging Waves is a global buff def (`buffs/surgingWaves.json`). The buff
  engine applies it at cast start, so the granting cast's own hit — landing at
  the end of the channel — is boosted; that is what matches the in-game
  "increases the damage of the **current** Dragon Head".

## Not modeled

- The Plus's doubled damage against a non-player target without Qi / with
  depleted Qi — the simulation has no target-Qi state on the hit path.
- Ally-contributed Surging Waves stacks (up to 10 per ally on top of the
  self-granted 8) — the simulation is solo.
