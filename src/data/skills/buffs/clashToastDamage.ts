import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { STATUS } from "../bamboocut-draught/ids"

// +20% damage dealt with either of the path's arts while Clash-toast runs,
// from ultimate rank 3 (client skill descriptions 30618-30620, 2026-09-04).
export const clashToastDamage = defineBuff({
  id: BUFF.clashToastDamage,
  name: "Inebriate - Clash-toast",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +20% on the path's skills while Clash-toast is up",
  effects: (ctx) =>
    ctx.self.reachesEvent && ctx.status.isActive(STATUS.clashToast) ? [stat("allDamageBoost", 0.2)] : [],
})
