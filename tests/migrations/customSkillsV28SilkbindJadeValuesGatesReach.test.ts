import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V28__silkbindJadeValuesGatesReach,
  healSilkbindJadeValuesGatesReach,
} from "../../src/migrations/customSkills/V28__silkbindJadeValuesGatesReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV27File from "./testCustomSkills/v27/store.json"

const CLASS = "silkbindJade"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const HEALED_IDS = [
  "silkbindJade-fanlightcharged",
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
  "silkbindJade-umbdrone",
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdrone-12hit",
  "silkbindJade-umbdrone-16hit",
  "silkbindJade-umbdrone-20hit",
  "silkbindJade-umbdrone-23hit",
  "silkbindJade-umbdrone-26hit",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
  "silkbindJade-umbq",
  "silkbindJade-umbq-prepull",
  "silkbindJade-umblightcharge",
  "silkbindJade-umb-heavylight",
  "silkbindJade-fanqcancel",
]

const CHECKED_FIELDS = ["tags", "receives", "triggersBuffs", "hits"] as const

const STORE = storeV27File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v27 fixture", () => {
  it("is v27 and still stores the pre-V28 shape for every healed skill", () => {
    expect(STORE.v).toBe(V28__silkbindJadeValuesGatesReach.to - 1)
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

describe("healSilkbindJadeValuesGatesReach", () => {
  it("rewrites every untouched seeded copy to the current built-in's shape", () => {
    for (const id of HEALED_IDS) {
      const healed = healSilkbindJadeValuesGatesReach(clone(skillIn(STORE, id))) as Skill
      const builtin = builtinOf(id)
      for (const field of CHECKED_FIELDS)
        expect(healed[field], `${id}.${field}`).toEqual(builtin[field])
    }
  })

  it("leaves an edited copy alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanqcancel"))
    edited.triggersBuffs = [...(edited.triggersBuffs ?? []), "userAddedBuff"]
    expect(healSilkbindJadeValuesGatesReach(clone(edited))).toEqual(edited)
  })

  it("leaves skills the migration does not target alone", () => {
    for (const id of ["silkbindJade-fanq", "silkbindJade-fanspecial"]) {
      const untouched = clone(skillIn(STORE, id))
      expect(healSilkbindJadeValuesGatesReach(clone(untouched)), id).toEqual(untouched)
    }
  })
})

describe("V28__silkbindJadeValuesGatesReach — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const after = V28__silkbindJadeValuesGatesReach.migrate(clone(STORE))
    expect(after.v).toBe(28)
    for (const id of HEALED_IDS) {
      const builtin = builtinOf(id)
      for (const field of CHECKED_FIELDS)
        expect(skillIn(after, id)[field], `${id}.${field}`).toEqual(builtin[field])
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V28__silkbindJadeValuesGatesReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V28__silkbindJadeValuesGatesReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V28__silkbindJadeValuesGatesReach — through the chain", () => {
  it("is registered and is exactly what the v27 → v28 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V28__silkbindJadeValuesGatesReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 28 })!
    expect(result.applied).toEqual(["V28__silkbindJadeValuesGatesReach"])
    expect(result.blob.v).toBe(28)
    for (const id of HEALED_IDS) expect(skillIn(result.blob, id).hits).toEqual(builtinOf(id).hits)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("lands on the current built-in's shape after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      const builtin = builtinOf(id)
      for (const field of CHECKED_FIELDS) {
        const expected = field === "hits" ? builtin[field] : (builtin[field] ?? [])
        expect(skill[field], `${id}.${field}`).toEqual(expected)
      }
    }
  })
})
