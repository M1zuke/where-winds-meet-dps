import { defineClassBuff } from "../../../definitions/skills/buffDef"
import type { BuffModule } from "../../../engine/buffs/buffModule"
import { artBonus, damageMultiplier } from "../../../engine/effects/effect"

export interface AdditionalAttackRank {
  breakthrough: number
  flatBonus: number
  coefficientBonus: number
}

export const ADDITIONAL_ATTACK_FIRST_RANK_BREAKTHROUGH = 18

// In-game martial-art talent values as of 2026-09-11.
export const ADDITIONAL_ATTACK_RANKS: readonly AdditionalAttackRank[] = [
  { breakthrough: 18, flatBonus: 0.0725, coefficientBonus: 0.00725 },
  { breakthrough: 19, flatBonus: 0.15, coefficientBonus: 0.015 },
  { breakthrough: 20, flatBonus: 0.225, coefficientBonus: 0.0225 },
  { breakthrough: 21, flatBonus: 0.3, coefficientBonus: 0.03 },
]

export const ADDITIONAL_ATTACK_RANKS_WITH_BAMBOOCUT_EXTENSION: readonly AdditionalAttackRank[] = [
  ...ADDITIONAL_ATTACK_RANKS,
  { breakthrough: 22, flatBonus: 0.4, coefficientBonus: 0.04 },
  { breakthrough: 23, flatBonus: 0.5, coefficientBonus: 0.05 },
]

export function additionalAttackRankAt(
  ladder: readonly AdditionalAttackRank[],
  breakthrough: number,
): AdditionalAttackRank | null {
  let resolved: AdditionalAttackRank | null = null
  for (const rank of ladder) {
    if (rank.breakthrough <= breakthrough) resolved = rank
  }
  return resolved
}

export function additionalAttackClassBuff(config: {
  id: string
  name: string
  summary: string
  ladder: readonly AdditionalAttackRank[]
  clause: "main" | "coefficient"
}): BuffModule {
  const { id, name, summary, ladder, clause } = config
  return defineClassBuff({
    id,
    name,
    requires: { minBreakthrough: ADDITIONAL_ATTACK_FIRST_RANK_BREAKTHROUGH },
    alwaysActive: true,
    duration: 9999,
    summary,
    effects: (ctx) => {
      if (!ctx.self.reachesEvent) return []
      const rank = additionalAttackRankAt(ladder, ctx.build.breakthrough)
      if (!rank) return []
      return clause === "main"
        ? [artBonus("fixedDamagePctBonus", rank.flatBonus)]
        : [damageMultiplier(1 + rank.coefficientBonus)]
    },
  })
}
