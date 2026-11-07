import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The Nameless Sword martial talent the 28 May 2026 patch calls "Sword Qi
// Affinity DMG Bonus": "Increases the Affinity DMG of sword energy attacks
// against targets with Qi below 40% (including Exhausted targets) or in a state
// of Qi Imbalance, based on Max Physical Attack, up to 18.0% increase at 1500
// Max Physical Attack" (in-game English text, 2026-08-15).
//
// Carried at the cap, which any realistic build clears.
export const swordEnergyEnhancement = defineClassBuff({
  id: BUFF.swordEnergyEnhancement,
  name: "Sword Energy Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +18% against a low-Qi target",
  effects: (ctx) =>
    ctx.self.reachesEvent && (ctx.target.qiFraction < 0.4 || ctx.status.isActive(BUFF.qiImbalance))
      ? [stat("affinityDamageBoost", 0.18)]
      : [],
})
