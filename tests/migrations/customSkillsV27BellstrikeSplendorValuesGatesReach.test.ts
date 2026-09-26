import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V27__bellstrikeSplendorValuesGatesReach,
  healBellstrikeSplendorValuesGatesReach,
} from "../../src/migrations/customSkills/V27__bellstrikeSplendorValuesGatesReach"
import { healSkill as healSwordMorphMultiWaveWindow } from "../../src/migrations/customSkills/V36__swordMorphMultiWaveWindow"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV26File from "./testCustomSkills/v26/store.json"

const CLASS = "bellstrikeSplendor"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const HEALED_IDS = [
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-swordheavycharged-2-hit",
  "bellstrikeSplendor-energysurge",
  "bellstrikeSplendor-swordq",
  "bellstrikeSplendor-swordq-2nd",
  "bellstrikeSplendor-swordspecial",
  "bellstrikeSplendor-swordspecial-2nd",
  "bellstrikeSplendor-swordspecial-deflect",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-spearq-0-hit-cancel",
]
const EDITED_ID = "bellstrikeSplendor-spearq"
const USER_AUTHORED_ID = "sk-user-authored-splendor-slash"

const CHECKED_FIELDS = ["receives", "triggersBuffs", "hits", "castConditions"] as const

const STORE = storeV26File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

// A no-op on the ids V36 doesn't touch — composing it is what keeps this
// hop's own output lined up with the live built-in.
const throughLaterHops = (skill: unknown): Skill => healSwordMorphMultiWaveWindow(skill) as Skill

describe("custom-skills v26 fixture", () => {
  it("is v26 and still stores the pre-V27 shape for every healed skill", () => {
    expect(STORE.v).toBe(V27__bellstrikeSplendorValuesGatesReach.to - 1)
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

describe("healBellstrikeSplendorValuesGatesReach", () => {
  it("rewrites every untouched seeded copy to the current built-in's shape", () => {
    for (const id of HEALED_IDS) {
      const healed = throughLaterHops(
        healBellstrikeSplendorValuesGatesReach(clone(skillIn(STORE, id))),
      )
      const builtin = builtinOf(id)
      for (const field of CHECKED_FIELDS)
        expect(healed[field], `${id}.${field}`).toEqual(builtin[field])
    }
  })

  it("leaves an edited copy alone", () => {
    const edited = clone(skillIn(STORE, EDITED_ID))
    expect(healBellstrikeSplendorValuesGatesReach(clone(edited))).toEqual(edited)
  })

  it("leaves skills the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, USER_AUTHORED_ID))
    expect(healBellstrikeSplendorValuesGatesReach(clone(untouched))).toEqual(untouched)
  })
})

describe("V27__bellstrikeSplendorValuesGatesReach — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const after = V27__bellstrikeSplendorValuesGatesReach.migrate(clone(STORE))
    expect(after.v).toBe(27)
    for (const id of HEALED_IDS) {
      const healed = throughLaterHops(skillIn(after, id))
      const builtin = builtinOf(id)
      for (const field of CHECKED_FIELDS)
        expect(healed[field], `${id}.${field}`).toEqual(builtin[field])
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V27__bellstrikeSplendorValuesGatesReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V27__bellstrikeSplendorValuesGatesReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V27__bellstrikeSplendorValuesGatesReach — through the chain", () => {
  it("is registered and is exactly what the v26 → v27 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V27__bellstrikeSplendorValuesGatesReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 27 })!
    expect(result.applied).toEqual(["V27__bellstrikeSplendorValuesGatesReach"])
    expect(result.blob.v).toBe(27)
    for (const id of HEALED_IDS)
      expect(throughLaterHops(skillIn(result.blob, id)).hits).toEqual(builtinOf(id).hits)
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
        // The hydrator normalizes an absent field to `[]` when the built-in
        // never authors it at all — the migration's own scope is what this
        // suite checks elsewhere, not the hydrator's defaulting.
        const expected =
          field === "hits" || field === "castConditions" ? builtin[field] : (builtin[field] ?? [])
        expect(skill[field], `${id}.${field}`).toEqual(expected)
      }
    }
  })
})
