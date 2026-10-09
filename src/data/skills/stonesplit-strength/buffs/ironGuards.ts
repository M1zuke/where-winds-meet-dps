import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

const PENETRATION_STEP_ATTACK = 62.5
const PENETRATION_CAP = 12

function penetration(maxPhysAttack: number): number {
  return Math.min(PENETRATION_CAP, Math.floor(maxPhysAttack / PENETRATION_STEP_ATTACK)) / 100
}

const hasSteadfastDevotion = (paramTier: (id: string) => number) =>
  paramTier(PARAM.steadfastDevotion) >= 1

export const ironGuards = defineClassBuff({
  id: BUFF.ironGuards,
  name: "Iron Guards",
  affectsAll: true,
  duration: (ctx) => (hasSteadfastDevotion(ctx.build.paramTier) ? 40 : 30),
  cooldown: (ctx) => (hasSteadfastDevotion(ctx.build.paramTier) ? 1 : 20),
  summary:
    "allDamageBoost +8%, physPen/stonesplitPen +1 per full 62.5 Max Physical Attack (cap 12)",
  effects: (ctx) => {
    const penetrationFraction = penetration(ctx.build.maxPhysAttack)
    return [
      stat("allDamageBoost", 0.08),
      stat("phys.penetration", penetrationFraction),
      stat("stonesplit.penetration", penetrationFraction),
    ]
  },
})
