import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { STATUS } from "../bamboocut-draught/ids"

// While Clash-toast runs and the current Martial Art is Skystrike Gauntlets
// or Riven Twinblades, +20% on any damage dealt — not the path's own skills
// alone, hence affectsAll (in-game ultimate text, 2026-09-06).
export const clashToastDamage = defineBuff({
  id: BUFF.clashToastDamage,
  name: "Inebriate - Clash-toast",
  requires: { classId: "bamboocutDraught" },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +20% on every skill while Clash-toast is up",
  effects: (ctx) =>
    ctx.self.reachesEvent && ctx.status.isActive(STATUS.clashToast) ? [stat("allDamageBoost", 0.2)] : [],
})
