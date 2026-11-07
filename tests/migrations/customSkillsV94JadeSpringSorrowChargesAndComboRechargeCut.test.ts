import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V94__jadeSpringSorrowChargesAndComboRechargeCut,
  healSkill,
} from "../../src/migrations/customSkills/V94__jadeSpringSorrowChargesAndComboRechargeCut"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV93File from "./testCustomSkills/v93/store.json"

const STORE = storeV93File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SPRING_SORROW_ID = "silkbindJade-umbq"
const USER_AUTHORED_ID = "sk-user-authored-umbrella-slash"
const UNTOUCHED_IDS = ["silkbindJade-umbq-prepull", "silkbindJade-fanlightcharged"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("silkbindJade").find((skill) => skill.id === id)!

describe("custom-skills v93 fixture", () => {
  it("is v93 and still skips Spring Sorrow's charge at rank 6 with no recharge cut", () => {
    expect(STORE.v).toBe(V94__jadeSpringSorrowChargesAndComboRechargeCut.to - 1)
    const seeded = skillIn(STORE, SPRING_SORROW_ID)
    expect(seeded.meterCosts).not.toEqual(builtinOf(SPRING_SORROW_ID).meterCosts)
    expect(seeded.hits[0]!.triggers).toEqual([])
  })
})

describe("healSkill", () => {
  it("lands the untouched Spring Sorrow copy's cost and cut on the built-in", () => {
    const healed = healSkill(clone(skillIn(STORE, SPRING_SORROW_ID))) as Skill
    const builtin = builtinOf(SPRING_SORROW_ID)
    expect(healed.meterCosts).toEqual(builtin.meterCosts)
    expect(healed.hits[0]!.triggers).toEqual(builtin.hits[0]!.triggers)
  })

  it("leaves a cost the copy was edited to alone but still adds the cut to the untouched hit", () => {
    const edited = clone(skillIn(STORE, SPRING_SORROW_ID))
    edited.meterCosts = [{ meterId: "springSorrowCharges", amount: 450 }]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.meterCosts).toEqual(edited.meterCosts)
    expect(healed.hits[0]!.triggers).toHaveLength(1)
  })

  it("leaves a hit whose triggers were edited alone", () => {
    const edited = clone(skillIn(STORE, SPRING_SORROW_ID))
    edited.hits[0]!.triggers = [
      { kind: "applyBuff", targetId: "userBuff", stacks: 1, condition: null },
    ]
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.hits[0]!.triggers).toEqual(edited.hits[0]!.triggers)
  })

  it("leaves every other skill and a user-authored one alone and is idempotent", () => {
    for (const id of [...UNTOUCHED_IDS, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, SPRING_SORROW_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V94__jadeSpringSorrowChargesAndComboRechargeCut — called directly", () => {
  it("heals Spring Sorrow and keeps every other skill", () => {
    const after = V94__jadeSpringSorrowChargesAndComboRechargeCut.migrate(clone(STORE))
    expect(after.v).toBe(94)
    expect(skillIn(after, SPRING_SORROW_ID).hits).toEqual(builtinOf(SPRING_SORROW_ID).hits)
    for (const skill of STORE.skills) {
      if (skill.id === SPRING_SORROW_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V94__jadeSpringSorrowChargesAndComboRechargeCut.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V94__jadeSpringSorrowChargesAndComboRechargeCut — through the chain", () => {
  it("is registered and is exactly what the v93 → v94 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V94__jadeSpringSorrowChargesAndComboRechargeCut)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 94 })!
    expect(result.applied).toEqual(["V94__jadeSpringSorrowChargesAndComboRechargeCut"])
    expect(result.blob.v).toBe(94)
  })
})
