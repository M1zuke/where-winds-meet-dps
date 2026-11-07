import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V91__draughtNightwickStanceAndVariedComboOverrides,
  healSkill,
} from "../../src/migrations/customSkills/V91__draughtNightwickStanceAndVariedComboOverrides"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV90File from "./testCustomSkills/v90/store.json"

const STORE = storeV90File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const UNTOUCHED_ID = "bamboocutDraught-peakfall"
const HEALED_IDS = (STORE.skills as Skill[])
  .map((skill) => skill.id)
  .filter((id) => id !== UNTOUCHED_ID)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

const gatedFieldsOf = (skill: Skill) => ({
  castConditions: skill.castConditions,
  hits: skill.hits,
})

describe("custom-skills v90 fixture", () => {
  it("is v90 and stores every healed skill without the new gates", () => {
    expect(STORE.v).toBe(V91__draughtNightwickStanceAndVariedComboOverrides.to - 1)
    for (const id of HEALED_IDS) {
      expect(JSON.stringify(gatedFieldsOf(skillIn(STORE, id))), id).not.toBe(
        JSON.stringify(gatedFieldsOf(builtinOf(id))),
      )
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's gates and hits", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(gatedFieldsOf(healed)).toEqual(gatedFieldsOf(builtinOf(id)))
  })

  it("leaves a follow-up copy that already carries a gate alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-nightwick-primepick-follow-up"))
    edited.castConditions = [{ buffId: "userGate", op: "gte", stacks: 1 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a Grounddrift copy with a changed hit count alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-nightwick-grounddrift"))
    edited.hits = edited.hits.slice(0, 4)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a Tipsylay copy with a changed hit count alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-nightwick-primepick"))
    edited.hits = edited.hits.slice(0, 1)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a Blade Vessel copy that already has a gate alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-blade-vessel"))
    edited.castConditions = [{ buffId: "userGate", op: "gte", stacks: 1 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched skill and a user-authored one alone and is idempotent", () => {
    const authored = { ...clone(skillIn(STORE, UNTOUCHED_ID)), id: "sk-user-authored-special" }
    for (const seeded of [skillIn(STORE, UNTOUCHED_ID), authored]) {
      expect(healSkill(clone(seeded)), seeded.id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V91__draughtNightwickStanceAndVariedComboOverrides — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V91__draughtNightwickStanceAndVariedComboOverrides.migrate(clone(STORE))
    expect(after.v).toBe(91)
    for (const id of HEALED_IDS)
      expect(gatedFieldsOf(skillIn(after, id)), id).toEqual(gatedFieldsOf(builtinOf(id)))
    expect(skillIn(after, UNTOUCHED_ID)).toEqual(skillIn(STORE, UNTOUCHED_ID))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V91__draughtNightwickStanceAndVariedComboOverrides.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("the chain", () => {
  it("is registered and is exactly what the v90 → v91 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V91__draughtNightwickStanceAndVariedComboOverrides)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 91 })!
    expect(result.applied).toEqual(["V91__draughtNightwickStanceAndVariedComboOverrides"])
    expect(result.blob.v).toBe(91)
  })
})
