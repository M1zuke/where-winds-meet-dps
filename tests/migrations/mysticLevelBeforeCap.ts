import { swapHits } from "../../src/migrations/customSkills/hitRows"
import { swapsForMysticArt } from "../../src/migrations/customSkills/V68__mysticArtLevelCap"
import type { Skill } from "../../src/engine/skill"

export function atMysticLevelBeforeCap(skill: Skill): Skill {
  const swaps = swapsForMysticArt(skill.id)
  if (!swaps) return skill
  const reverted = swaps.map(({ from, to }) => ({ from: to, to: from }))
  return { ...skill, hits: swapHits(skill.hits, reverted) as Skill["hits"] }
}
