import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V55__ghostlyStepsEnduranceCostReduction,
  healSkill,
} from "../../src/migrations/customSkills/V55__ghostlyStepsEnduranceCostReduction"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV54File from "./testCustomSkills/v54/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const GRANT_TARGET_ID = "mirageEnduranceCostReduction"
const TARGET_IDS = [
  "bellstrikeUmbra-ghostly-steps",
  "bellstrikeSplendor-ghostly-steps",
  "stonesplitStrength-ghostly-steps",
  "bamboocutDraught-ghostly-steps",
  "silkbindJade-ghostly-steps",
]

const STORE = storeV54File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const grantsCostReduction = (skill: Skill): boolean =>
  skill.hits[0].triggers.some(
    (trigger) => trigger.kind === "applyBuff" && trigger.targetId === GRANT_TARGET_ID,
  )

describe("custom-skills v54 fixture", () => {
  it("is v54 and every Ghostly Steps copy still lacks the Endurance cost reduction grant", () => {
    expect(STORE.v).toBe(V55__ghostlyStepsEnduranceCostReduction.to - 1)
    for (const id of TARGET_IDS) {
      const skill = skillIn(STORE, id)
      expect(skill, id).toBeTruthy()
      expect(grantsCostReduction(skill), id).toBe(false)
    }
  })
})

describe("healSkill", () => {
  for (const id of TARGET_IDS) {
    it(`adds the Mirage Endurance cost reduction grant to ${id}`, () => {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(grantsCostReduction(healed)).toBe(true)
    })
  }

  it("does not double-heal a copy that already carries the grant", () => {
    const once = healSkill(clone(skillIn(STORE, TARGET_IDS[0]))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "silkbindJade-umb-heavylight")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V55__ghostlyStepsEnduranceCostReduction — called directly", () => {
  it("heals every targeted id and leaves every other skill untouched", () => {
    const after = V55__ghostlyStepsEnduranceCostReduction.migrate(clone(STORE))
    expect(after.v).toBe(55)
    for (const id of TARGET_IDS) expect(grantsCostReduction(skillIn(after, id))).toBe(true)

    for (const skill of STORE.skills) {
      if (TARGET_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V55__ghostlyStepsEnduranceCostReduction.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V55__ghostlyStepsEnduranceCostReduction.migrate(clone(once))).toEqual(once)
  })
})

describe("V55__ghostlyStepsEnduranceCostReduction — through the chain", () => {
  it("is registered and is exactly what the v54 → v55 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V55__ghostlyStepsEnduranceCostReduction)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 55 })!
    expect(result.applied).toEqual(["V55__ghostlyStepsEnduranceCostReduction"])
    expect(result.blob.v).toBe(55)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V55__ghostlyStepsEnduranceCostReduction,
    )
    const result = runChain(withoutStep, 55, clone(STORE))!
    expect(result.applied).not.toContain("V55__ghostlyStepsEnduranceCostReduction")
    for (const id of TARGET_IDS) expect(grantsCostReduction(skillIn(result.blob, id))).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the grant after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of TARGET_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      expect(grantsCostReduction(skill)).toBe(true)
    }
  })
})
