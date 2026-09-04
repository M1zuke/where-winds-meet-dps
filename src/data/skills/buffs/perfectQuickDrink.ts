import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

// A Perfect Quick Drink enhances Falcon's Pursuit (client locale text); the
// magnitude is the workbook's ×1.6 special factor (v2.0 column 30,
// 2026-08-28), provisional until the client states one.
export const perfectQuickDrink = defineBuff({
  id: BUFF.perfectQuickDrink,
  name: "Perfect Quick Drink",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +60% on Whaledraft's falcon",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("allDamageBoost", 0.6)] : []),
})
