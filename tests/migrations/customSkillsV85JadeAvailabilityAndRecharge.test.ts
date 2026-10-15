import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V85__jadeAvailabilityAndRecharge,
  healSkill,
} from "../../src/migrations/customSkills/V85__jadeAvailabilityAndRecharge"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV84File from "./testCustomSkills/v84/store.json"

const STORE = storeV84File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-umbrella-slash"
const UNTOUCHED_ID = "silkbindJade-umblightcharge"
const HEALED_IDS = [
  "silkbindJade-fanq",
  "silkbindJade-fanqcancel",
  "silkbindJade-fanspecial",
  "silkbindJade-umbq",
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
]
const CHECKED_FIELDS = [
  "triggersBuffs",
  "triggersBuffsAtFrame",
  "meterCosts",
  "castConditions",
  "hits",
] as const

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

const sortedTriggers = (skill: Skill): string[] => [...(skill.triggersBuffs ?? [])].sort()

describe("custom-skills v84 fixture", () => {
  it("is v84 and still stores the old shape for every healed skill", () => {
    expect(STORE.v).toBe(V85__jadeAvailabilityAndRecharge.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      const builtin = builtinOf(id)
      const diverges = CHECKED_FIELDS.some(
        (field) => JSON.stringify(seeded[field]) !== JSON.stringify(builtin[field]),
      )
      expect(diverges, id).toBe(true)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const builtin = builtinOf(id)
    for (const field of CHECKED_FIELDS) {
      if (field === "triggersBuffs") continue
      expect(healed[field], `${id}.${field}`).toEqual(builtin[field])
    }
    expect(sortedTriggers(healed)).toEqual(sortedTriggers(builtin))
  })

  it("leaves a copy whose triggers were edited alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanq"))
    edited.triggersBuffs = [...edited.triggersBuffs!, "userAddedBuff"]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.triggersBuffs).toEqual(edited.triggersBuffs)
  })

  it("leaves a cost the copy was given", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanspecial"))
    edited.meterCosts = [{ meterId: "userMeter", amount: 5 }]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.meterCosts).toEqual(edited.meterCosts)
  })

  it("leaves a Special whose first hit was edited from adding the water clone hit", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanspecial"))
    edited.hits[0]!.triggers = []
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits).toHaveLength(1)
    expect(healed.hits[0]!.triggers).toEqual([])
  })

  it("leaves every other skill and a user-authored one alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID, "silkbindJade-fanq-prepull"]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V85__jadeAvailabilityAndRecharge — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V85__jadeAvailabilityAndRecharge.migrate(clone(STORE))
    expect(after.v).toBe(85)
    for (const id of HEALED_IDS) expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V85__jadeAvailabilityAndRecharge.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V85__jadeAvailabilityAndRecharge — through the chain", () => {
  it("is registered and is exactly what the v84 → v85 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V85__jadeAvailabilityAndRecharge)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 85 })!
    expect(result.applied).toEqual(["V85__jadeAvailabilityAndRecharge"])
    expect(result.blob.v).toBe(85)
  })
})
