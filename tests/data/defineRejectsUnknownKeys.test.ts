import { describe, expect, it } from "vitest"
import { defineDebuff, defineGateBuff, defineSkill } from "../../src/definitions/skills/skillDef"

const CLASS = "bellstrikeUmbra"
const TIMESTAMP = "2026-01-01T00:00:00.000Z"

describe("the definers reject a key their interface does not declare", () => {
  it("rejects one on a skill", () => {
    const skill = defineSkill({
      id: "skill-guard",
      classId: CLASS,
      name: "Guard",
      // @ts-expect-error an undeclared key must not typecheck
      breakdwonName: "misspelled",
      skillType: "weapon",
      weaponOrAttribute: "",
      attributeAttack: "",
      hits: [],
      castFrames: 0,
      triggerable: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    })
    expect(skill.id).toBe("skill-guard")
  })

  it("rejects one on a debuff", () => {
    const debuff = defineDebuff({
      id: "debuff-guard",
      classId: CLASS,
      name: "Guard",
      // @ts-expect-error an undeclared key must not typecheck
      breakdwonName: "misspelled",
      activation: "triggered",
      durationFrames: 0,
      effects: [],
      dot: null,
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    })
    expect(debuff.id).toBe("debuff-guard")
  })

  it("rejects one on a gate buff", () => {
    const buff = defineGateBuff({
      id: "buff-guard",
      classId: CLASS,
      name: "Guard",
      // @ts-expect-error an undeclared key must not typecheck
      breakdwonName: "misspelled",
      activation: "triggered",
      durationFrames: 0,
      effects: [],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    })
    expect(buff.id).toBe("buff-guard")
  })
})
