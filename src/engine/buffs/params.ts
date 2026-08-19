import type { Inputs } from "../types"
import type { BuffParams } from "./buffEngine"
import { INNER_WAYS, slotInnerWayId } from "../../definitions/innerWays/registry"
import { tierFromStacks } from "../../definitions/innerWays/innerWayDef"
import { SET_BY_ID } from "../../definitions/sets/registry"
import { specForClass } from "./data"

// The one place `Inputs.buffParams`' `<param>Tier` wire-key convention is
// written — every reader goes through `paramOnOf`/`paramTierOf` instead of
// rebuilding the key itself.
function tierKey(param: string): string {
  return param + "Tier"
}

export function paramOnOf(params: BuffParams, param: string): boolean {
  return !!params[param]
}

export function paramTierOf(params: BuffParams, param: string): number {
  const tier = params[tierKey(param)]
  return typeof tier === "number" ? tier : 0
}

export function paramsFromInputs(inputs: Inputs): BuffParams {
  const params: BuffParams = {
    isTrainingDummy: !!inputs.dummyMode,
    classId: inputs.classId,
    spec: specForClass(inputs.classId),
  }

  const armorSetKey = inputs.set ? SET_BY_ID[inputs.set]?.siteKey : undefined
  if (armorSetKey) {
    params.armorSet = armorSetKey
    if (armorSetKey === "starsAlign") params.starsAlignActive = true
  }

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

  const qiBreak = inputs.combatSettings?.qiBreak
  const breakExtensionBonus = inputs.combatSettings?.breakExtension ? 12 : 0
  if (
    qiBreak &&
    (qiBreak.startSec !== 25 || qiBreak.durationSec !== 10 || breakExtensionBonus !== 0)
  ) {
    params.qiBreakTime = qiBreak.startSec
    params.bossBreakDuration = qiBreak.durationSec + breakExtensionBonus
  }
  if (qiBreak && qiBreak.lowQiLeadSec > 0) {
    params.belowQiTime = Math.max(0, qiBreak.startSec - qiBreak.lowQiLeadSec)
  }

  if (inputs.combatSettings?.dragonHeadFullStacks) params.allySurgingWaves = true
  if (inputs.combatSettings?.dragonHeadLowHpMaxBonus) params.dragonHeadLowHpMaxBonus = true
  if (inputs.combatSettings?.lowEndurance) params.lowEndurance = true

  // Casting-player HP fractions, when the input deviates from the default
  // (`1 / 1`). The engine has no HP ledger, so the value is static per
  // simulation run — populated for HP-gated buff branches (Star Reacher
  // T1) and only forwarded when it would change the buff context. The
  // `??` chain keeps both 0 (dead) and 1 (full) as "not worth forwarding"
  // when they match the buff engine's default sentinel, but the
  // `typeof === "number"` guards a `null`/`undefined` input from
  // overwriting it.
  if (typeof inputs.playerHp === "number" && inputs.playerHp !== 1) params.playerHp = inputs.playerHp
  if (typeof inputs.playerHpMax === "number" && inputs.playerHpMax !== 1)
    params.playerHpMax = inputs.playerHpMax

  if (inputs.buffParams) Object.assign(params, inputs.buffParams)

  return params
}
