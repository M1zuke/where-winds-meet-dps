import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V134__ghostlyAfterimageDodgeContext } from "../../src/migrations/customSkills/V134__ghostlyAfterimageDodgeContext"
import type { Skill } from "../../src/engine/skill"
import storeV133File from "./testCustomSkills/v133/store.json"

const STORE = storeV133File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("V134__ghostlyAfterimageDodgeContext", () => {
  it("starts from a v133 store whose afterimage copy has no tag", () => {
    expect(STORE.v).toBe(V134__ghostlyAfterimageDodgeContext.to - 1)
    expect(STORE.skills[0]!.tags).toEqual([])
  })

  it("adds the dodge-context tag and keeps every edited value", () => {
    const edited = clone(STORE)
    edited.skills[0]!.hits[0]!.physFixed = 999
    const migrated = V134__ghostlyAfterimageDodgeContext.migrate(edited)
    const skill = (migrated.skills as Skill[])[0]!
    expect(migrated.v).toBe(134)
    expect(skill.tags).toEqual(["context:dodge"])
    expect(skill.hits[0]!.physFixed).toBe(999)
  })

  it("is idempotent and leaves other skills alone", () => {
    const other = { id: "sk-user", classId: "bellstrikeUmbra", tags: [], hits: [] }
    const once = V134__ghostlyAfterimageDodgeContext.migrate({
      ...clone(STORE),
      skills: [...clone(STORE).skills, other as unknown as Skill],
    })
    const twice = V134__ghostlyAfterimageDodgeContext.migrate(clone(once))
    expect((twice.skills as Skill[])[0]!.tags).toEqual(["context:dodge"])
    expect((twice.skills as Skill[])[1]).toEqual(other)
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect((result.blob.skills as Skill[])[0]!.tags).toContain("context:dodge")
  })
})
