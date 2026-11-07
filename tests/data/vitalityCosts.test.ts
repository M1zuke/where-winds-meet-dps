import { beforeEach, describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { retargetId } from "../../src/definitions/skills/universalSkills"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { LATEST_CUSTOM_SKILLS_VERSION } from "../../src/migrations/customSkills"
import { isSkill } from "../../src/engine/skill"
import { loadCustomSkills } from "../../src/storage"
import { SKILL as MYSTIC } from "../../src/data/skills/mystic/ids"
import { SKILL as UNIVERSAL } from "../../src/data/skills/universal/ids"

const VITALITY_COSTS: Record<string, number> = {
  [MYSTIC.fireBreath1Hit]: 20,
  [MYSTIC.fireBreath2Hit]: 20,
  [MYSTIC.fireBreath1HitPrepull]: 20,
  [MYSTIC.dragonFireSmolder1Hit]: 20,
  [MYSTIC.dragonFireSmolder2Hits]: 20,
  [MYSTIC.drunkenpoetPrepull]: 10,
  [MYSTIC.poet1]: 6,
  [MYSTIC.poet2]: 6,
  [MYSTIC.poet3]: 6,
  [MYSTIC.poet4]: 6,
  [MYSTIC.poetFinalHitCancel]: 6,
  [MYSTIC.toadCancel]: 25,
  [MYSTIC.toadFury]: 25,
  [MYSTIC.toadFuryHit]: 25,
  [MYSTIC.soaring]: 15,
  [MYSTIC.soaring1Hit]: 15,
  [MYSTIC.dragonHead]: 100,
  [MYSTIC.dragonHeadPlus]: 80,
  [MYSTIC.fluteOfTheTidesFull]: 50,
  [MYSTIC.fluteOfTheTidesCancel]: 50,
  [MYSTIC.fluteOfTheTidesPrepull]: 50,
  [MYSTIC.freeMorph]: 30,
  [MYSTIC.wolflikeFrenzy]: 30,
  [UNIVERSAL.ghostlySteps]: 35,
  [UNIVERSAL.ghostlyStepsUmbra]: 40,
  [UNIVERSAL.goldenBodyCancel]: 50,
  [UNIVERSAL.goldenBodyDeflectCancel]: 50,
}

describe("Vitality costs", () => {
  it.each(CLASS_IDS())("%s carries exactly the listed costs", (classId) => {
    const costs = Object.fromEntries(
      builtinSkillsForClass(classId)
        .filter((skill) => skill.vitalityCost !== undefined)
        .map((skill) => [skill.id, skill.vitalityCost]),
    )
    const expected = Object.fromEntries(
      Object.entries(VITALITY_COSTS).map(([id, cost]) => [retargetId(id, classId), cost]),
    )
    expect(costs).toEqual(expected)
  })

  it("leaves the casts that are not their own press without a cost", () => {
    const skills = builtinSkillsForClass("bellstrikeUmbra")
    for (const id of [MYSTIC.ghostlyAfterimage, MYSTIC.poetFinalHitCancelExplosion])
      expect(skills.find((skill) => skill.id === id)?.vitalityCost).toBeUndefined()
  })

  describe("in a saved copy", () => {
    beforeEach(() => localStorage.clear())

    it("takes the built-in cost by id when the copy carries none", () => {
      const builtin = builtinSkillsForClass("bellstrikeUmbra").find(
        (skill) => skill.id === MYSTIC.poet1,
      )!
      const { vitalityCost: _stored, ...copy } = builtin
      void _stored
      localStorage.setItem(
        "wwm.customSkills",
        JSON.stringify({ v: LATEST_CUSTOM_SKILLS_VERSION, skills: [copy] }),
      )
      const [loaded] = loadCustomSkills()
      expect(loaded.vitalityCost).toBe(VITALITY_COSTS[MYSTIC.poet1])
      expect(isSkill(loaded)).toBe(true)
    })
  })
})
