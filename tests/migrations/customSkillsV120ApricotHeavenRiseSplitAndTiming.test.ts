import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V120__apricotHeavenRiseSplitAndTiming,
  healSkill,
} from "../../src/migrations/customSkills/V120__apricotHeavenRiseSplitAndTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { withoutLevelRows } from "../helpers/withoutLevelRows"
import type { Skill } from "../../src/engine/skill"
import storeV119File from "./testCustomSkills/v119/store.json"

const STORE = storeV119File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const HEALED_IDS = ["silkbindJade-apricot-heaven-normal", "silkbindJade-apricot-heaven-enhanced"]
const UNTOUCHED_IDS = ["silkbindJade-umbq", "sk-user-authored-apricot"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!
const builtinOf = (id: string): Skill =>
  withoutLevelRows(builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!)

describe("custom-skills v119 fixture", () => {
  it("is v119 and stores both casts with the rise inside them at 54 frames", () => {
    expect(STORE.v).toBe(V120__apricotHeavenRiseSplitAndTiming.to - 1)
    for (const id of HEALED_IDS) expect(skillIn(STORE, id).hits[0]!.frame).toBe(54)
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in's hits", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const builtin = builtinOf(id)
    expect(healed.hits).toEqual(builtin.hits)
    expect(healed.meterDrains).toEqual(builtin.meterDrains)
  })

  it("keeps a copy whose hits were edited", () => {
    const edited = clone(skillIn(STORE, HEALED_IDS[0]!))
    edited.hits[1]!.physFixed = 1
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of UNTOUCHED_IDS) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V120__apricotHeavenRiseSplitAndTiming — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V120__apricotHeavenRiseSplitAndTiming.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v119 → v120 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V120__apricotHeavenRiseSplitAndTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 120 })!
    expect(result.applied).toEqual(["V120__apricotHeavenRiseSplitAndTiming"])
    expect(result.blob.v).toBe(120)
    for (const id of UNTOUCHED_IDS) expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
  })
})
