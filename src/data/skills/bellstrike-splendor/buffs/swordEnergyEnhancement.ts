import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The reference workbook's Sword Energy Enhancement row, which it applies to
// the sword energy attacks alone.
export const swordEnergyEnhancement = defineClassBuff({
  id: BUFF.swordEnergyEnhancement,
  name: "Sword Energy Enhancement",
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +18%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("affinityDamageBoost", 0.18)] : []),
})
