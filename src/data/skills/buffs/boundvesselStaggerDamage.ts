import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

// "+20% damage against staggered targets", read as the Qi-break window
// (client locale text, 2026-09-04).
export const boundvesselStaggerDamage = defineBuff({
  id: BUFF.boundvesselStaggerDamage,
  name: "Boundvessel - Stagger",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +20% on the receiving skill while the target is in the Qi-break window",
  effects: (ctx) => (ctx.self.reachesEvent && ctx.phase === "exhausted" ? [stat("allDamageBoost", 0.2)] : []),
})
