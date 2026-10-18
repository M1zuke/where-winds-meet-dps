import type { Inputs } from "../types"
import type { BuffParams } from "./buffEngine"
import { activeRotationForInputs } from "../activeRotation"
import { DEFAULT_PREFERRED_DISTANCE_METERS } from "../distance"
import { INNER_WAYS, slotInnerWayId } from "../../definitions/innerWays/registry"
import { tierFromStacks } from "../../definitions/innerWays/innerWayDef"
import { SET_BY_ID } from "../../definitions/sets/registry"
import { resolveActiveSets } from "../setBonuses"
import { getBreakthrough } from "../../definitions/baseStats/breakthroughs"
import { specForClass } from "./data"
import { oddityEnduranceTotal } from "../../definitions/baseStats/oddityBoardGraph"
import {
  FRAGRANT_ORCHID_MAX_ENDURANCE_PARAM,
  ODDITY_MAX_ENDURANCE_PARAM,
} from "../../data/resources/enduranceMeter"

export { paramNumOf, paramOnOf, paramTierOf } from "./paramTier"

function tierKey(param: string): string {
  return param + "Tier"
}

export function paramsFromInputs(inputs: Inputs): BuffParams {
  const params: BuffParams = {
    isTrainingDummy: !!inputs.dummyMode,
    classId: inputs.classId,
    spec: specForClass(inputs.classId),
    targetMaxHp: getBreakthrough(inputs.breakthrough).targetHp,
  }

  const fourPieceSet = resolveActiveSets(inputs).fourPiece
  const equippedSet = fourPieceSet ? SET_BY_ID[fourPieceSet] : undefined
  if (equippedSet?.siteKey) params.armorSet = equippedSet.siteKey
  if (equippedSet?.buffParam) params[equippedSet.buffParam] = true

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

  if (inputs.combatSettings?.script) params[inputs.combatSettings.script] = true
  if (inputs.combatSettings?.dragonHeadFullStacks) params.allySurgingWaves = true
  if (inputs.combatSettings?.dragonHeadLowHpMaxBonus) params.dragonHeadLowHpMaxBonus = true
  if (inputs.divinecraft === "fire") params.divinecraftFire = true

  const oddityMaxEndurance = oddityEnduranceTotal(inputs.unclaimedOddityNodes)
  if (oddityMaxEndurance) params[ODDITY_MAX_ENDURANCE_PARAM] = oddityMaxEndurance
  if (inputs.combatSettings?.fragrantOrchidBathBean)
    params[FRAGRANT_ORCHID_MAX_ENDURANCE_PARAM] = 20

  if (inputs.buffParams) Object.assign(params, inputs.buffParams)

  params.minPhysAttack = inputs.phys.min
  params.maxPhysAttack = inputs.phys.max
  params.whiteCritRate = inputs.critRate
  params.breakthrough = inputs.breakthrough
  params.distanceMeters =
    activeRotationForInputs(inputs)?.preferredDistanceMeters ?? DEFAULT_PREFERRED_DISTANCE_METERS

  return params
}
