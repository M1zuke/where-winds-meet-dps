import { defaultCombatSettings, type Inputs, type QiBreakWindow } from "../types"
import type { BuffParams } from "./buffEngine"
import type { QiPhase } from "../effects/context"
import { PARAM } from "../../data/skills/buffs/ids"
import { INNER_WAYS, slotInnerWayId } from "../../definitions/innerWays/registry"
import { tierFromStacks } from "../../definitions/innerWays/innerWayDef"
import { SET_BY_ID } from "../../definitions/sets/registry"
import { getBreakthrough } from "../../definitions/baseStats/breakthroughs"
import { specForClass } from "./data"
import { DEFAULT_QI_BREAK_WINDOW, resolveQiBreakWindow, sameQiBreakWindow } from "../qiBreak"

export { paramOnOf, paramTierOf } from "./paramTier"

function tierKey(param: string): string {
  return param + "Tier"
}

export function clockQiPhase(params: BuffParams, timeSec: number): QiPhase {
  const qiBreakTime = (params.qiBreakTime as number) ?? 25
  const belowQiTime = (params.belowQiTime as number) ?? qiBreakTime
  const bossBreakDuration = (params.bossBreakDuration as number) ?? 10
  const healerExtension = (params.healerBreakExtension as number) ?? 0
  const breakEnd = qiBreakTime + bossBreakDuration + healerExtension
  if (timeSec >= qiBreakTime && timeSec < breakEnd) return "exhausted"
  if (timeSec >= belowQiTime && timeSec < qiBreakTime) return "below30"
  return "normal"
}

export function paramsFromInputs(inputs: Inputs, rotationQiBreak?: QiBreakWindow): BuffParams {
  const qiBreak = resolveQiBreakWindow(inputs.combatSettings, rotationQiBreak)
  const params: BuffParams = {
    isTrainingDummy: !!inputs.dummyMode,
    classId: inputs.classId,
    spec: specForClass(inputs.classId),
    targetMaxHp: getBreakthrough(inputs.breakthrough).targetHp,
  }

  const armorSetKey = inputs.set ? SET_BY_ID[inputs.set]?.siteKey : undefined
  if (armorSetKey) params.armorSet = armorSetKey

  const tierByInnerWayId = new Map<string, number>()
  for (const slot of inputs.mindMethods) {
    const innerWayId = slotInnerWayId(slot)
    if (innerWayId) tierByInnerWayId.set(innerWayId, tierFromStacks(slot.stacks))
  }
  for (const def of INNER_WAYS) {
    if (!def.buffParam) continue
    const tier = tierByInnerWayId.get(def.id)
    if (tier === undefined) continue
    params[def.buffParam] = true
    params[tierKey(def.buffParam)] = tier
  }

  const breakExtensionBonus = inputs.combatSettings?.breakExtension ? 12 : 0
  if (!sameQiBreakWindow(qiBreak, DEFAULT_QI_BREAK_WINDOW) || breakExtensionBonus !== 0) {
    params.qiBreakTime = qiBreak.startSec
    params.bossBreakDuration = qiBreak.durationSec + breakExtensionBonus
  }
  if (qiBreak.lowQiLeadSec > 0 && qiBreak.durationSec > 0) {
    params.belowQiTime = Math.max(0, qiBreak.startSec - qiBreak.lowQiLeadSec)
  }

  if (inputs.combatSettings?.script) params[inputs.combatSettings.script] = true
  if (inputs.combatSettings?.dragonHeadFullStacks) params.allySurgingWaves = true
  if (inputs.combatSettings?.dragonHeadLowHpMaxBonus) params.dragonHeadLowHpMaxBonus = true
  if (inputs.combatSettings?.lowEndurance) params.lowEndurance = true
  if (inputs.divinecraft === "fire") params.divinecraftFire = true

  if (inputs.buffParams) Object.assign(params, inputs.buffParams)

  params.minPhysAttack = inputs.phys.min
  params.maxPhysAttack = inputs.phys.max
  params.whiteCritRate = inputs.critRate
  params.breakthrough = inputs.breakthrough
  params.distanceMeters =
    inputs.combatSettings?.distanceToTargetMeters ?? defaultCombatSettings().distanceToTargetMeters
  params[PARAM.missingEnduranceAtHit] =
    inputs.combatSettings?.missingEnduranceAtHit ?? defaultCombatSettings().missingEnduranceAtHit
  params[PARAM.enduranceAtRelease] =
    inputs.combatSettings?.enduranceAtRelease ?? defaultCombatSettings().enduranceAtRelease

  return params
}
