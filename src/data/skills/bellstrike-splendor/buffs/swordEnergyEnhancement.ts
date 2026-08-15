import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The Nameless Sword martial talent the 28 May 2026 patch calls "Sword Qi
// Affinity DMG Bonus": "Increases the Affinity DMG of sword energy attacks
// against targets with Qi below 40% (including Exhausted targets) or in a state
// of Qi Imbalance, based on Max Physical Attack, up to 18.0% increase at 1500
// Max Physical Attack" (client localization, 2026-08-15).
//
// Carried at the cap, which any realistic build clears. The target condition is
// `phase !== "normal"`: the low-Qi window models the below-40% state, and Qi
// Imbalance drives the phase there on its own.
export const swordEnergyEnhancement = defineClassBuff({
  id: BUFF.swordEnergyEnhancement,
  name: "Sword Energy Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +18% against a low-Qi target",
  effects: (ctx) =>
    ctx.self.reachesEvent && ctx.phase !== "normal" ? [stat("affinityDamageBoost", 0.18)] : [],
})
