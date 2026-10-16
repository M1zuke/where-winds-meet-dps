import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V93__jadeBulletSkillsAsWeaponHits,
  healSkill,
} from "../../src/migrations/customSkills/V93__jadeBulletSkillsAsWeaponHits"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV92File from "./testCustomSkills/v92/store.json"

const STORE = storeV92File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-umbrella-slash"
const UNTOUCHED_ID = "silkbindJade-fanlightcharged"
const HEALED_IDS = (STORE.skills as Skill[])
  .map((skill) => skill.id)
  .filter((id) => /umbdrone|umblightcharge/.test(id))

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v92 fixture", () => {
  it("is v92 and types every bullet skill copy as a sustain tick", () => {
    expect(STORE.v).toBe(V93__jadeBulletSkillsAsWeaponHits.to - 1)
    expect(HEALED_IDS).toHaveLength(8)
    for (const id of HEALED_IDS) expect(skillIn(STORE, id).skillType, id).toBe("sustain")
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("types the untouched %s copy as the built-in does", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(healed.skillType).toBe(builtinOf(id).skillType)
    expect(healed.skillType).toBe("weapon")
  })

  it("leaves a copy typed by hand alone", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.skillType = "mystic"
    expect((healSkill(clone(edited)) as Skill).skillType).toBe("mystic")
  })

  it("leaves every other skill and a user-authored one alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V93__jadeBulletSkillsAsWeaponHits — called directly", () => {
  it("retypes the targeted copies and keeps every other skill", () => {
    const after = V93__jadeBulletSkillsAsWeaponHits.migrate(clone(STORE))
    expect(after.v).toBe(93)
    for (const id of HEALED_IDS) expect(skillIn(after, id).skillType, id).toBe("weapon")
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V93__jadeBulletSkillsAsWeaponHits.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V93__jadeBulletSkillsAsWeaponHits — through the chain", () => {
  it("is registered and is exactly what the v92 → v93 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V93__jadeBulletSkillsAsWeaponHits)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 93 })!
    expect(result.applied).toEqual(["V93__jadeBulletSkillsAsWeaponHits"])
    expect(result.blob.v).toBe(93)
  })
})
