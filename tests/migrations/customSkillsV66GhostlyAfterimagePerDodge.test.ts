import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V66__ghostlyAfterimagePerDodge,
  healSkill,
} from "../../src/migrations/customSkills/V66__ghostlyAfterimagePerDodge"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV65File from "./testCustomSkills/v65/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV65File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const DODGE_ID = "bellstrikeUmbra-perfect-dodge"
const OLD_TARGET = "debuff-mystic-ghostly-afterimage"
const NEW_TARGET = "mystic-ghostly-afterimage"
const USER_AUTHORED_ID = "sk-user-authored-vessel"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinAfterimageTriggers = () =>
  builtinSkillsForClass("bellstrikeUmbra")
    .find((skill) => skill.id === DODGE_ID)!
    .hits[0]!.triggers.filter((trigger) => trigger.targetId === NEW_TARGET)

describe("custom-skills v65 fixture", () => {
  it("is v65 and the seeded perfect dodge still applies the afterimage debuff", () => {
    expect(STORE.v).toBe(V66__ghostlyAfterimagePerDodge.to - 1)
    const triggers = skillIn(STORE, DODGE_ID).hits[0]!.triggers
    expect(triggers.some((trigger) => trigger.targetId === OLD_TARGET)).toBe(true)
  })
})

describe("healSkill", () => {
  it("lands the seeded perfect dodge's afterimage trigger on the built-in's", () => {
    const healed = healSkill(clone(skillIn(STORE, DODGE_ID))) as Skill
    expect(healed.hits[0]!.triggers).toEqual(builtinAfterimageTriggers())
    expect(healed.hits[0]!.triggers.some((trigger) => trigger.targetId === OLD_TARGET)).toBe(false)
  })

  it("keeps the other triggers a copy carries, in place", () => {
    const seeded = skillIn(STORE, DODGE_ID)
    const healed = healSkill(clone(seeded)) as Skill
    expect(healed.hits[0]!.triggers).toHaveLength(seeded.hits[0]!.triggers.length)
    seeded.hits[0]!.triggers.forEach((trigger, index) => {
      if (trigger.targetId === OLD_TARGET) return
      expect(healed.hits[0]!.triggers[index]).toEqual(trigger)
    })
  })

  it("leaves a copy whose afterimage trigger was edited alone", () => {
    const edited = clone(skillIn(STORE, DODGE_ID))
    const afterimage = edited.hits[0]!.triggers.find((trigger) => trigger.targetId === OLD_TARGET)!
    afterimage.stacks = 2
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored skill alone", () => {
    const authored = { ...clone(skillIn(STORE, DODGE_ID)), id: USER_AUTHORED_ID }
    expect(healSkill(clone(authored))).toEqual(authored)
  })

  it("does not heal a copy twice", () => {
    const once = healSkill(clone(skillIn(STORE, DODGE_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V66__ghostlyAfterimagePerDodge — called directly", () => {
  it("heals the perfect dodge and leaves every other skill identical", () => {
    const after = V66__ghostlyAfterimagePerDodge.migrate(clone(STORE))
    expect(after.v).toBe(66)
    expect(skillIn(after, DODGE_ID).hits[0]!.triggers).toEqual(builtinAfterimageTriggers())
    for (const skill of STORE.skills) {
      if (skill.id === DODGE_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V66__ghostlyAfterimagePerDodge.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V66__ghostlyAfterimagePerDodge.migrate(clone(once))).toEqual(once)
  })
})

describe("V66__ghostlyAfterimagePerDodge — through the chain", () => {
  it("is registered and is exactly what the v65 → v66 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V66__ghostlyAfterimagePerDodge)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 66 })!
    expect(result.applied).toEqual(["V66__ghostlyAfterimagePerDodge"])
    expect(result.blob.v).toBe(66)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V66__ghostlyAfterimagePerDodge,
    )
    const result = runChain(withoutStep, 66, clone(STORE))!
    expect(result.applied).not.toContain("V66__ghostlyAfterimagePerDodge")
    expect(skillIn(result.blob, DODGE_ID)).toEqual(skillIn(STORE, DODGE_ID))
  })
})

describe("the healed perfect dodge survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("casts the afterimage skill after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const dodge = loadCustomSkills().find((candidate) => candidate.id === DODGE_ID)!
    expect(dodge.hits[0]!.triggers).toEqual(builtinAfterimageTriggers())
  })
})
