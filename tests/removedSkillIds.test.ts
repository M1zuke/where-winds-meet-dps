import { beforeEach, describe, expect, it } from "vitest"
import {
  importCustomRotation,
  importProfile,
  loadCustomRotations,
  loadCustomSkills,
} from "../src/storage"
import { builtinSkillsForClass } from "../src/engine/builtinLibrary"
import { makeRotation, makeStep, resolveRotation, type Rotation } from "../src/engine/rotation"
import type { StoredProfile } from "../src/engine/types"
import legacyProfileFile from "./migrations/testProfiles/v29/silkbindJade.json"
import skillStoreFile from "./migrations/testCustomSkills/v59/store.json"

const CLASS = "silkbindJade"
const REMOVED_SKILL_IDS = [
  "silkbindJade-healer-buff",
  "silkbindJade-healer-extension",
  "mystic-lions-roar",
  "mystic-lions-roar-throw",
  "mystic-flaming-meteor",
  "stonesplitStrength-blockperception",
]
const KEPT_SKILL_ID = "silkbindJade-fanspecial"
const CUSTOM_ROTATIONS_KEY = "wwm.customRotations"
const CUSTOM_ROTATIONS_VERSION = 3
const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const LEGACY_PROFILE = (legacyProfileFile as unknown as { profile: StoredProfile }).profile

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const rotationNaming = (...skillIds: string[]): Rotation =>
  makeRotation(CLASS, { steps: skillIds.map((skillId) => makeStep({ skillId })) })

const stepIds = (rotation: Rotation) => rotation.steps.map((step) => step.skillId)

describe("a removed skill id in saved data", () => {
  beforeEach(() => localStorage.clear())

  it("is gone from the built-in library", () => {
    const builtinIds = new Set(builtinSkillsForClass(CLASS).map((skill) => skill.id))
    for (const skillId of REMOVED_SKILL_IDS) expect(builtinIds.has(skillId), skillId).toBe(false)
  })

  it("stays in a saved custom rotation across a load", () => {
    const stepsNamed = [KEPT_SKILL_ID, ...REMOVED_SKILL_IDS]
    localStorage.setItem(
      CUSTOM_ROTATIONS_KEY,
      JSON.stringify({ v: CUSTOM_ROTATIONS_VERSION, rotations: [rotationNaming(...stepsNamed)] }),
    )
    const [loaded] = loadCustomRotations()
    expect(stepIds(loaded!)).toEqual(stepsNamed)
  })

  it("stays in an imported rotation", () => {
    const imported = importCustomRotation(
      JSON.stringify(rotationNaming(KEPT_SKILL_ID, ...REMOVED_SKILL_IDS)),
    )
    expect(stepIds(imported)).toEqual([KEPT_SKILL_ID, ...REMOVED_SKILL_IDS])
  })

  it("stays in an imported profile's active rotation", () => {
    const profile = clone(LEGACY_PROFILE)
    profile.inputs.activeCustomRotation = rotationNaming(KEPT_SKILL_ID, ...REMOVED_SKILL_IDS)
    const imported = importProfile(JSON.stringify(profile))
    expect(stepIds(imported.inputs.activeCustomRotation!)).toEqual([
      KEPT_SKILL_ID,
      ...REMOVED_SKILL_IDS,
    ])
  })

  it("keeps a Skill Editor copy across a load", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(skillStoreFile))
    const loadedIds = loadCustomSkills().map((skill) => skill.id)
    expect(loadedIds).toContain("silkbindJade-healer-buff")
  })

  it("is skipped when the rotation resolves, with a warning, and the other steps still resolve", () => {
    const rotation = rotationNaming(KEPT_SKILL_ID, ...REMOVED_SKILL_IDS)
    const { steps, warnings } = resolveRotation(rotation, builtinSkillsForClass(CLASS), [])
    expect(steps.map((resolved) => resolved.skill.id)).toEqual([KEPT_SKILL_ID])
    expect(warnings.some((warning) => /missing skill/.test(warning))).toBe(true)
  })
})
