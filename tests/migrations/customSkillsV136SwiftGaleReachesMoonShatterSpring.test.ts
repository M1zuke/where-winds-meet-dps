import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V136__swiftGaleReachesMoonShatterSpring } from "../../src/migrations/customSkills/V136__swiftGaleReachesMoonShatterSpring"
import type { Skill } from "../../src/engine/skill"
import storeV135File from "./testCustomSkills/v135/store.json"

const STORE = storeV135File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SWIFT_GALE = "swiftGaleAirborneHeavyBoost"
const SEEDED_ID = "silkbindJade-fanheavypursuit-3-hit"
const EDITED_ID = "silkbindJade-fanheavypursuit-5-hit"
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V136__swiftGaleReachesMoonShatterSpring", () => {
  it("starts from a v135 store whose seeded copies do not list Swift Gale", () => {
    expect(STORE.v).toBe(V136__swiftGaleReachesMoonShatterSpring.to - 1)
    expect(skillIn(STORE, SEEDED_ID).receives).not.toContain(SWIFT_GALE)
  })

  it("appends Swift Gale to each Moon Shatter Spring copy and keeps the rest of the reach", () => {
    const migrated = V136__swiftGaleReachesMoonShatterSpring.migrate(clone(STORE))
    expect(migrated.v).toBe(136)
    for (const id of [SEEDED_ID, EDITED_ID])
      expect(skillIn(migrated, id).receives).toEqual([...skillIn(STORE, id).receives!, SWIFT_GALE])
  })

  it("keeps an edited copy's values", () => {
    const migrated = V136__swiftGaleReachesMoonShatterSpring.migrate(clone(STORE))
    expect(skillIn(migrated, EDITED_ID).hits[0]!.physMultiplier).toBe(0.6)
  })

  it("is idempotent and leaves a user-authored skill alone", () => {
    const once = V136__swiftGaleReachesMoonShatterSpring.migrate(clone(STORE))
    const twice = V136__swiftGaleReachesMoonShatterSpring.migrate(clone(once))
    expect(twice.skills).toEqual(once.skills)
    expect(skillIn(twice, "sk-user-authored-slash")).toEqual(
      skillIn(STORE, "sk-user-authored-slash"),
    )
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(skillIn(result.blob, SEEDED_ID).receives).toContain(SWIFT_GALE)
  })
})
