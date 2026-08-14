import { describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"

const UNIVERSAL_SET_BUFFS = [BUFF.jadeware]

describe("every registered class has a skill that triggers each universal set buff", () => {
  it.each(CLASS_IDS())("%s", (classId) => {
    for (const buffId of UNIVERSAL_SET_BUFFS) {
      expect(
        builtinSkillsForClass(classId).some((skill) => skill.triggersBuffs?.includes(buffId)),
        `${classId} has no skill triggering ${buffId} — list it in that skill's triggersBuffs`,
      ).toBe(true)
    }
  })
})
