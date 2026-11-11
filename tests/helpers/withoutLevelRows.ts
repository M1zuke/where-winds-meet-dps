import { matchesRow, withRow } from "../../src/migrations/customSkills/hitRows"
import { EXACT_SWAPS } from "../../src/migrations/customSkills/V126__mysticExactTierSixRows"
import type { Debuff } from "../../src/engine/debuff"
import type { CoefficientRow, LevelRows, Skill } from "../../src/engine/skill"

function seededRow<Value extends CoefficientRow & { levelRows?: LevelRows }>(
  row: Value,
): Omit<Value, "levelRows"> {
  const { levelRows: _levelRows, ...rest } = row
  const swap = EXACT_SWAPS.find((candidate) => {
    const top = candidate.rows["6"]!
    return matchesRow(rest, [
      top.physMultiplier,
      top.attributeMultiplier,
      top.physFixed,
      top.attributeFixed,
    ])
  })
  return (swap ? withRow(rest, swap.from) : rest) as unknown as Omit<Value, "levelRows">
}

export function withoutLevelRows(skill: Skill): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit) => ({
      ...seededRow(hit),
      ...(hit.variants ? { variants: hit.variants.map((variant) => seededRow(variant)) } : {}),
    })),
  }
}

export function debuffWithoutLevelRows(debuff: Debuff): Debuff {
  return debuff.dot ? { ...debuff, dot: seededRow(debuff.dot) } : debuff
}
