import { matchesRow, withRow } from "../../src/migrations/customSkills/hitRows"
import { EXACT_SWAPS } from "../../src/migrations/customSkills/V126__mysticExactTierSixRows"
import { LEVEL_TABLES } from "../../src/migrations/customSkills/V127__umbraLevelRows"
import type { Debuff } from "../../src/engine/debuff"
import type { CoefficientRow, LevelRows, Skill } from "../../src/engine/skill"

function seededRow<Value extends CoefficientRow & { levelRows?: LevelRows }>(
  row: Value,
): Omit<Value, "levelRows"> {
  const { levelRows: _levelRows, ...rest } = row
  const umbra = LEVEL_TABLES.find((candidate) => {
    const top = candidate.rows["100"]!
    return matchesRow(rest, [
      top.physMultiplier,
      top.attributeMultiplier,
      top.physFixed,
      top.attributeFixed,
    ])
  })
  if (umbra) return withRow(rest, umbra.from) as unknown as Omit<Value, "levelRows">
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
