import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { artBonus, stat, type Effect } from "../../../engine/effects/effect"
import { swallowcall } from "../../sets/swallowcall"

// "Light Attacks and effects triggered by Light Attacks (e.g., rodents) deal
// 12% more HP damage, and deal 6% more Physical and Bamboocut damage to
// targets with below 40% Qi or suffering from a Qi Anomaly status (including
// Bone Corrosion and Qi Imbalance)." (in-game set tooltip, 2026-09-24.) Reach
// is the skills that declare this in their own `receives`. Bone Corrosion
// belongs to an inner way no build offers, so only the Qi and Qi Imbalance
// arms are reachable.
export const swallowcallLightAttackBoost = defineBuff({
  id: BUFF.swallowcallLightAttackBoost,
  name: "Swallowcall",
  requires: { set: swallowcall.siteKey },
  alwaysActive: true,
  duration: 9999,
  summary:
    "allDamageBoost +12% (Light Attack hits only), +6% physical/attribute attack below 40% target Qi or Qi Imbalance",
  effects: (ctx) => {
    const effects: Effect[] = [stat("allDamageBoost", 0.12)]
    if (ctx.target.qiFraction < 0.4 || ctx.status.isActive(BUFF.qiImbalance)) {
      effects.push(
        artBonus("minPhysPctBonus", 0.06),
        artBonus("maxPhysPctBonus", 0.06),
        artBonus("attributeAttackPctBonus", 0.06),
      )
    }
    return effects
  },
})
