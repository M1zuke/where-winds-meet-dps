import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V54__swallowcallColorfulPhoenixReach,
  healSkill,
} from "../../src/migrations/customSkills/V54__swallowcallColorfulPhoenixReach"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV53File from "./testCustomSkills/v53/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const TARGET_ID = "silkbindJade-umb-heavylight"

const STORE = storeV53File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v53 fixture", () => {
  it("is v53 and still lacks the Swallowcall reach on Umb HeavyLight", () => {
    expect(STORE.v).toBe(V54__swallowcallColorfulPhoenixReach.to - 1)
    expect(skillIn(STORE, TARGET_ID).receives ?? []).not.toContain("swallowcallLightAttackBoost")
  })
})

describe("healSkill", () => {
  it("adds swallowcallLightAttackBoost to Umb HeavyLight's receives", () => {
    const healed = healSkill(clone(skillIn(STORE, TARGET_ID))) as Skill
    expect(healed.receives).toContain("swallowcallLightAttackBoost")
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

describe("V54__swallowcallColorfulPhoenixReach — called directly", () => {
  it("heals the targeted id and leaves every other skill untouched", () => {
    const after = V54__swallowcallColorfulPhoenixReach.migrate(clone(STORE))
    expect(after.v).toBe(54)
    expect(skillIn(after, TARGET_ID).receives).toContain("swallowcallLightAttackBoost")

    for (const skill of STORE.skills) {
      if (skill.id === TARGET_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V54__swallowcallColorfulPhoenixReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V54__swallowcallColorfulPhoenixReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V54__swallowcallColorfulPhoenixReach — through the chain", () => {
  it("is registered and is exactly what the v53 → v54 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V54__swallowcallColorfulPhoenixReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 54 })!
    expect(result.applied).toEqual(["V54__swallowcallColorfulPhoenixReach"])
    expect(result.blob.v).toBe(54)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V54__swallowcallColorfulPhoenixReach,
    )
    const result = runChain(withoutStep, 54, clone(STORE))!
    expect(result.applied).not.toContain("V54__swallowcallColorfulPhoenixReach")
    expect(skillIn(result.blob, TARGET_ID).receives ?? []).not.toContain(
      "swallowcallLightAttackBoost",
    )
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the addition after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === TARGET_ID)!
    expect(skill.receives).toContain("swallowcallLightAttackBoost")
  })
})
