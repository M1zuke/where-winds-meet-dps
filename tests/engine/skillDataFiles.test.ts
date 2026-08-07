import { describe, expect, it } from "vitest"
import {
  builtinSkillsForClass,
  builtinDebuffsForClass,
  builtinBuffsForClass,
} from "../../src/engine/builtinLibrary"

// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
const EXPECTED_COUNTS: Record<string, number> = {
  bellstrikeUmbra: 50,
}

describe("per-class skill file coverage", () => {
  for (const [classId, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
    it(`${classId} has ${expectedCount} built-in skills, unique ids, matching classId`, () => {
      const skills = builtinSkillsForClass(classId)
      expect(skills).toHaveLength(expectedCount)
      const ids = skills.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const s of skills) {
        expect(s.classId).toBe(classId)
        expect(s.id.startsWith(`${classId}-`)).toBe(true)
      }
    })
  }
})

describe("bellstrikeUmbra built-in data — referential integrity of trigger targets", () => {
  const CLASS = "bellstrikeUmbra"
  const skills = builtinSkillsForClass(CLASS)
  const skillIds = new Set(skills.map((s) => s.id))
  const debuffIds = new Set(builtinDebuffsForClass(CLASS).map((d) => d.id))
  const buffIds = new Set(builtinBuffsForClass(CLASS).map((b) => b.id))

  it("every castSkill trigger targetId resolves inside the class's built-in skills", () => {
    for (const s of skills) {
      for (const hit of s.hits) {
        for (const t of hit.triggers) {
          if (t.kind === "castSkill") expect(skillIds.has(t.targetId)).toBe(true)
        }
      }
    }
  })

  it("every applyDot trigger targetId resolves inside the class's built-in debuffs", () => {
    for (const s of skills) {
      for (const hit of s.hits) {
        for (const t of hit.triggers) {
          if (t.kind === "applyDot") expect(debuffIds.has(t.targetId)).toBe(true)
        }
      }
    }
  })

  it("every applyBuff trigger targetId resolves inside the class's built-in buffs", () => {
    for (const s of skills) {
      for (const hit of s.hits) {
        for (const t of hit.triggers) {
          if (t.kind === "applyBuff") expect(buffIds.has(t.targetId)).toBe(true)
        }
      }
    }
  })
})
