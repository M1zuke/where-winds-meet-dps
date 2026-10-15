import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V84__jadeHitLandingsGrantsAndClipTimings,
  healSkill,
} from "../../src/migrations/customSkills/V84__jadeHitLandingsGrantsAndClipTimings"
import { healSkill as healJadeAvailabilityAndRecharge } from "../../src/migrations/customSkills/V85__jadeAvailabilityAndRecharge"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV83File from "./testCustomSkills/v83/store.json"

const STORE = storeV83File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-umbrella-slash"
const UNTOUCHED_ID = "silkbindJade-umblightcharge"
const HEALED_IDS = [
  "silkbindJade-fanlightcharged",
  "silkbindJade-fanspecial",
  "silkbindJade-fanq",
  "silkbindJade-fanqcancel",
  "silkbindJade-umbq",
  "silkbindJade-umbq-prepull",
  "silkbindJade-umbdronelaunch",
  "silkbindJade-umbdronelaunch-12hit",
  "silkbindJade-umbdronelaunch-16hit",
  "silkbindJade-umbdronelaunch-20hit",
  "silkbindJade-umbdronelaunch-23hit",
  "silkbindJade-umbdronelaunch-26hit",
  "silkbindJade-umbdrone",
  "silkbindJade-umbdrone-12hit",
  "silkbindJade-umbdrone-16hit",
  "silkbindJade-umbdrone-20hit",
  "silkbindJade-umbdrone-23hit",
  "silkbindJade-umbdrone-26hit",
  "silkbindJade-fanheavypursuit-3-hit",
  "silkbindJade-fanheavypursuit-5-hit",
]
const CHECKED_FIELDS = [
  "castFrames",
  "reachMeters",
  "triggersBuffs",
  "triggersBuffsAtFrame",
  "hits",
] as const

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

const sortedReceives = (skill: Skill): string[] => [...(skill.receives ?? [])].sort()

describe("custom-skills v83 fixture", () => {
  it("is v83 and still stores the old shape for every healed skill", () => {
    expect(STORE.v).toBe(V84__jadeHitLandingsGrantsAndClipTimings.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      const builtin = builtinOf(id)
      const diverges =
        CHECKED_FIELDS.some(
          (field) => JSON.stringify(seeded[field]) !== JSON.stringify(builtin[field]),
        ) || JSON.stringify(sortedReceives(seeded)) !== JSON.stringify(sortedReceives(builtin))
      expect(diverges, id).toBe(true)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healJadeAvailabilityAndRecharge(healSkill(clone(skillIn(STORE, id)))) as Skill
    const builtin = builtinOf(id)
    for (const field of CHECKED_FIELDS)
      expect(healed[field], `${id}.${field}`).toEqual(builtin[field])
    expect(sortedReceives(healed)).toEqual(sortedReceives(builtin))
  })

  it("leaves a copy whose cast length was edited without touching its other parts", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanlightcharged"))
    edited.castFrames = 120
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(120)
    expect(healed.hits[0]!.frame).toBe(builtinOf(edited.id).hits[0]!.frame)
  })

  it("leaves a copy whose hit frame was edited alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-umbq"))
    edited.hits[0]!.frame = 40
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.frame).toBe(40)
    expect(healed.castFrames).toBe(builtinOf(edited.id).castFrames)
  })

  it("leaves a copy whose receives list was edited alone", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-umbq"))
    edited.receives = [...edited.receives!, "userAddedBuff"]
    expect((healSkill(clone(edited)) as Skill).receives).toEqual(edited.receives)
  })

  it("keeps a reach the copy was given", () => {
    const edited = clone(skillIn(STORE, "silkbindJade-fanlightcharged"))
    edited.reachMeters = 6
    expect((healSkill(clone(edited)) as Skill).reachMeters).toBe(6)
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

describe("V84__jadeHitLandingsGrantsAndClipTimings — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V84__jadeHitLandingsGrantsAndClipTimings.migrate(clone(STORE))
    expect(after.v).toBe(84)
    for (const id of HEALED_IDS)
      expect((healJadeAvailabilityAndRecharge(skillIn(after, id)) as Skill).hits, id).toEqual(
        builtinOf(id).hits,
      )
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V84__jadeHitLandingsGrantsAndClipTimings.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V84__jadeHitLandingsGrantsAndClipTimings — through the chain", () => {
  it("is registered and is exactly what the v83 → v84 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V84__jadeHitLandingsGrantsAndClipTimings)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 84 })!
    expect(result.applied).toEqual(["V84__jadeHitLandingsGrantsAndClipTimings"])
    expect(result.blob.v).toBe(84)
  })
})
