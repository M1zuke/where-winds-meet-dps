// v58 → v59 — the Bamboocut Draught module that paired Tipsylay's values with
// Primepick's timing is gone; the module carrying Tipsylay's real values is
// the one under the older Primepick id. A Skill Editor copy of the removed
// module follows it there so it keeps overriding something, unless the store
// already holds a copy of the surviving one — then it stays under its own id,
// unrecognised and kept, never merged over the user's other copy.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const REMOVED_SKILL_ID = "bamboocutDraught-nightwick-tipsylay"
const SURVIVING_SKILL_ID = "bamboocutDraught-nightwick-primepick"
const REMOVED_CAST_TAG = "cast:nightwickTipsylay"
const SURVIVING_CAST_TAG = "cast:nightwickPrimepick"

const isRec = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function repointRemovedSkill(skills: unknown[]): unknown[] {
  const survivorHasCopy = skills.some((skill) => isRec(skill) && skill.id === SURVIVING_SKILL_ID)
  if (survivorHasCopy) return skills
  return skills.map((skill) => {
    if (!isRec(skill) || skill.id !== REMOVED_SKILL_ID) return skill
    return {
      ...skill,
      id: SURVIVING_SKILL_ID,
      ...(skill.castTag === REMOVED_CAST_TAG ? { castTag: SURVIVING_CAST_TAG } : {}),
    }
  })
}

export const V59__removeNightwickTipsylayHybrid: CustomSkillMigration = {
  to: 59,
  name: "V59__removeNightwickTipsylayHybrid",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? repointRemovedSkill(blob.skills) : blob.skills
    return { ...blob, v: 59, skills }
  },
}
