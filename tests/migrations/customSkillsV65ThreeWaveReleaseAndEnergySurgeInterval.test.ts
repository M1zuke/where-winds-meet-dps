import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V65__threeWaveReleaseAndEnergySurgeInterval,
  healSkill,
} from "../../src/migrations/customSkills/V65__threeWaveReleaseAndEnergySurgeInterval"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV64File from "./testCustomSkills/v64/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV64File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const HEALED_IDS = [
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-swordheavycharged-2-hit",
  "bellstrikeSplendor-swordspecial",
  "bellstrikeSplendor-swordq-3rd",
  "bellstrikeSplendor-swordheavycharged-tier-1",
]
const EDITED_ID = "bellstrikeSplendor-energysurge"
const USER_AUTHORED_ID = "sk-user-authored-slash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

describe("custom-skills v64 fixture", () => {
  it("is v64 and every seeded copy still carries the old triggers", () => {
    expect(STORE.v).toBe(V65__threeWaveReleaseAndEnergySurgeInterval.to - 1)
    for (const id of HEALED_IDS) {
      expect(JSON.stringify(skillIn(STORE, id).hits), id).not.toBe(
        JSON.stringify(builtinOf(id).hits),
      )
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands %s on the built-in's hits and cast length", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const live = builtinOf(id)
    expect(healed.hits).toEqual(live.hits)
    expect(healed.castFrames).toBe(live.castFrames)
  })

  it("leaves a copy whose grant the user edited alone", () => {
    const edited = skillIn(STORE, EDITED_ID)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored skill alone", () => {
    const authored = skillIn(STORE, USER_AUTHORED_ID)
    expect(healSkill(clone(authored))).toEqual(authored)
  })

  it("does not heal a copy twice", () => {
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once))).toEqual(once)
    }
  })
})

describe("V65__threeWaveReleaseAndEnergySurgeInterval — called directly", () => {
  it("heals every seeded copy and nothing else", () => {
    const after = V65__threeWaveReleaseAndEnergySurgeInterval.migrate(clone(STORE))
    expect(after.v).toBe(65)
    for (const id of HEALED_IDS) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V65__threeWaveReleaseAndEnergySurgeInterval.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V65__threeWaveReleaseAndEnergySurgeInterval.migrate(clone(once))).toEqual(once)
  })
})

describe("V65__threeWaveReleaseAndEnergySurgeInterval — through the chain", () => {
  it("is registered and is exactly what the v64 → v65 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V65__threeWaveReleaseAndEnergySurgeInterval)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 65 })!
    expect(result.applied).toEqual(["V65__threeWaveReleaseAndEnergySurgeInterval"])
    expect(result.blob.v).toBe(65)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V65__threeWaveReleaseAndEnergySurgeInterval,
    )
    const result = runChain(withoutStep, 65, clone(STORE))!
    expect(result.applied).not.toContain("V65__threeWaveReleaseAndEnergySurgeInterval")
    for (const id of HEALED_IDS) {
      expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
    }
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("lands on the built-in's hits after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      expect(skill.hits, id).toEqual(builtinOf(id).hits)
    }
  })
})
