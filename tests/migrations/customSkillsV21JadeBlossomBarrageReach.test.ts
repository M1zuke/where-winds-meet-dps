// Scoped to persisted Silkbind Jade skill copies.
import { describe, expect, it } from "vitest"
import storeFile from "./testCustomSkills/v20/store.json"
import type { Skill } from "../../src/engine/skill"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
} from "../../src/migrations/customSkills"
import {
  V21__jadeBlossomBarrageReach,
  healJadeBlossomBarrageReach,
} from "../../src/migrations/customSkills/V21__jadeBlossomBarrageReach"

const store = storeFile as unknown as { v: number; skills: Skill[] }

describe("v20 to v21 drone bonus migration", () => {
  it("uses an old capture without the added drone bonus", () => {
    expect(store.v).toBe(20)
    const drones = store.skills.filter((skill) => skill.tags?.includes("prop:isDrone"))
    expect(drones).toHaveLength(5)
    for (const skill of drones) expect(skill.receives).not.toContain("comboUmbLightBonus")
  })
  it("adds only the new reach and preserves coefficients and user edits", () => {
    const snapshot = structuredClone(store)
    const after = V21__jadeBlossomBarrageReach.migrate(store)
    expect(store).toEqual(snapshot)
    expect(after.v).toBe(21)
    expect(after.skills).toEqual(
      store.skills.map((skill) =>
        skill.tags?.includes("prop:isDrone")
          ? { ...skill, receives: [...(skill.receives ?? []), "comboUmbLightBonus"] }
          : skill,
      ),
    )
    expect(V21__jadeBlossomBarrageReach.migrate(after)).toEqual(after)
  })
  it("is registered and the versioned chain actually applies the hop", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V21__jadeBlossomBarrageReach)
    const result = runCustomSkillMigrations(store, { toVersion: 21 })!
    expect(result.applied).toEqual(["V21__jadeBlossomBarrageReach"])
    expect(result.blob).toEqual(V21__jadeBlossomBarrageReach.migrate(store))
  })
  it("leaves unrelated and malformed data alone", () => {
    for (const value of [
      null,
      [],
      5,
      { classId: "other", tags: ["prop:isDrone"] },
      { classId: "silkbindJade", tags: ["prop:isDrone"], receives: 4 },
    ]) {
      expect(healJadeBlossomBarrageReach(value)).toEqual(value)
    }
  })
})
