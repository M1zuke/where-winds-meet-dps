import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V83__splendorQiImbalanceOnHitAndEndlessGaleWindow,
  healSkill,
} from "../../src/migrations/customSkills/V83__splendorQiImbalanceOnHitAndEndlessGaleWindow"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV26File from "./testCustomSkills/v26/store.json"
import storeV82File from "./testCustomSkills/v82/store.json"

const CLASS = "bellstrikeSplendor"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV82File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const SEEDED_ENERGY_SURGE_ID = "bellstrikeSplendor-energysurge"

const HEALED_IDS = [
  "bellstrikeSplendor-spearq",
  "bellstrikeSplendor-spearq-prepull",
  "bellstrikeSplendor-spearq-0-hit-cancel",
  "bellstrikeSplendor-swordq",
  "bellstrikeSplendor-swordq-2nd",
  "bellstrikeSplendor-swordq-3rd",
  "bellstrikeSplendor-legioncrusher",
  "bellstrikeSplendor-swordspecial",
]
const HITS_ONLY_IDS = ["bellstrikeSplendor-legioncrusher", "bellstrikeSplendor-swordspecial"]
const EDITED_ENERGY_SURGE_ID = "bellstrikeSplendor-energysurge"
const USER_AUTHORED_ID = "sk-user-authored-slash"
const CHECKED_FIELDS = ["castFrames", "triggersBuffs", "hits"] as const

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

const sortedReceives = (skill: Skill): string[] => [...(skill.receives ?? [])].sort()

const seededEnergySurge = (): Skill =>
  skillIn(
    runCustomSkillMigrations(clone(storeV26File) as unknown as RawCustomSkillsBlob, {
      toVersion: 82,
    })!.blob,
    SEEDED_ENERGY_SURGE_ID,
  )

describe("custom-skills v82 fixture", () => {
  it("is v82 and still stores the old shape for every healed skill", () => {
    expect(STORE.v).toBe(V83__splendorQiImbalanceOnHitAndEndlessGaleWindow.to - 1)
    for (const id of HEALED_IDS) {
      const seeded = skillIn(STORE, id)
      const builtin = builtinOf(id)
      const diverges = CHECKED_FIELDS.some(
        (field) => JSON.stringify(seeded[field]) !== JSON.stringify(builtin[field]),
      )
      expect(diverges, id).toBe(true)
    }
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const builtin = builtinOf(id)
    expect(healed.hits).toEqual(builtin.hits)
    if (HITS_ONLY_IDS.includes(id)) return
    expect(healed.castFrames).toBe(builtin.castFrames)
    expect(healed.triggersBuffs).toEqual(builtin.triggersBuffs)
    expect(sortedReceives(healed)).toEqual(sortedReceives(builtin))
  })

  it("lands the untouched Energy Surge copy on the built-in", () => {
    const healed = healSkill(clone(seededEnergySurge())) as Skill
    expect(healed.hits).toEqual(builtinOf(SEEDED_ENERGY_SURGE_ID).hits)
  })

  it.each(HEALED_IDS)("leaves %s alone once a hit frame was edited", (id) => {
    const edited = clone(skillIn(STORE, id))
    edited.hits[0]!.frame += 1
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an edited Energy Surge copy alone", () => {
    const edited = skillIn(STORE, EDITED_ENERGY_SURGE_ID)
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored skill alone", () => {
    const authored = skillIn(STORE, USER_AUTHORED_ID)
    expect(healSkill(clone(authored))).toEqual(authored)
  })

  it("does not heal a copy twice", () => {
    for (const id of HEALED_IDS) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V83__splendorQiImbalanceOnHitAndEndlessGaleWindow — called directly", () => {
  it("heals the targeted copies and nothing else", () => {
    const after = V83__splendorQiImbalanceOnHitAndEndlessGaleWindow.migrate(clone(STORE))
    expect(after.v).toBe(83)
    for (const id of HEALED_IDS) expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V83__splendorQiImbalanceOnHitAndEndlessGaleWindow.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V83__splendorQiImbalanceOnHitAndEndlessGaleWindow.migrate(clone(once))).toEqual(once)
  })
})

describe("V83__splendorQiImbalanceOnHitAndEndlessGaleWindow — through the chain", () => {
  it("is registered and is exactly what the v82 → v83 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V83__splendorQiImbalanceOnHitAndEndlessGaleWindow)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 83 })!
    expect(result.applied).toEqual(["V83__splendorQiImbalanceOnHitAndEndlessGaleWindow"])
    expect(result.blob.v).toBe(83)
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
