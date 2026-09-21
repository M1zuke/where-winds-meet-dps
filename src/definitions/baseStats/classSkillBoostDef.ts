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
}

export interface StagedClassSkillBoost extends ClassSkillBoostBase {
  stage: "min" | "max"
  maxBonus?: never
}

export type ClassSkillBoost = FlatClassSkillBoost | StagedClassSkillBoost

export function defineClassSkillBoosts(
  boosts: readonly ClassSkillBoost[],
): readonly ClassSkillBoost[] {
  return boosts
}
