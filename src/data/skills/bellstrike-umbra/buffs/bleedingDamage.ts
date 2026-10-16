import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

const AFFINITY_DAMAGE_PER_STEP = 0.012
const AFFINITY_DAMAGE_STEP_ATTACK = 100
const AFFINITY_DAMAGE_CAP = 0.18

// In-game values as of 2026-10-15.
export const bellstrikeUmbraBleedingDamage = defineClassBuff({
  id: BUFF.bellstrikeUmbraBleedingDamage,
  name: "Damage Over Time",
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +1.2% per full 100 Max Physical Attack (max 18%)",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent) return []
    const steps = Math.floor(ctx.build.maxPhysAttack / AFFINITY_DAMAGE_STEP_ATTACK)
    return [
      stat("affinityDamageBoost", Math.min(AFFINITY_DAMAGE_CAP, AFFINITY_DAMAGE_PER_STEP * steps)),
    ]
  },
})
