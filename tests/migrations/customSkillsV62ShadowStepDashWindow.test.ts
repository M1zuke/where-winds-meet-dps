import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V62__shadowStepDashWindow,
  healSkill,
} from "../../src/migrations/customSkills/V62__shadowStepDashWindow"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV61File from "./testCustomSkills/v61/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV61File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const WINDOW_DURATION_BY_ID = {
  "bellstrikeSplendor-swordspecial": 144,
  "bellstrikeSplendor-swordspecial-2nd": 167,
  "bellstrikeSplendor-swordspecial-deflect": 167,
}
const TARGET_IDS = Object.keys(WINDOW_DURATION_BY_ID) as (keyof typeof WINDOW_DURATION_BY_ID)[]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const windowGrants = (skill: Skill) =>
  skill.hits[0]!.triggers.filter(
    (trigger) => trigger.kind === "applyBuff" && trigger.targetId === "shadowStepDashWindow",
  )

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

describe("custom-skills v61 fixture", () => {
  it("is v61 and every Shadow Step copy still lacks the window grant", () => {
    expect(STORE.v).toBe(V62__shadowStepDashWindow.to - 1)
    for (const id of TARGET_IDS) expect(windowGrants(skillIn(STORE, id))).toHaveLength(0)
  })
})

describe("healSkill", () => {
  it.each(TARGET_IDS)("adds the window grant to %s and lands on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(windowGrants(healed)).toHaveLength(1)
    expect(windowGrants(healed)[0]!.durationFrames).toBe(WINDOW_DURATION_BY_ID[id])
    expect(windowGrants(healed)).toEqual(windowGrants(builtin(id)))
  })

  it("keeps the first hit's other triggers", () => {
    const original = skillIn(STORE, "bellstrikeSplendor-swordspecial")
    const healed = healSkill(clone(original)) as Skill
    expect(healed.hits[0]!.triggers.slice(0, original.hits[0]!.triggers.length)).toEqual(
      original.hits[0]!.triggers,
    )
  })

  it("does not double-heal a copy that already carries it", () => {
    const once = healSkill(clone(skillIn(STORE, TARGET_IDS[1]!)))
    expect(healSkill(clone(once))).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = { ...clone(skillIn(STORE, TARGET_IDS[1]!)), id: "sk-user-authored-step" }
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V62__shadowStepDashWindow — called directly", () => {
  it("heals the targeted ids and nothing else", () => {
    const after = V62__shadowStepDashWindow.migrate(clone(STORE))
    expect(after.v).toBe(62)
    for (const id of TARGET_IDS) expect(windowGrants(skillIn(after, id))).toHaveLength(1)
    for (const skill of STORE.skills) {
      if (TARGET_IDS.includes(skill.id as (typeof TARGET_IDS)[number])) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V62__shadowStepDashWindow.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V62__shadowStepDashWindow.migrate(clone(once))).toEqual(once)
  })
})

describe("V62__shadowStepDashWindow — through the chain", () => {
  it("is registered and is exactly what the v61 → v62 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V62__shadowStepDashWindow)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 62 })!
    expect(result.applied).toEqual(["V62__shadowStepDashWindow"])
    expect(result.blob.v).toBe(62)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V62__shadowStepDashWindow)
    const result = runChain(withoutStep, 62, clone(STORE))!
    expect(result.applied).not.toContain("V62__shadowStepDashWindow")
    for (const id of TARGET_IDS) expect(windowGrants(skillIn(result.blob, id))).toHaveLength(0)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the grant after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of TARGET_IDS) {
      expect(windowGrants(loaded.find((candidate) => candidate.id === id)!)).toHaveLength(1)
    }
  })
})
