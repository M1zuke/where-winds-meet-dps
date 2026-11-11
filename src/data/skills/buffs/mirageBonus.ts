import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-11-10: the damage boost is +15% to HP damage and
// +15% to Qi damage alike.
export const mirageBonus = defineBuff({
  id: BUFF.mirageBonus,
  name: "Mirage Bonus",
  affectsAll: true,
  duration: 8,
  requiresBuffActive: BUFF.mirage,
  effects: [stat("allDamageBoost", 0.15), stat("qiDamageBoost", 0.15)],
})
