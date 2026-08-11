// Sword Horizon's Zenith Bar: one 0-5 charge counter, in two projections —
// a `Buff` gate record the timeline ledger tracks and shows as a chip, and a
// `BuffModule` the Skill Editor's Receives / Class Buffs columns read for its
// `affects`/`effects` pair. Sharing `ZENITH_BAR_BUFF_ID` between the two is
// what makes them one entity rather than a duplicate that merely agrees: the
// two id spaces never collide (`catalogBuffDefs` keys defs, the ledger keys
// statuses), and `castBuffs.ts` dedupes chips by id, which is the behaviour
// you would want if the def ever did produce a chip. `zenithBar` is
// deliberately never seeded and never `alwaysActive` — `BuffEngine` must not
// apply it, because the crosswind behaviour (`swordHorizonCrosswind.ts`)
// applies the +15% itself, on exactly the detonations it fires on.
//
// Hazard: `hiddenTimelineBuffIds()` (built from the `alwaysActive` subset of
// a class's OWN `classBuffDefs`) is used as `hiddenBuffIds` in the rotation
// editor. `zenithBar` lives on Sword Horizon's `buffDefs`, which never feeds
// that helper — but if it were ever marked `alwaysActive`, or moved onto a
// class's own `classBuffDefs` and marked `alwaysActive` there, the shared id
// would hide the Zenith Bar timeline chip. It must stay off both.
import type { InnerWayGateBuff } from "../../definitions/innerWays/innerWayDef"
import { defineClassBuff } from "../../definitions/skills/buffDef"
import { PARAM } from "../skills/buffs/ids"
import { ROLE } from "../skills/ids"
import { stat } from "../../engine/effects/effect"

// Persisted inside saved custom skills (hit-variant/trigger conditions) and
// saved rotations (`permanentBuffIds`) — the `bellstrikeUmbra` substring is a
// frozen historical artifact from when these were declared by the class, and
// must not be "corrected" now that the inner way owns them.
export const ZENITH_BAR_BUFF_ID = "buff-bellstrikeUmbra-zenith-bar"
export const ZENITH_DETONATION_BUFF_ID = "buff-bellstrikeUmbra-zenith-detonation"

export const ZENITH_DETONATION_FRAMES = 1
export const ZENITH_SMOLDER_EXTEND_FRAMES = 600

// User-verified 2026-08-07: a Zenith detonation always adds its full extend
// amount, but the resulting REMAINING duration (from that detonation's own
// frame, re-evaluated per detonation — not a lifetime cap on the window)
// never exceeds 16 s. If the window is already longer than that, the
// detonation must leave it alone — never truncate it down to the cap.
// Sword Horizon logic, not specific to any one debuff it extends (Smolder,
// Bitter Season's poison, …).
export const ZENITH_MAX_EXTENDED_DURATION_FRAMES = 960

export const ZENITH_BAR_MAX_CHARGES = 5
export const ZENITH_BAR_DAMAGE_BONUS = 0.15

export const SWORD_HORIZON_GATES: readonly InnerWayGateBuff[] = [
  {
    id: ZENITH_BAR_BUFF_ID,
    name: "Zenith Bar",
    scope: "player",
    activation: "permanent",
    durationFrames: 0,
    effects: [],
    maxStacks: ZENITH_BAR_MAX_CHARGES,
    stackScaling: "flat",
    createdAt: "2026-07-31T00:00:00.000Z",
    updatedAt: "2026-07-31T00:00:00.000Z",
  },
  {
    id: ZENITH_DETONATION_BUFF_ID,
    name: "Zenith Detonation",
    scope: "player",
    activation: "triggered",
    durationFrames: ZENITH_DETONATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z",
  },
]

export const zenithBar = defineClassBuff({
  id: ZENITH_BAR_BUFF_ID,
  name: "Zenith Bar",
  requires: { param: PARAM.swordHorizon },
  affects: [ROLE.bleedDetonation],
  triggeredBy: [],
  duration: 999,
  effects: [stat("allDamageBoost", ZENITH_BAR_DAMAGE_BONUS)],
})
