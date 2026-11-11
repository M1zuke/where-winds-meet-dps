import { beforeEach, describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { retargetId } from "../../src/definitions/skills/universalSkills"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { LATEST_CUSTOM_SKILLS_VERSION } from "../../src/migrations/customSkills"
import { isSkill } from "../../src/engine/skill"
import { loadCustomSkills } from "../../src/storage"
import { SKILL as MYSTIC } from "../../src/data/skills/mystic/ids"
import { SKILL as UNIVERSAL } from "../../src/data/skills/universal/ids"

const BRANCH_FORM_IDS = [
  MYSTIC.dragonFireSmolder1Hit,
  MYSTIC.dragonFireSmolder2Hits,
  MYSTIC.toadFury,
  MYSTIC.toadFuryHit,
  MYSTIC.dragonHeadPlus,
  MYSTIC.ghostlyAfterimage,
  UNIVERSAL.ghostlyStepsUmbra,
]

describe("Mystic tier-6 branch forms", () => {
  it.each(CLASS_IDS())("%s declares breakthrough 15 on exactly the branch forms", (classId) => {
    const floors = Object.fromEntries(
      builtinSkillsForClass(classId)
        .filter((skill) => skill.minBreakthrough !== undefined)
        .map((skill) => [skill.id, skill.minBreakthrough]),
    )
    const expected = Object.fromEntries(
      BRANCH_FORM_IDS.map((id) => [retargetId(id, classId), 15] as const),
    )
    expect(floors).toEqual(expected)
  })

  describe("in a saved copy", () => {
    beforeEach(() => localStorage.clear())

    it("takes the built-in minimum breakthrough by id when the copy carries none", () => {
      const builtin = builtinSkillsForClass("bellstrikeUmbra").find(
        (skill) => skill.id === MYSTIC.dragonHeadPlus,
      )!
      const { minBreakthrough: _stored, ...copy } = builtin
      void _stored
      localStorage.setItem(
        "wwm.customSkills",
        JSON.stringify({ v: LATEST_CUSTOM_SKILLS_VERSION, skills: [copy] }),
      )
      const [loaded] = loadCustomSkills()
      expect(loaded.minBreakthrough).toBe(15)
      expect(isSkill(loaded)).toBe(true)
    })
  })
})
