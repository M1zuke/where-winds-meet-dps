import type { Inputs } from "../types"
import type { BuffParams } from "./buffEngine"
import { APP_SET_TO_SITE_SET, SITE_PARAM_TO_INNER_WAY, zhongToTier } from "./paramMap"
import { slotInnerWayId } from "../../data/classes/innerWays"

export function paramsFromInputs(inputs: Inputs): BuffParams {
  const params: BuffParams = { isTrainingDummy: !!inputs.dummyMode }

  const armorSetKey = inputs.set ? APP_SET_TO_SITE_SET[inputs.set] : undefined
  if (armorSetKey) {
    params.armorSet = armorSetKey
    if (armorSetKey === "starsAlign") params.starsAlignActive = true
  }

  const tierByInnerWayId = new Map<string, number>()
  for (const slot of inputs.mindMethods) {
    const innerWayId = slotInnerWayId(slot)
    if (innerWayId) tierByInnerWayId.set(innerWayId, zhongToTier(slot.stacks))
  }
  for (const [param, mapping] of Object.entries(SITE_PARAM_TO_INNER_WAY)) {
    if (tierByInnerWayId.has(mapping.innerWayId)) {
      params[param] = true
      params[param + "Tier"] = tierByInnerWayId.get(mapping.innerWayId)!
    }
  }

  const qiBreak = inputs.combatSettings?.qiBreak
  const breakExtensionBonus = inputs.combatSettings?.breakExtension ? 12 : 0
  if (
    qiBreak &&
    (qiBreak.startSec !== 25 || qiBreak.durationSec !== 10 || breakExtensionBonus !== 0)
  ) {
    params.qiBreakTime = qiBreak.startSec
    params.bossBreakDuration = qiBreak.durationSec + breakExtensionBonus
  }

  if (inputs.combatSettings?.dragonHeadFullStacks) params.allySurgingWaves = true
  if (inputs.combatSettings?.dragonHeadLowHpMaxBonus) params.dragonHeadLowHpMaxBonus = true

  if (inputs.buffParams) Object.assign(params, inputs.buffParams)

  return params
}
