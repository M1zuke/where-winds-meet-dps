import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V133__vernalUmbrellaAttuneTags } from "../../src/migrations/customSkills/V133__vernalUmbrellaAttuneTags"
import type { Skill } from "../../src/engine/skill"
import storeV132File from "./testCustomSkills/v132/store.json"

const STORE = storeV132File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SPRING_AWAY_IDS = ["silkbindJade-umblightcharge-12"]
const DRONE_IDS = ["silkbindJade-umbdrone-20hit"]
const APRICOT_ID = "silkbindJade-apricot-heaven-normal"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const attuneTagsOf = (skill: Skill): string[] =>
  (skill.tags ?? []).filter((tag) => tag.startsWith("attune:"))

function withTags(blob: RawCustomSkillsBlob, id: string, tags: string[]): RawCustomSkillsBlob {
  const skills = (blob.skills as Skill[]).map((skill) =>
    skill.id === id ? { ...skill, tags } : skill,
  )
  return { ...blob, skills }
}

describe("custom-skills v132 fixture", () => {
  it("is v132 and stores the single tags on the seeded umbrella copies", () => {
    expect(STORE.v).toBe(V133__vernalUmbrellaAttuneTags.to - 1)
    expect(attuneTagsOf(skillIn(STORE, SPRING_AWAY_IDS[0]))).toEqual([
      "attune:umbFrequentProjectile",
    ])
    expect(attuneTagsOf(skillIn(STORE, DRONE_IDS[0]))).toEqual(["attune:umbFrequentProjectile"])
    expect(attuneTagsOf(skillIn(STORE, APRICOT_ID))).toEqual(["attune:umbCharged"])
  })
})

describe("V133__vernalUmbrellaAttuneTags — called directly", () => {
  it("gives a Spring Away copy the Charged line beside Frequent Projectile", () => {
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(clone(STORE))
    expect(migrated.v).toBe(133)
    expect(attuneTagsOf(skillIn(migrated, SPRING_AWAY_IDS[0]))).toEqual([
      "attune:umbFrequentProjectile",
      "attune:umbCharged",
    ])
  })

  it("gives a drone copy the Special line beside Frequent Projectile", () => {
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(clone(STORE))
    expect(attuneTagsOf(skillIn(migrated, DRONE_IDS[0]))).toEqual([
      "attune:umbFrequentProjectile",
      "attune:umbSpecial",
    ])
  })

  it("keeps every other tag and its order", () => {
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(clone(STORE))
    const before = skillIn(STORE, DRONE_IDS[0]).tags!
    const after = skillIn(migrated, DRONE_IDS[0]).tags!
    expect(after.filter((tag) => !tag.startsWith("attune:"))).toEqual(
      before.filter((tag) => !tag.startsWith("attune:")),
    )
    expect(after.indexOf("attune:umbFrequentProjectile")).toBe(
      before.indexOf("attune:umbFrequentProjectile"),
    )
  })

  it("returns an Apricot Heaven copy re-tagged with the Frequent Projectile line to Charged", () => {
    const renamed = withTags(clone(STORE), APRICOT_ID, [
      ...skillIn(STORE, APRICOT_ID).tags!.filter((tag) => !tag.startsWith("attune:")),
      "attune:umbFrequentProjectile",
    ])
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(renamed)
    expect(attuneTagsOf(skillIn(migrated, APRICOT_ID))).toEqual(["attune:umbCharged"])
  })

  it("leaves an Apricot Heaven copy carrying a deliberately different line alone", () => {
    const edited = withTags(clone(STORE), APRICOT_ID, ["weapon:Umbrella", "attune:fanQ"])
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(edited)
    expect(skillIn(migrated, APRICOT_ID)).toEqual(skillIn(edited, APRICOT_ID))
  })

  it("leaves a copy that carries one old tag and one other attune tag alone", () => {
    const mixed = withTags(clone(STORE), DRONE_IDS[0], [
      "attune:umbFrequentProjectile",
      "attune:fanSpecial",
    ])
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(mixed)
    expect(skillIn(migrated, DRONE_IDS[0])).toEqual(skillIn(mixed, DRONE_IDS[0]))
  })

  it("leaves other-class copies and the user-authored skill identical", () => {
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(clone(STORE))
    const untouched = (STORE.skills as Skill[]).filter(
      (skill) =>
        ![...SPRING_AWAY_IDS, ...DRONE_IDS, APRICOT_ID].includes(skill.id) &&
        !skill.id.startsWith("silkbindJade-umbdrone") &&
        !skill.id.startsWith("silkbindJade-umblightcharge") &&
        !skill.id.startsWith("silkbindJade-apricot-heaven"),
    )
    expect(untouched.map((skill) => skill.id)).toContain(USER_AUTHORED_ID)
    for (const skill of untouched) expect(skillIn(migrated, skill.id), skill.id).toEqual(skill)
  })

  it("leaves a user-authored Jade skill with the same tags alone", () => {
    const authored = {
      ...clone(skillIn(STORE, DRONE_IDS[0])),
      id: "sk-user-authored-umbrella",
      tags: ["attune:umbFrequentProjectile"],
    }
    const blob = { ...clone(STORE), skills: [...STORE.skills, authored] }
    const migrated = V133__vernalUmbrellaAttuneTags.migrate(blob)
    expect(skillIn(migrated, authored.id)).toEqual(authored)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V133__vernalUmbrellaAttuneTags.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V133__vernalUmbrellaAttuneTags.migrate(clone(once))).toEqual(once)
  })

  it("survives a store whose skills are not an array", () => {
    const blob = { v: 132, skills: "nope" } as unknown as RawCustomSkillsBlob
    expect(V133__vernalUmbrellaAttuneTags.migrate(blob).skills).toBe("nope")
  })
})

describe("V133__vernalUmbrellaAttuneTags — registered", () => {
  it("is the only step a v132 store walks through", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V133__vernalUmbrellaAttuneTags)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 133 })!
    expect(result.applied).toEqual(["V133__vernalUmbrellaAttuneTags"])
    expect(result.blob.v).toBe(133)
  })
})
