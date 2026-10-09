import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"
import { meterMaxParamKey, meterStatusId } from "../../../../definitions/resources/meterDef"
import { enduranceMeter } from "../../../resources/enduranceMeter"

const ENDURANCE_STATUS_ID = meterStatusId(enduranceMeter.id)
const ENDURANCE_MAX_PARAM = meterMaxParamKey(enduranceMeter.id)

// The Nameless Spear talent's `endlessGale` carries the other half of: "When
// you have Endless Gale or Endurance is below 60%, increases Affinity DMG
// based on Affinity Rate, up to an 18% increase at 30% Affinity Rate"
// (in-game talent panel, 2026-08-15). One bonus behind two conditions, so it
// yields nothing while the Endless Gale window is already paying it — both at
// once would double it.
export const belowSixtyEndurance = defineClassBuff({
  id: BUFF.belowSixtyEndurance,
  name: "Below 60% Endurance",
  affectsAll: true,
  reachesDotTicks: false,
  alwaysActive: true,
  duration: 9999,
  summary: "affinityDmg +18%, except while Endless Gale already grants it",
  effects: (ctx) =>
    ctx.status.isActive(BUFF.endlessGale) ||
    ctx.status.isActive(BUFF.endlessGaleAtStart) ||
    ctx.status.stacks(ENDURANCE_STATUS_ID) >= 0.6 * ctx.build.paramValue(ENDURANCE_MAX_PARAM)
      ? []
      : [stat("affinityDamageBoost", 0.18)],
})
