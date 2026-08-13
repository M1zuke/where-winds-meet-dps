import { builtinDebuffsForClass, builtinSkillsForClass } from "../src/engine/builtinLibrary"
import { retargetId } from "../src/definitions/skills/universalSkills"
import { dotRowName } from "../src/engine/dot"
import type { Skill } from "../src/engine/skill"
import type { Debuff } from "../src/engine/debuff"

export function builtinSkill(classId: string, skillId: string): Skill {
  const id = retargetId(skillId, classId)
  const skill = builtinSkillsForClass(classId).find((candidate) => candidate.id === id)
  if (!skill) throw new Error(`no built-in skill ${id} on ${classId}`)
  return skill
}

export function builtinDebuff(classId: string, debuffId: string): Debuff {
  const id = retargetId(debuffId, classId)
  const debuff = builtinDebuffsForClass(classId).find((candidate) => candidate.id === id)
  if (!debuff) throw new Error(`no built-in debuff ${id} on ${classId}`)
  return debuff
}

export function skillRow(classId: string, skillId: string): string {
  return builtinSkill(classId, skillId).name
}

export function dotRow(classId: string, debuffId: string): string {
  return dotRowName(builtinDebuff(classId, debuffId))
}
