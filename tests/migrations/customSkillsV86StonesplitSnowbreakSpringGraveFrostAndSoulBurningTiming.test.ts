import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming,
  healSkill,
} from "../../src/migrations/customSkills/V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming"
import { healSkill as healStonesplitFractionalFrameTiming } from "../../src/migrations/customSkills/V96__stonesplitFractionalFrameTiming"
import { healSkill as healBurningHeartChargeStageGates } from "../../src/migrations/customSkills/V99__burningHeartChargeStageGates"
import { healSkill as healBurningHeartLowStageReleaseTiming } from "../../src/migrations/customSkills/V100__burningHeartLowStageReleaseTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV85File from "./testCustomSkills/v85/store.json"

const STORE = storeV85File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-snowparting-slide"
const UNTOUCHED_ID = "stonesplitStrength-heng-dash"
const HEALED_IDS = [
  "stonesplitStrength-snowpartingvc",
  "stonesplitStrength-snowpartingvc-prepull",
  "stonesplitStrength-snowpartingcharged",
  "stonesplitStrength-snowpartingcharged-forgetfulness",
  "stonesplitStrength-snowpartingdual",
  "stonesplitStrength-snowpartingq-slash",
  "stonesplitStrength-snowpartingq-stab",
  "stonesplitStrength-snowpartingslide",
  "stonesplitStrength-snowpartingslide-prepull",
  "stonesplitStrength-snowpartingslide-prepull-hit",
  "stonesplitStrength-snowpartingspecial",
  "stonesplitStrength-phalanxq",
  "stonesplitStrength-phalanxq-supreme",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
]
const CHECKED_FIELDS = [
  "castConditions",
  "castFrames",
  "triggersBuffs",
  "triggersBuffsAtFrame",
  "hits",
] as const

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const healedThroughLaterSteps = (skill: unknown): Skill =>
  healBurningHeartLowStageReleaseTiming(
    healBurningHeartChargeStageGates(healStonesplitFractionalFrameTiming(skill)),
  ) as Skill

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("stonesplitStrength").find((skill) => skill.id === id)!

const fieldsOf = (skill: Skill) =>
  Object.fromEntries(CHECKED_FIELDS.map((field) => [field, skill[field]]))

describe("custom-skills v85 fixture", () => {
  it("is v85 and still stores the old shape for every healed skill", () => {
    expect(STORE.v).toBe(V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming.to - 1)
    for (const id of HEALED_IDS) {
      const diverges = CHECKED_FIELDS.some(
        (field) =>
          JSON.stringify(skillIn(STORE, id)[field]) !== JSON.stringify(builtinOf(id)[field]),
      )
      expect(diverges, id).toBe(true)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healedThroughLaterSteps(healSkill(clone(skillIn(STORE, id))))
    expect(fieldsOf(healed)).toEqual(fieldsOf(builtinOf(id)))
  })

  it("leaves hits alone on a Snowbreak Spring copy whose coefficient was edited", () => {
    const edited = clone(skillIn(STORE, "stonesplitStrength-snowpartingvc"))
    edited.hits[0]!.physMultiplier = 3
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits).toEqual(edited.hits)
    expect(healed.castConditions).toEqual(builtinOf(edited.id).castConditions)
  })

  it("leaves a lockout gate the copy already changed", () => {
    const edited = clone(skillIn(STORE, "stonesplitStrength-snowpartingvc"))
    edited.castConditions = [{ buffId: "userGate", op: "gte", stacks: 1 }]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castConditions).toEqual(edited.castConditions)
  })

  it("leaves a Total Annihilation copy whose lead was edited", () => {
    const edited = clone(skillIn(STORE, "stonesplitStrength-phalanxq"))
    edited.hits[0]!.frame = 12
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.frame).toBe(12)
  })

  it("leaves Jadeware triggers a copy added or removed itself", () => {
    const edited = clone(skillIn(STORE, "stonesplitStrength-snowpartingslide"))
    edited.triggersBuffs = ["userBuff"]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.triggersBuffs).toEqual(["userBuff"])
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

describe("V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming — called directly", () => {
  it("heals the targeted copies and keeps every other skill", () => {
    const after = V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming.migrate(clone(STORE))
    expect(after.v).toBe(86)
    for (const id of HEALED_IDS)
      expect(fieldsOf(healedThroughLaterSteps(skillIn(after, id))), id).toEqual(
        fieldsOf(builtinOf(id)),
      )
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("the chain", () => {
  it("is registered and is exactly what the v85 → v86 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(
      V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming,
    )
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 86 })!
    expect(result.applied).toEqual(["V86__stonesplitSnowbreakSpringGraveFrostAndSoulBurningTiming"])
    expect(result.blob.v).toBe(86)
  })
})
