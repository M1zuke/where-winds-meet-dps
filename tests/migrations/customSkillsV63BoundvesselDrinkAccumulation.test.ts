import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V63__boundvesselDrinkAccumulation,
  healSkill,
} from "../../src/migrations/customSkills/V63__boundvesselDrinkAccumulation"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV62File from "./testCustomSkills/v62/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV62File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const BOUNDVESSEL_ID = "bamboocutDraught-boundvessel"
const USER_SKILL_ID = "sk-user-authored-heavy"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const finishingSlash = (skill: Skill) => skill.hits.find((hit) => hit.id === "hit-12")!

const builtinBoundvessel = () =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === BOUNDVESSEL_ID)!

describe("custom-skills v62 fixture", () => {
  it("is v62 and its Boundvessel copy still has a finishing slash without triggers", () => {
    expect(STORE.v).toBe(V63__boundvesselDrinkAccumulation.to - 1)
    expect(finishingSlash(skillIn(STORE, BOUNDVESSEL_ID)).triggers).toEqual([])
  })
})

describe("healSkill", () => {
  it("gives the unedited finishing slash the built-in's accumulation triggers", () => {
    const healed = healSkill(clone(skillIn(STORE, BOUNDVESSEL_ID))) as Skill
    expect(finishingSlash(healed).triggers).toEqual(finishingSlash(builtinBoundvessel()).triggers)
    expect(finishingSlash(healed).triggers).toHaveLength(2)
  })

  it("keeps every other hit of the copy as it was", () => {
    const original = skillIn(STORE, BOUNDVESSEL_ID)
    const healed = healSkill(clone(original)) as Skill
    expect(healed.hits.filter((hit) => hit.id !== "hit-12")).toEqual(
      original.hits.filter((hit) => hit.id !== "hit-12"),
    )
  })

  it("leaves a finishing slash the user edited alone", () => {
    const edited = clone(skillIn(STORE, BOUNDVESSEL_ID))
    finishingSlash(edited).physMultiplier = 0.2
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a finishing slash that already has triggers alone", () => {
    const once = healSkill(clone(skillIn(STORE, BOUNDVESSEL_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, USER_SKILL_ID)
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V63__boundvesselDrinkAccumulation — called directly", () => {
  it("heals Boundvessel and nothing else", () => {
    const after = V63__boundvesselDrinkAccumulation.migrate(clone(STORE))
    expect(after.v).toBe(63)
    expect(finishingSlash(skillIn(after, BOUNDVESSEL_ID)).triggers).toHaveLength(2)
    expect(skillIn(after, USER_SKILL_ID)).toEqual(skillIn(STORE, USER_SKILL_ID))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V63__boundvesselDrinkAccumulation.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V63__boundvesselDrinkAccumulation.migrate(clone(once))).toEqual(once)
  })
})

describe("V63__boundvesselDrinkAccumulation — through the chain", () => {
  it("is registered and is exactly what the v62 → v63 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V63__boundvesselDrinkAccumulation)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 63 })!
    expect(result.applied).toEqual(["V63__boundvesselDrinkAccumulation"])
    expect(result.blob.v).toBe(63)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V63__boundvesselDrinkAccumulation,
    )
    const result = runChain(withoutStep, 63, clone(STORE))!
    expect(result.applied).not.toContain("V63__boundvesselDrinkAccumulation")
    expect(finishingSlash(skillIn(result.blob, BOUNDVESSEL_ID)).triggers).toEqual([])
  })
})

describe("the healed copy survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the triggers after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    expect(
      finishingSlash(loaded.find((skill) => skill.id === BOUNDVESSEL_ID)!).triggers,
    ).toHaveLength(2)
  })
})
