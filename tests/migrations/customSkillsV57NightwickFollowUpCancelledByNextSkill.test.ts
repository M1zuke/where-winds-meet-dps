import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V57__nightwickFollowUpCancelledByNextSkill,
  healSkill,
} from "../../src/migrations/customSkills/V57__nightwickFollowUpCancelledByNextSkill"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV56File from "./testCustomSkills/v56/store.json"

const CLASS = "bamboocutDraught"
const TARGET_ID = "bamboocutDraught-nightwick-primepick-follow-up-cancel"
const STORE = storeV56File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = builtinSkillsForClass(CLASS).find((skill) => skill.id === TARGET_ID)!

describe("custom-skills v56 fixture", () => {
  it("is v56 and still has no cancelledBy on the seeded follow-up cancel", () => {
    expect(STORE.v).toBe(V57__nightwickFollowUpCancelledByNextSkill.to - 1)
    expect(skillIn(STORE, TARGET_ID).cancelledBy).toBeUndefined()
  })

  it("the built-in now carries cancelledBy: nextSkill", () => {
    expect(builtin.cancelledBy).toBe("nextSkill")
  })
})

describe("healSkill", () => {
  it("adds cancelledBy: nextSkill to the untouched seeded copy", () => {
    const healed = healSkill(clone(skillIn(STORE, TARGET_ID))) as Skill
    expect(healed.cancelledBy).toBe("nextSkill")
  })

  it("every other field survives the hop unchanged", () => {
    const original = clone(skillIn(STORE, TARGET_ID))
    const healed = healSkill(clone(original)) as Skill
    const { cancelledBy: _droppedCancelledBy, ...originalRest } = original
    const { cancelledBy: _healedCancelledBy, ...healedRest } = healed
    expect(healedRest).toEqual(originalRest)
  })

  it("leaves an already-set cancelledBy alone", () => {
    const edited = { ...clone(skillIn(STORE, TARGET_ID)), cancelledBy: "deflectCancel" as const }
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a skill the migration does not target alone", () => {
    const other = { ...clone(skillIn(STORE, TARGET_ID)), id: "not-the-target-skill" }
    expect(healSkill(clone(other))).toEqual(other)
  })
})

describe("V57__nightwickFollowUpCancelledByNextSkill — called directly", () => {
  it("rewrites the untouched seeded copy and nothing else", () => {
    const after = V57__nightwickFollowUpCancelledByNextSkill.migrate(clone(STORE))
    expect(after.v).toBe(57)
    expect((after.skills as Skill[]).find((skill) => skill.id === TARGET_ID)!.cancelledBy).toBe(
      "nextSkill",
    )
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V57__nightwickFollowUpCancelledByNextSkill.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V57__nightwickFollowUpCancelledByNextSkill.migrate(clone(once))).toEqual(once)
  })
})

describe("V57__nightwickFollowUpCancelledByNextSkill — through the chain", () => {
  it("is registered and is exactly what the v56 → v57 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V57__nightwickFollowUpCancelledByNextSkill)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 57 })!
    expect(result.applied).toEqual(["V57__nightwickFollowUpCancelledByNextSkill"])
    expect(result.blob.v).toBe(57)
    expect(skillIn(result.blob, TARGET_ID).cancelledBy).toBe("nextSkill")
  })
})
