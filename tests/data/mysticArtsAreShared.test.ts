import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { MYSTIC_DEBUFFS, MYSTIC_SKILLS } from "../../src/data/skills/mystic"
import { CLASS_DEFS, CLASS_IDS, classDefinition } from "../../src/definitions/classes/registry"
import { MYSTIC_ARTS_CLASS_ID } from "../../src/engine/skill"

const MYSTIC_DIR = join(process.cwd(), "src/data/skills/mystic")
const SKILL_ID_PREFIX = `${MYSTIC_ARTS_CLASS_ID}-`
const DEBUFF_ID_PREFIX = `debuff-${MYSTIC_ARTS_CLASS_ID}-`

const classPrefixes = () => CLASS_IDS().map((classId) => `${classId}-`)

const namesAClass = (id: string) =>
  classPrefixes().some((prefix) => id.startsWith(prefix) || id.startsWith(`debuff-${prefix}`))

describe("a mystic art is authored once and belongs to no class", () => {
  it("every module in the shared folder carries the shared class id and id segment", () => {
    for (const skill of MYSTIC_SKILLS) {
      expect(skill.classId, skill.id).toBe(MYSTIC_ARTS_CLASS_ID)
      expect(skill.id.startsWith(SKILL_ID_PREFIX), skill.id).toBe(true)
      expect(skill.skillType, skill.id).toBe("mystic")
    }
    for (const debuff of MYSTIC_DEBUFFS) {
      expect(debuff.classId, debuff.id).toBe(MYSTIC_ARTS_CLASS_ID)
      expect(debuff.id.startsWith(DEBUFF_ID_PREFIX), debuff.id).toBe(true)
    }
  })

  it("one file per mystic art, and the barrel lists every one of them", () => {
    const modules = readdirSync(MYSTIC_DIR).filter(
      (entry) => entry.endsWith(".ts") && !["ids.ts", "index.ts", "debuffs.ts"].includes(entry),
    )
    expect(modules).toHaveLength(MYSTIC_SKILLS.length)
  })

  it("no class folder declares a mystic art of its own", () => {
    const classOwned = CLASS_DEFS().flatMap((classDef) =>
      classDef.skills.filter((skill) => skill.skillType === "mystic").map((skill) => skill.id),
    )
    expect(classOwned).toEqual([])
  })

  it("nothing a mystic art or its debuff references names a class", () => {
    const references = MYSTIC_SKILLS.flatMap((skill) =>
      skill.hits.flatMap((hit) => [
        ...hit.triggers.flatMap((trigger) => [
          trigger.targetId,
          trigger.transferFrom ?? "",
          ...(trigger.condition ? [trigger.condition.buffId] : []),
          ...(trigger.conditions ?? []).map((condition) => condition.buffId),
        ]),
        ...(hit.conditions ?? []).map((condition) => condition.buffId),
        ...(hit.variants ?? []).flatMap((variant) =>
          variant.conditions.map((condition) => condition.buffId),
        ),
      ]),
    ).concat(
      MYSTIC_DEBUFFS.flatMap((debuff) => [
        debuff.detonation?.skillId ?? "",
        debuff.dot?.sourceSkillId ?? "",
      ]),
    )
    expect(references.filter(namesAClass)).toEqual([])
  })

  it("every registered class's composed definition carries the whole pool as authored", () => {
    for (const classId of CLASS_IDS()) {
      const definition = classDefinition(classId)!
      for (const skill of MYSTIC_SKILLS) expect(definition.skills, classId).toContain(skill)
      for (const debuff of MYSTIC_DEBUFFS) expect(definition.debuffs, classId).toContain(debuff)
    }
  })
})
