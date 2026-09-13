// v20 drone copies predate the Combo bonus on Unfading Flower.
import type { CustomSkillMigration } from "./types"

export function healJadeBlossomBarrageReach(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const skill = value as Record<string, unknown>
  if (
    skill.classId !== "silkbindJade" ||
    !Array.isArray(skill.tags) ||
    !skill.tags.includes("prop:isDrone")
  )
    return value
  const receives = skill.receives
  if (receives !== undefined && !Array.isArray(receives)) return value
  if (receives?.includes("comboUmbLightBonus")) return value
  return { ...skill, receives: [...(receives ?? []), "comboUmbLightBonus"] }
}

export const V21__jadeBlossomBarrageReach: CustomSkillMigration = {
  to: 21,
  name: "V21__jadeBlossomBarrageReach",
  migrate(blob) {
    return {
      ...blob,
      v: 21,
      skills: Array.isArray(blob.skills)
        ? blob.skills.map(healJadeBlossomBarrageReach)
        : blob.skills,
    }
  },
}
