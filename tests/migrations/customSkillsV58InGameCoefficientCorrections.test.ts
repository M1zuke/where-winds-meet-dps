import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V58__inGameCoefficientCorrections,
  healSkill,
} from "../../src/migrations/customSkills/V58__inGameCoefficientCorrections"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV57File from "./testCustomSkills/v57/store.json"

const DRONE_TICK_ID = "silkbindJade-umbdrone-12hit"
const SEEDED_THROW_ID = "silkbindJade-umbdronelaunch-12hit"
const EDITED_THROW_ID = "silkbindJade-umbdronelaunch-16hit"
const USER_AUTHORED_ID = "sk-user-authored-drone"
const STORE = storeV57File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v57 fixture", () => {
  it("is v57 and still stores the superseded drone rows", () => {
    expect(STORE.v).toBe(V58__inGameCoefficientCorrections.to - 1)
    expect(skillIn(STORE, DRONE_TICK_ID).elevatedAttributeMultiplier).toBe(false)
    expect(skillIn(STORE, SEEDED_THROW_ID).hits[0].physMultiplier).toBe(0.54)
  })

  it("the built-in drone tick no longer opts out of the attribute multiplier", () => {
    expect(builtinOf(DRONE_TICK_ID).elevatedAttributeMultiplier).not.toBe(false)
  })
})

describe("healSkill", () => {
  it("drops the stale flag from a seeded drone tick and keeps every other field", () => {
    const original = clone(skillIn(STORE, DRONE_TICK_ID))
    const healed = healSkill(clone(original)) as Skill
    const { elevatedAttributeMultiplier: _dropped, ...originalRest } = original
    expect(healed).toEqual(originalRest)
  })

  it("rewrites an untouched seeded throw row to the built-in's", () => {
    const healed = healSkill(clone(skillIn(STORE, SEEDED_THROW_ID))) as Skill
    const [builtinHit] = builtinOf(SEEDED_THROW_ID).hits
    expect(healed.hits[0].physMultiplier).toBe(builtinHit.physMultiplier)
    expect(healed.hits[0].attributeMultiplier).toBe(builtinHit.attributeMultiplier)
    expect(healed.hits[0].attributeFixed).toBe(builtinHit.attributeFixed)
  })

  it("leaves an edited throw row alone", () => {
    const edited = clone(skillIn(STORE, EDITED_THROW_ID))
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored skill alone, flag included", () => {
    const authored = clone(skillIn(STORE, USER_AUTHORED_ID))
    expect(healSkill(clone(authored))).toEqual(authored)
  })
})

describe("V58__inGameCoefficientCorrections — called directly", () => {
  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V58__inGameCoefficientCorrections.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V58__inGameCoefficientCorrections.migrate(clone(once))).toEqual(once)
  })
})

describe("V58__inGameCoefficientCorrections — through the chain", () => {
  it("is registered and is exactly what the v57 → v58 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V58__inGameCoefficientCorrections)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 58 })!
    expect(result.applied).toEqual(["V58__inGameCoefficientCorrections"])
    expect(result.blob.v).toBe(58)
    expect("elevatedAttributeMultiplier" in skillIn(result.blob, DRONE_TICK_ID)).toBe(false)
    expect(skillIn(result.blob, SEEDED_THROW_ID).hits).toEqual(builtinOf(SEEDED_THROW_ID).hits)
    expect(skillIn(result.blob, USER_AUTHORED_ID).elevatedAttributeMultiplier).toBe(false)
  })
})
