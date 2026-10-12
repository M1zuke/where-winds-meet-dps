import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { echo } from "../../../../engine/effects/effect"
import { BUFF, PARAM } from "../../buffs/ids"
import {
  SOULBREAK_PAYOUT_FIVE_PERCENT_MIN_TIER,
  SOULBREAK_PAYOUT_TEN_PERCENT_MIN_TIER,
} from "../debuffs"
import { DEBUFF } from "../ids"

export const soulbreakPayoutFeed = defineClassBuff({
  id: BUFF.soulbreakPayoutFeed,
  name: "Soulbreak End Damage",
  requires: { param: PARAM.towlineSweep, minTier: SOULBREAK_PAYOUT_FIVE_PERCENT_MIN_TIER },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "feeds the Soulbreak end-damage echo: 5% of every hit, 10% at rank 6",
  effects: (ctx) => {
    const marker =
      ctx.build.paramTier(PARAM.towlineSweep) >= SOULBREAK_PAYOUT_TEN_PERCENT_MIN_TIER
        ? DEBUFF.soulbreakPayoutTenPercent
        : DEBUFF.soulbreakPayoutFivePercent
    return ctx.status.isActive(marker) ? [echo(marker)] : []
  },
})
