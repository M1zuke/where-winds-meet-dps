import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// Tier 1 adds 3 Physical Penetration in the damage calculation, tier 4 raises
// it to 6 of every type, and tier 6 adds a further 6 of every type while
// Inebriate. Penetration is a character stat rather than a per-skill bonus, so
// every rung reaches every skill the class casts — hence affectsAll.
export const mistwingPhysicalPenetration = defineBuff({
  id: BUFF.mistwingPhysicalPenetration,
  name: "Mistwing T1 (Physical Penetration)",
  requires: { param: PARAM.mistwing, minTier: 1 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +3",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("phys.penetration", 0.03)] : []),
})

export const mistwingAllTypePenetration = defineBuff({
  id: BUFF.mistwingAllTypePenetration,
  name: "Mistwing T4 (All-Type Penetration)",
  requires: { param: PARAM.mistwing, minTier: 4 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +3, bamboocut.penetration +6",
  effects: (ctx) =>
    ctx.self.reachesEvent
      ? [stat("phys.penetration", 0.03), stat("bamboocut.penetration", 0.06)]
      : [],
})

export const mistwingInebriatePenetration = defineBuff({
  id: BUFF.mistwingInebriatePenetration,
  name: "Mistwing T6 (Inebriate Penetration)",
  requires: { param: PARAM.mistwing, minTier: 6 },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "phys.penetration +6, bamboocut.penetration +6 while Inebriate",
  effects: (ctx) =>
    ctx.self.reachesEvent && isInebriate(ctx)
      ? [stat("phys.penetration", 0.06), stat("bamboocut.penetration", 0.06)]
      : [],
})
