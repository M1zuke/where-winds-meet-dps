import type { Buff } from "./buff"
import type { Debuff } from "./debuff"
import { belongsToClass, type Skill } from "./skill"
import type { Inputs } from "./types"

export function withCustomContent(
  inputs: Inputs,
  customSkills: readonly Skill[],
  customBuffs: readonly Buff[],
  customDebuffs: readonly Debuff[],
): Inputs {
  const classSkills = customSkills.filter((skill) => belongsToClass(skill, inputs.classId))
  const classBuffs = customBuffs.filter((buff) => buff.classId === inputs.classId)
  const classDebuffs = customDebuffs.filter((debuff) => belongsToClass(debuff, inputs.classId))
  const withSkills = classSkills.length ? { ...inputs, customSkills: classSkills } : inputs
  const withBuffs = classBuffs.length ? { ...withSkills, customBuffs: classBuffs } : withSkills
  return classDebuffs.length ? { ...withBuffs, customDebuffs: classDebuffs } : withBuffs
}
