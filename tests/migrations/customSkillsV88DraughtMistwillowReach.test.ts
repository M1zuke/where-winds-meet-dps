import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V88__draughtMistwillowReach,
  healSkill,
} from "../../src/migrations/customSkills/V88__draughtMistwillowReach"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV87File from "./testCustomSkills/v87/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV87File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const UNTOUCHED_ID = "bamboocutDraught-peakfall"
const HEALED_IDS = (STORE.skills as Skill[])
  .map((skill) => skill.id)
  .filter((id) => id !== UNTOUCHED_ID)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

describe("custom-skills v87 fixture", () => {
  it("is v87 and stores every healed skill without the Mistwillow buffs", () => {
    expect(STORE.v).toBe(V88__draughtMistwillowReach.to - 1)
    for (const id of HEALED_IDS) {
      expect(skillIn(STORE, id).receives, id).not.toContain("mistwillowBuff")
      expect(skillIn(STORE, id).receives, id).not.toEqual(builtinOf(id).receives)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's receives", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(healed.receives).toEqual(builtinOf(id).receives)
  })

  it("gives a light attack the heavy stance's buff and a heavy attack the light stance's", () => {
    const light = healSkill(clone(skillIn(STORE, "bamboocutDraught-bloombreak"))) as Skill
    expect(light.receives).toEqual(
      expect.arrayContaining(["mistwillowHeavyBuff", "mistwillowBuff"]),
    )
    expect(light.receives).not.toContain("mistwillowLightBuff")
    const heavy = healSkill(clone(skillIn(STORE, "bamboocutDraught-tidepour"))) as Skill
    expect(heavy.receives).toEqual(
      expect.arrayContaining(["mistwillowLightBuff", "mistwillowBuff"]),
    )
    expect(heavy.receives).not.toContain("mistwillowHeavyBuff")
  })

  it("leaves a copy whose receives were edited alone", () => {
    const edited = clone(skillIn(STORE, "bamboocutDraught-bloombreak"))
    edited.receives = ["swallowcallLightAttackBoost"]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched skill and a user-authored one alone and is idempotent", () => {
    const authored = { ...clone(skillIn(STORE, UNTOUCHED_ID)), id: "sk-user-authored-light" }
    for (const seeded of [skillIn(STORE, UNTOUCHED_ID), authored]) {
      expect(healSkill(clone(seeded)), seeded.id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V88__draughtMistwillowReach — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V88__draughtMistwillowReach.migrate(clone(STORE))
    expect(after.v).toBe(88)
    for (const id of HEALED_IDS)
      expect(skillIn(after, id).receives, id).toEqual(builtinOf(id).receives)
    expect(skillIn(after, UNTOUCHED_ID)).toEqual(skillIn(STORE, UNTOUCHED_ID))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V88__draughtMistwillowReach.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("the chain", () => {
  it("is registered and is exactly what the v87 → v88 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V88__draughtMistwillowReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 88 })!
    expect(result.applied).toEqual(["V88__draughtMistwillowReach"])
    expect(result.blob.v).toBe(88)
  })
})

describe("the loaded copy picks up the built-in's new tags", () => {
  beforeEach(() => localStorage.clear())

  it("carries the Mistwillow attack tags and the Inebriate-enhanced role after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      for (const tag of builtinOf(id).tags ?? []) expect(skill.tags, id).toContain(tag)
    }
  })
})
