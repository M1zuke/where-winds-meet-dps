import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V51__relentlessChaseSecondStrike,
  healSkill,
} from "../../src/migrations/customSkills/V51__relentlessChaseSecondStrike"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV50File from "./testCustomSkills/v50/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const TARGET_ID = "bellstrikeSplendor-swordq-2nd"

const STORE = storeV50File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

function grantsWindow(skill: Skill): boolean {
  const hit0 = skill.hits[0]!
  return hit0.triggers.some(
    (trigger) => trigger.kind === "applyBuff" && trigger.targetId === "relentlessChaseWindow",
  )
}

describe("custom-skills v50 fixture", () => {
  it("is v50 and still lacks the Relentless Chase window grant", () => {
    expect(STORE.v).toBe(V51__relentlessChaseSecondStrike.to - 1)
    expect(grantsWindow(skillIn(STORE, TARGET_ID))).toBe(false)
  })
})

describe("healSkill", () => {
  it("adds the relentlessChaseWindow grant to Relentless Chase's first hit", () => {
    const healed = healSkill(clone(skillIn(STORE, TARGET_ID))) as Skill
    expect(grantsWindow(healed)).toBe(true)
  })

  it("does not double-heal a copy that already carries it", () => {
    const once = healSkill(clone(skillIn(STORE, TARGET_ID))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-bleed-detonation")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V51__relentlessChaseSecondStrike — called directly", () => {
  it("heals the targeted id and leaves every other skill untouched", () => {
    const after = V51__relentlessChaseSecondStrike.migrate(clone(STORE))
    expect(after.v).toBe(51)
    expect(grantsWindow(skillIn(after, TARGET_ID))).toBe(true)

    for (const skill of STORE.skills) {
      if (skill.id === TARGET_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V51__relentlessChaseSecondStrike.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V51__relentlessChaseSecondStrike.migrate(clone(once))).toEqual(once)
  })
})

describe("V51__relentlessChaseSecondStrike — through the chain", () => {
  it("is registered and is exactly what the v50 → v51 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V51__relentlessChaseSecondStrike)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 51 })!
    expect(result.applied).toEqual(["V51__relentlessChaseSecondStrike"])
    expect(result.blob.v).toBe(51)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V51__relentlessChaseSecondStrike,
    )
    const result = runChain(withoutStep, 51, clone(STORE))!
    expect(result.applied).not.toContain("V51__relentlessChaseSecondStrike")
    expect(grantsWindow(skillIn(result.blob, TARGET_ID))).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the addition after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === TARGET_ID)!
    expect(grantsWindow(skill)).toBe(true)
  })
})
