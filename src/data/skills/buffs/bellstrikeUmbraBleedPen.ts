import { defineBuff } from "./define"
import { BUFF, PARAM } from "./ids"
import { ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"
import { matchesScope } from "../../../engine/scope"

const AFFECTS = [ROLE.bleedTick, ROLE.bleedDetonation]

export const bellstrikeUmbraBleedPen = defineBuff({
  id: BUFF.bellstrikeUmbraBleedPen,
  name: "Bleed penetration Enhancement",
  specs: ["bellstrike_umbra"],
  requires: { param: PARAM.swordHorizon },
  affects: AFFECTS,
  triggeredBy: [],
  alwaysActive: true,
  duration: 9999,
  // The pre-conversion `BuffDef` rendered these as points (`physPen 15`), not
  // the app's internal fraction — pin the Skill Editor text to that unit.
  summary: "physPen +15, bellstrikePen +15",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage" || !matchesScope(ctx.event.tags, { affects: AFFECTS })) return []
    return [stat("phys.penetration", 0.15), stat("bellstrike.penetration", 0.15)]
  },
})
