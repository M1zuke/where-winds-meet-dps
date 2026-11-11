import { describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V138__swallowcallReachesFanLightAttacks } from "../../src/migrations/customSkills/V138__swallowcallReachesFanLightAttacks"
import type { Skill } from "../../src/engine/skill"
import storeV137File from "./testCustomSkills/v137/store.json"

const STORE = storeV137File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SWALLOWCALL = "swallowcallLightAttackBoost"
const SEEDED_IDS = ["silkbindJade-fan-light"]
const EDITED_ID = "silkbindJade-fan-light-chain"
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("V138__swallowcallReachesFanLightAttacks", () => {
  it("starts from a v137 store whose seeded copies do not list Swallowcall", () => {
    expect(STORE.v).toBe(V138__swallowcallReachesFanLightAttacks.to - 1)
    for (const id of SEEDED_IDS) expect(skillIn(STORE, id).receives).not.toContain(SWALLOWCALL)
  })

  it("appends Swallowcall to each Fan Light Attack copy and keeps the rest of the reach", () => {
    const migrated = V138__swallowcallReachesFanLightAttacks.migrate(clone(STORE))
    expect(migrated.v).toBe(138)
    for (const id of [...SEEDED_IDS, EDITED_ID])
      expect(skillIn(migrated, id).receives).toEqual([...skillIn(STORE, id).receives!, SWALLOWCALL])
  })

  it("keeps an edited copy's values", () => {
    const migrated = V138__swallowcallReachesFanLightAttacks.migrate(clone(STORE))
    expect(skillIn(migrated, EDITED_ID).hits[0]!.physMultiplier).toBe(0.6)
  })

  it("is idempotent and leaves a user-authored skill alone", () => {
    const once = V138__swallowcallReachesFanLightAttacks.migrate(clone(STORE))
    const twice = V138__swallowcallReachesFanLightAttacks.migrate(clone(once))
    expect(twice.skills).toEqual(once.skills)
    expect(skillIn(twice, "sk-user-authored-slash")).toEqual(
      skillIn(STORE, "sk-user-authored-slash"),
    )
  })

  it("is reached by the full chain", () => {
    const result = runCustomSkillMigrations(clone(STORE))!
    expect(skillIn(result.blob, SEEDED_IDS[0]).receives).toContain(SWALLOWCALL)
  })
})
