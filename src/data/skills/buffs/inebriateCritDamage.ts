import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { STATUS } from "../bamboocut-draught/ids"

// A character stat rather than a per-skill bonus, so it reaches every skill
// the class casts, mystic arts included — hence affectsAll.
export const inebriateCritDamage = defineBuff({
  id: BUFF.inebriateCritDamage,
  name: "Inebriate Critical Damage",
  requires: { classId: "bamboocutDraught" },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDamageBoost +5% at 100+ Binge Points, +10% during Deepdaze",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent) return []
    if (ctx.status.isActive(STATUS.inebriateDeepdaze)) return [stat("critDamageBoost", 0.1)]
    if (ctx.status.stacks(STATUS.bingePoints) >= 100) return [stat("critDamageBoost", 0.05)]
    return []
  },
})
