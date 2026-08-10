import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

const AFFECTS = [ROLE.bleedTick, ROLE.bleedDetonation, ROLE.combustion, ROLE.fireOil, ROLE.fivefoldBleed]

export const bellstrikeUmbraBleedingDamage = defineBuff({
  id: BUFF.bellstrikeUmbraBleedingDamage,
  name: "Damage Over Time",
  specs: ["bellstrike_umbra"],
  requires: { param: PARAM.swordHorizon },
  affects: AFFECTS,
  triggeredBy: [],
  alwaysActive: true,
  duration: 9999,
  // The pre-conversion `BuffDef` rendered this as a percent under its old
  // key name, not the app's internal fraction — pin the Skill Editor text
  // to that exact string.
  summary: "affinityDmg +18%",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS })) return []
    return [stat("affinityDamageBoost", 0.18)]
  },
})
