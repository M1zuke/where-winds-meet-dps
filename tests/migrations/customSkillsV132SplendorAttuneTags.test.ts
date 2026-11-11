import { beforeEach, describe, expect, it } from "vitest"
import {
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V132__splendorAttuneTags } from "../../src/migrations/customSkills/V132__splendorAttuneTags"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV131File from "./testCustomSkills/v131/store.json"

const STORE = storeV131File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SPLENDOR_SHARED_ID = "bellstrikeSplendor-swordq"
const SPLENDOR_OWN_ID = "bellstrikeSplendor-swordheavycharged"
const UMBRA_IDS = ["bellstrikeUmbra-swordq", "bellstrikeUmbra-crosswind-blade"]
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const attuneTagsOf = (skill: Skill): string[] =>
  (skill.tags ?? []).filter((tag) => tag.startsWith("attune:"))

function withSplendorAuthoredSkill(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
  const authored = {
    ...clone(skillIn(blob, USER_AUTHORED_ID)),
    id: "sk-user-authored-splendor",
    classId: "bellstrikeSplendor",
    tags: ["weapon:spear", "attune:spearCharged", "attune:swordSpecial"],
  }
  return { ...blob, skills: [...blob.skills, authored] }
}

describe("custom-skills v131 fixture", () => {
  it("is v131 and stores the shared tags on the seeded copies", () => {
    expect(STORE.v).toBe(V132__splendorAttuneTags.to - 1)
    expect(attuneTagsOf(skillIn(STORE, SPLENDOR_SHARED_ID))).toEqual(["attune:swordQ"])
    expect(attuneTagsOf(skillIn(STORE, SPLENDOR_OWN_ID))).toEqual(["attune:swordCharged"])
    expect(attuneTagsOf(skillIn(STORE, UMBRA_IDS[0]))).toEqual(["attune:swordQ"])
  })
})

describe("V132__splendorAttuneTags — called directly", () => {
  it("renames a Splendor copy's shared tag", () => {
    const migrated = V132__splendorAttuneTags.migrate(clone(STORE))
    expect(migrated.v).toBe(132)
    expect(attuneTagsOf(skillIn(migrated, SPLENDOR_SHARED_ID))).toEqual(["attune:namelessSwordQ"])
  })

  it("renames a user-authored Splendor skill's shared tags and keeps its other tags", () => {
    const migrated = V132__splendorAttuneTags.migrate(withSplendorAuthoredSkill(clone(STORE)))
    expect(skillIn(migrated, "sk-user-authored-splendor").tags).toEqual([
      "weapon:spear",
      "attune:namelessSpearCharged",
      "attune:namelessSwordSpecial",
    ])
  })

  it("leaves a Splendor tag the class still owns, the Umbra copies and the user-authored Umbra skill identical", () => {
    const migrated = V132__splendorAttuneTags.migrate(clone(STORE))
    for (const id of [SPLENDOR_OWN_ID, ...UMBRA_IDS, USER_AUTHORED_ID]) {
      expect(skillIn(migrated, id)).toEqual(skillIn(STORE, id))
    }
  })

  it("changes nothing but the renamed tags", () => {
    const migrated = V132__splendorAttuneTags.migrate(clone(STORE))
    expect(skillIn(migrated, SPLENDOR_SHARED_ID)).toEqual({
      ...skillIn(STORE, SPLENDOR_SHARED_ID),
      tags: skillIn(STORE, SPLENDOR_SHARED_ID).tags!.map((tag) =>
        tag === "attune:swordQ" ? "attune:namelessSwordQ" : tag,
      ),
    })
    expect(migrated.skills).toHaveLength(STORE.skills.length)
  })

  it("is idempotent and does not mutate its input", () => {
    const before = withSplendorAuthoredSkill(clone(STORE))
    const snapshot = clone(before)
    const once = V132__splendorAttuneTags.migrate(before)
    expect(before).toEqual(snapshot)
    expect(V132__splendorAttuneTags.migrate(once)).toEqual({ ...once, v: 132 })
  })

  it("survives a store whose skills are not an array", () => {
    const blob = { v: 131, skills: "nope" } as unknown as RawCustomSkillsBlob
    expect(V132__splendorAttuneTags.migrate(blob).skills).toBe("nope")
  })
})

describe("V132__splendorAttuneTags — registered", () => {
  it("is the only step a v131 store walks through", () => {
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 132 })!
    expect(result.applied).toEqual(["V132__splendorAttuneTags"])
    expect(result.blob.v).toBe(132)
    expect(attuneTagsOf(skillIn(result.blob, SPLENDOR_SHARED_ID))).toEqual([
      "attune:namelessSwordQ",
    ])
  })
})

describe("a stored Splendor copy through the loader", () => {
  beforeEach(() => localStorage.clear())

  it("carries the renamed own tag and no second built-in one on top", () => {
    localStorage.setItem("wwm.customSkills", JSON.stringify(clone(STORE)))
    const loaded = loadCustomSkills().find((skill) => skill.id === SPLENDOR_SHARED_ID)!
    expect(attuneTagsOf(loaded)).toEqual(["attune:namelessSwordQ"])
  })
})
