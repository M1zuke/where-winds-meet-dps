import type { ScalingSource, TalentStat } from "../../engine/types"

interface ClassSkillBoostBase {
  skill: string
  stat: TalentStat
  scalesWith: ScalingSource
  scaleMax: number
}

export interface FlatClassSkillBoost extends ClassSkillBoostBase {
  maxBonus: number
  stage?: never
  // A talent whose cap and scaling threshold rise at a later breakthrough
  // stage: the highest entry at or below the build's breakthrough overrides
  // `maxBonus` (and `scaleMax`, if given); below the lowest key the base
  // fields apply.
  maxBonusByBreakthrough?: Readonly<Record<number, number>>
  scaleMaxByBreakthrough?: Readonly<Record<number, number>>
}

export interface StagedClassSkillBoost extends ClassSkillBoostBase {
  stage: "min" | "max"
  maxBonus?: never
  maxBonusByBreakthrough?: never
  scaleMaxByBreakthrough?: never
}

export type ClassSkillBoost = FlatClassSkillBoost | StagedClassSkillBoost

export function defineClassSkillBoosts(
  boosts: readonly ClassSkillBoost[],
): readonly ClassSkillBoost[] {
  return boosts
}

function highestAtOrBelow(
  ladder: Readonly<Record<number, number>> | undefined,
  breakthrough: number,
): number | undefined {
  if (!ladder) return undefined
  let resolved: number | undefined
  let resolvedKey = -Infinity
  for (const [key, value] of Object.entries(ladder)) {
    const numericKey = Number(key)
    if (numericKey <= breakthrough && numericKey > resolvedKey) {
      resolved = value
      resolvedKey = numericKey
    }
  }
  return resolved
}

export function resolvedMaxBonus(boost: FlatClassSkillBoost, breakthrough: number): number {
  return highestAtOrBelow(boost.maxBonusByBreakthrough, breakthrough) ?? boost.maxBonus
}

export function resolvedScaleMax(boost: FlatClassSkillBoost, breakthrough: number): number {
  return highestAtOrBelow(boost.scaleMaxByBreakthrough, breakthrough) ?? boost.scaleMax
}
