import type { Skill } from "../../src/engine/skill"

function stripped<Row extends { levelRows?: unknown }>(row: Row): Omit<Row, "levelRows"> {
  const { levelRows: _levelRows, ...rest } = row
  return rest
}

export function withoutLevelRows(skill: Skill): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit) => ({
      ...stripped(hit),
      ...(hit.variants ? { variants: hit.variants.map(stripped) } : {}),
    })),
  }
}
