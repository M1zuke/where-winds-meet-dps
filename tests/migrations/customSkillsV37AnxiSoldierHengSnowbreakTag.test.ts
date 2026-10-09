import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V37__anxiSoldierHengSnowbreakTag,
  healSkill,
} from "../../src/migrations/customSkills/V37__anxiSoldierHengSnowbreakTag"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV36File from "./testCustomSkills/v36/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const ANXI_SOLDIER_HENG_ID = "stonesplitStrength-anxisoldierheng"

const STORE = storeV36File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v36 fixture", () => {
  it("is v36 and stores the pre-V37 shape for AnxiSoldierHeng", () => {
    expect(STORE.v).toBe(V37__anxiSoldierHengSnowbreakTag.to - 1)
    expect(skillIn(STORE, ANXI_SOLDIER_HENG_ID).tags).not.toContain("role:snowpartingVC")
  })
})

describe("healSkill", () => {
  it("adds the Snowbreak Spring tag to an untouched seeded copy", () => {
    const healed = healSkill(clone(skillIn(STORE, ANXI_SOLDIER_HENG_ID))) as Skill
    expect(healed.tags).toEqual([
      "weapon:Heng Blade",
      "prop:cleftpeakBoost",
      "role:anxiSoldier",
      "attune:snowpartingVariedCombo",
      "role:snowpartingVC",
    ])
  })

  it("does not double-heal a copy that already carries the tag", () => {
    const alreadyHealed = healSkill(clone(skillIn(STORE, ANXI_SOLDIER_HENG_ID))) as Skill
    const untouched = clone(alreadyHealed)
    expect(healSkill(alreadyHealed)).toEqual(untouched)
  })

  it("leaves an edited copy's tags alone", () => {
    const edited = clone(skillIn(STORE, ANXI_SOLDIER_HENG_ID))
    edited.tags = [...(edited.tags ?? []), "prop:userAdded"]
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "stonesplitStrength-anxisoldiermosweep")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V37__anxiSoldierHengSnowbreakTag — called directly", () => {
  it("heals AnxiSoldierHeng and nothing else", () => {
    const after = V37__anxiSoldierHengSnowbreakTag.migrate(clone(STORE))
    expect(after.v).toBe(37)
    expect(skillIn(after, ANXI_SOLDIER_HENG_ID).tags).toContain("role:snowpartingVC")
    for (const skill of STORE.skills) {
      if (skill.id === ANXI_SOLDIER_HENG_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V37__anxiSoldierHengSnowbreakTag.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V37__anxiSoldierHengSnowbreakTag.migrate(clone(once))).toEqual(once)
  })
})

describe("V37__anxiSoldierHengSnowbreakTag — through the chain", () => {
  it("is registered and is exactly what the v36 → v37 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V37__anxiSoldierHengSnowbreakTag)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 37 })!
    expect(result.applied).toEqual(["V37__anxiSoldierHengSnowbreakTag"])
    expect(result.blob.v).toBe(37)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V37__anxiSoldierHengSnowbreakTag,
    )
    const result = runChain(withoutStep, 37, clone(STORE))!
    expect(result.applied).not.toContain("V37__anxiSoldierHengSnowbreakTag")
    expect(skillIn(result.blob, ANXI_SOLDIER_HENG_ID)).toEqual(skillIn(STORE, ANXI_SOLDIER_HENG_ID))
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the tag after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === ANXI_SOLDIER_HENG_ID)!
    expect(skill.tags).toContain("role:snowpartingVC")
  })
})
