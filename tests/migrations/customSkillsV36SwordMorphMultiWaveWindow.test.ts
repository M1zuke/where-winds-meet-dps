import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V36__swordMorphMultiWaveWindow,
  healSkill,
} from "../../src/migrations/customSkills/V36__swordMorphMultiWaveWindow"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV35File from "./testCustomSkills/v35/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV35File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const WINDOW_ACTIVE_CONDITION = { buffId: "swordMorphMultiWaveWindow", op: "gte", stacks: 1 }

const SWORD_HEAVY_CHARGED_ID = "bellstrikeSplendor-swordheavycharged"
const SWORD_HEAVY_CHARGED_2_HIT_ID = "bellstrikeSplendor-swordheavycharged-2-hit"
const SWORD_HEAVY_CHARGED_PREPULL_ID = "bellstrikeSplendor-swordheavycharged-prepull"
const ENERGY_SURGE_ID = "bellstrikeSplendor-energysurge"
const SWORD_SPECIAL_ID = "bellstrikeSplendor-swordspecial"

const ALL_TARGETED_IDS = [
  SWORD_HEAVY_CHARGED_ID,
  SWORD_HEAVY_CHARGED_2_HIT_ID,
  SWORD_HEAVY_CHARGED_PREPULL_ID,
  ENERGY_SURGE_ID,
  SWORD_SPECIAL_ID,
]

function targetsOf(healed: Skill): unknown[] {
  return healed.hits[0]!.triggers.map((trigger) => trigger.targetId)
}

function expectBootstrapGranted(healed: Skill) {
  const trigger = healed.hits[0]!.triggers.find(
    (candidate) => candidate.targetId === "swordMorphMultiWaveWindow",
  )!
  expect(trigger.condition).toBeNull()
  expect(trigger.requiresMinTier).toBeUndefined()
}

function expectSustainGranted(healed: Skill) {
  const trigger = healed.hits[0]!.triggers.find(
    (candidate) => candidate.targetId === "swordMorphMultiWaveWindow",
  )!
  expect(trigger.condition).toEqual(WINDOW_ACTIVE_CONDITION)
  expect(trigger.requiresMinTier).toBe(4)
}

function expectReleaseGranted(healed: Skill) {
  const trigger = healed.hits[0]!.triggers.find(
    (candidate) => candidate.targetId === "swordMorphMultiWaveWindow",
  )!
  expect(trigger.condition).toBeNull()
  expect(trigger.requiresMinTier).toBe(4)
}

describe("custom-skills v35 fixture", () => {
  it("is v35 and still stores the pre-V36 shape for every targeted skill", () => {
    expect(STORE.v).toBe(V36__swordMorphMultiWaveWindow.to - 1)
    for (const id of ALL_TARGETED_IDS) {
      expect(targetsOf(skillIn(STORE, id)), id).not.toContain("swordMorphMultiWaveWindow")
    }
    expect(skillIn(STORE, SWORD_HEAVY_CHARGED_ID).hits[0]!.variants).toBeUndefined()
    expect(skillIn(STORE, SWORD_HEAVY_CHARGED_2_HIT_ID).castConditions).toBeUndefined()
  })
})

describe("healSkill", () => {
  it("swaps SwordHeavyCharged's base hit to the single bolt, with a window-gated 3-wave variant", () => {
    const healed = healSkill(clone(skillIn(STORE, SWORD_HEAVY_CHARGED_ID))) as Skill
    expect(healed.castFrames).toBe(126)
    expect(healed.hits[0]!.physMultiplier).toBe(3.2664)
    expect(healed.hits[0]!.attributeMultiplier).toBe(4.8996)
    expect(healed.hits[0]!.physFixed).toBe(904)
    expect(healed.hits[0]!.attributeFixed).toBe(493)
    expect(healed.hits[0]!.variants).toEqual([
      {
        id: "hv-swordheavycharged-hit-0-multi-wave-window",
        label: "Multi-Wave Window",
        conditions: [WINDOW_ACTIVE_CONDITION],
        physMultiplier: 1.3066,
        attributeMultiplier: 1.9598,
        physFixed: 361.6,
        attributeFixed: 197.2,
        castFrames: 140,
      },
    ])
    expect(healed.hits[1]!.conditions).toEqual([WINDOW_ACTIVE_CONDITION])
    expect(healed.hits[2]!.conditions).toEqual([WINDOW_ACTIVE_CONDITION])
    expectSustainGranted(healed)
  })

  it("gates SwordHeavyCharged 2 Hit's availability and adds the sustain trigger", () => {
    const healed = healSkill(clone(skillIn(STORE, SWORD_HEAVY_CHARGED_2_HIT_ID))) as Skill
    expect(healed.castConditions).toEqual([WINDOW_ACTIVE_CONDITION])
    expectSustainGranted(healed)
  })

  it("adds the release-grant trigger to Energy Surge — every three-wave release re-grants the window at Sword Morph tier 4+", () => {
    expectReleaseGranted(healSkill(clone(skillIn(STORE, ENERGY_SURGE_ID))) as Skill)
  })

  it("adds the unconditional bootstrap trigger to Shadow Step — it grants at every rank", () => {
    expectBootstrapGranted(healSkill(clone(skillIn(STORE, SWORD_SPECIAL_ID))) as Skill)
  })

  it("adds the release-grant trigger to the pre-pull form — its own release is unconditionally three waves", () => {
    expectReleaseGranted(healSkill(clone(skillIn(STORE, SWORD_HEAVY_CHARGED_PREPULL_ID))) as Skill)
  })

  it("does not double-heal a copy that already carries the grant", () => {
    for (const id of ALL_TARGETED_IDS) {
      const alreadyHealed = healSkill(clone(skillIn(STORE, id))) as Skill
      const untouched = clone(alreadyHealed)
      expect(healSkill(alreadyHealed)).toEqual(untouched)
    }
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeSplendor-swordq")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V36__swordMorphMultiWaveWindow — called directly", () => {
  it("heals every targeted skill and nothing else", () => {
    const after = V36__swordMorphMultiWaveWindow.migrate(clone(STORE))
    expect(after.v).toBe(36)
    for (const id of ALL_TARGETED_IDS) {
      expect(targetsOf(skillIn(after, id))).toContain("swordMorphMultiWaveWindow")
    }
    for (const skill of STORE.skills) {
      if (ALL_TARGETED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V36__swordMorphMultiWaveWindow.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V36__swordMorphMultiWaveWindow.migrate(clone(once))).toEqual(once)
  })
})

describe("V36__swordMorphMultiWaveWindow — through the chain", () => {
  it("is registered and is exactly what the v35 → v36 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V36__swordMorphMultiWaveWindow)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 36 })!
    expect(result.applied).toEqual(["V36__swordMorphMultiWaveWindow"])
    expect(result.blob.v).toBe(36)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V36__swordMorphMultiWaveWindow,
    )
    const result = runChain(withoutStep, 36, clone(STORE))!
    expect(result.applied).not.toContain("V36__swordMorphMultiWaveWindow")
    for (const id of ALL_TARGETED_IDS) {
      expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
    }
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the grant after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of ALL_TARGETED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      const grantedAnywhere = skill.hits.flatMap((hit) =>
        hit.triggers.map((trigger) => trigger.targetId),
      )
      expect(grantedAnywhere, id).toContain("swordMorphMultiWaveWindow")
    }
  })
})
