import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V100__burningHeartLowStageReleaseTiming,
  healSkill,
} from "../../src/migrations/customSkills/V100__burningHeartLowStageReleaseTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV99File from "./testCustomSkills/v99/store.json"

const STORE = storeV99File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = [
  "stonesplitStrength-phalanxcharged-s2",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-phalanxcharged-s2-innerpassion",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
]
const UNTOUCHED_ID = "stonesplitStrength-heng-dash"
const USER_AUTHORED_ID = "sk-user-authored-charge"
const TAPPED_STAGE_1_ID = "stonesplitStrength-phalanxcharged-s1"
const RELEASED_STAGE_1_ID = "stonesplitStrength-phalanxcharged-s1-released"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("stonesplitStrength").find((skill) => skill.id === id)!

const releaseFieldsOf = (skill: Skill) => ({
  releaseGates: skill.releaseGates,
  meterDrains: skill.meterDrains,
})

describe("custom-skills v99 fixture", () => {
  it("is v99 and still releases onto the tapped stage 1", () => {
    expect(STORE.v).toBe(V100__burningHeartLowStageReleaseTiming.to - 1)
    for (const id of HEALED_IDS)
      expect(skillIn(STORE, id).releaseGates![0]!.fallbackSkillId, id).toBe(TAPPED_STAGE_1_ID)
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's release fields", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(releaseFieldsOf(healed)).toEqual(releaseFieldsOf(builtinOf(id)))
    expect(healed.releaseGates![0]!.fallbackSkillId).toBe(RELEASED_STAGE_1_ID)
  })

  it("leaves a copy whose gate was edited away from what was seeded alone", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.releaseGates![0]!.atFrame = 25
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy whose drain was edited away from what was seeded alone", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.meterDrains![0]!.perSecond = 8
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
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

describe("V100__burningHeartLowStageReleaseTiming — called directly", () => {
  it("heals the four charge forms and keeps every other skill", () => {
    const after = V100__burningHeartLowStageReleaseTiming.migrate(clone(STORE))
    expect(after.v).toBe(100)
    for (const id of HEALED_IDS)
      expect(releaseFieldsOf(skillIn(after, id)), id).toEqual(releaseFieldsOf(builtinOf(id)))
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V100__burningHeartLowStageReleaseTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V100__burningHeartLowStageReleaseTiming — through the chain", () => {
  it("is registered and is exactly what the v99 → v100 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V100__burningHeartLowStageReleaseTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 100 })!
    expect(result.applied).toEqual(["V100__burningHeartLowStageReleaseTiming"])
    expect(result.blob.v).toBe(100)
  })
})
