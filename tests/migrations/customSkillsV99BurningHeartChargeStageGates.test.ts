import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V99__burningHeartChargeStageGates,
  healSkill,
} from "../../src/migrations/customSkills/V99__burningHeartChargeStageGates"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV98File from "./testCustomSkills/v98/store.json"

const STORE = storeV98File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = [
  "stonesplitStrength-phalanxcharged-s2",
  "stonesplitStrength-phalanxcharged-s3",
  "stonesplitStrength-phalanxcharged-s2-innerpassion",
  "stonesplitStrength-phalanxcharged-s3-innerpassion",
]
const UNTOUCHED_ID = "stonesplitStrength-heng-dash"
const USER_AUTHORED_ID = "sk-user-authored-charge"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("stonesplitStrength").find((skill) => skill.id === id)!

const chargeFieldsOf = (skill: Skill) => ({
  castConditions: skill.castConditions,
  meterCosts: skill.meterCosts,
  meterDrains: skill.meterDrains,
  releaseGates: skill.releaseGates,
})

describe("custom-skills v98 fixture", () => {
  it("is v98 and carries the old gate and the cost at the press", () => {
    expect(STORE.v).toBe(V99__burningHeartChargeStageGates.to - 1)
    for (const id of HEALED_IDS) {
      const skill = skillIn(STORE, id)
      expect(skill.castConditions, id).toBeDefined()
      expect(skill.meterCosts![0]!.atFrame, id).toBeUndefined()
      expect(skill.meterDrains, id).toBeUndefined()
      expect(skill.releaseGates, id).toBeUndefined()
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's charge fields", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(chargeFieldsOf(healed)).toEqual(chargeFieldsOf(builtinOf(id)))
    expect(healed.hits).toEqual(skillIn(STORE, id).hits)
  })

  it("leaves a copy whose gate was edited away from what was seeded alone", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.castConditions = [{ buffId: "meter:bladeMomentum", op: "gt", stacks: 40 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy whose cost was edited away from what was seeded alone", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.meterCosts = [{ meterId: "bladeMomentum", amount: 40 }]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("keeps an edit to the hits while healing the charge fields", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.hits[1]!.frame = 120
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[1]!.frame).toBe(120)
    expect(chargeFieldsOf(healed)).toEqual(chargeFieldsOf(builtinOf(HEALED_IDS[0]!)))
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

describe("V99__burningHeartChargeStageGates — called directly", () => {
  it("heals the four charge forms and keeps every other skill", () => {
    const after = V99__burningHeartChargeStageGates.migrate(clone(STORE))
    expect(after.v).toBe(99)
    for (const id of HEALED_IDS)
      expect(chargeFieldsOf(skillIn(after, id)), id).toEqual(chargeFieldsOf(builtinOf(id)))
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V99__burningHeartChargeStageGates.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V99__burningHeartChargeStageGates — through the chain", () => {
  it("is registered and is exactly what the v98 → v99 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V99__burningHeartChargeStageGates)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 99 })!
    expect(result.applied).toEqual(["V99__burningHeartChargeStageGates"])
    expect(result.blob.v).toBe(99)
  })
})
