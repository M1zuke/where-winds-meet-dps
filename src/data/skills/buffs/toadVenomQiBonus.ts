import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { ROLE } from "../ids"
import { stat } from "../../../engine/effects/effect"

// In-game values as of 2026-09-25: Leaping Toad (level >= 41) raises Toad
// Venom's own explosion Qi damage by 30%, for every class that casts it.
export const toadVenomQiBonus = defineBuff({
  id: BUFF.toadVenomQiBonus,
  name: "Toad Venom - Qi Bonus",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "Toad Venom explosion: qiDamageBoost +30%",
  effects: (ctx) =>
    ctx.event.kind === "damage" && ctx.event.tags.has(ROLE.toadVenom) ? [stat("qiDamageBoost", 0.3)] : [],
})
