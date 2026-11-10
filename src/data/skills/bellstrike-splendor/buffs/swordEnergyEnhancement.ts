import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

const MAX_PHYS_ATTACK_STEP = 100
const AFFINITY_DAMAGE_PER_STEP = 0.012
const AFFINITY_DAMAGE_CAP = 0.18

// The Nameless Sword martial talent the 28 May 2026 patch calls "Sword Qi
// Affinity DMG Bonus": "Increases the Affinity DMG of sword energy attacks
// against targets with Qi below 40% (including Exhausted targets) or in a state
// of Qi Imbalance, based on Max Physical Attack, up to 18.0% increase at 1500
// Max Physical Attack" (in-game English text, 2026-08-15).
export const swordEnergyEnhancement = defineClassBuff({
  id: BUFF.swordEnergyEnhancement,
  name: "Sword Energy Enhancement",
  alwaysActive: true,
  readsLiveMaxPhysAttack: true,
  duration: 9999,
  summary: "affinityDmg +1.2% per full 100 Max Physical Attack (max 18%) against a low-Qi target",
  effects: (ctx) =>
    ctx.self.reachesEvent && (ctx.target.qiFraction < 0.4 || ctx.status.isActive(BUFF.qiImbalance))
      ? [
          stat(
            "affinityDamageBoost",
            Math.min(
              AFFINITY_DAMAGE_CAP,
              Math.floor(ctx.build.maxPhysAttack / MAX_PHYS_ATTACK_STEP) * AFFINITY_DAMAGE_PER_STEP,
            ),
          ),
        ]
      : [],
})
