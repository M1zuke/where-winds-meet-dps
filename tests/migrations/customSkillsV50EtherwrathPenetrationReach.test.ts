import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V50__etherwrathPenetrationReach,
  healSkill,
} from "../../src/migrations/customSkills/V50__etherwrathPenetrationReach"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV49File from "./testCustomSkills/v49/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV49File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const TARGET_IDS = [
  "bamboocutDraught-falcons-pursuit",
  "stonesplitStrength-anxisoldierheng",
  "stonesplitStrength-anxisoldiermodown",
  "stonesplitStrength-anxisoldiermojump",
  "stonesplitStrength-anxisoldiermosweep",
]

describe("custom-skills v49 fixture", () => {
  it("is v49 and stores the pre-V50 shape for every id this step heals", () => {
    expect(STORE.v).toBe(V50__etherwrathPenetrationReach.to - 1)
    for (const id of TARGET_IDS) {
      expect(skillIn(STORE, id).receives, id).not.toContain("etherwrathPenetrationBoost")
    }
  })
})

describe("healSkill", () => {
  it("adds etherwrathPenetrationBoost to the falcon and every Anxi Army assist's receives", () => {
    for (const id of TARGET_IDS) {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.receives, id).toContain("etherwrathPenetrationBoost")
    }
  })

  it("does not double-heal a copy that already carries it", () => {
    for (const id of TARGET_IDS) {
      const once = healSkill(clone(skillIn(STORE, id))) as Skill
      const twice = healSkill(clone(once))
      expect(twice, id).toEqual(once)
    }
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-bleed-detonation")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V50__etherwrathPenetrationReach — called directly", () => {
  it("heals every targeted id and leaves every other skill untouched", () => {
    const after = V50__etherwrathPenetrationReach.migrate(clone(STORE))
    expect(after.v).toBe(50)
    for (const id of TARGET_IDS)
      expect(skillIn(after, id).receives, id).toContain("etherwrathPenetrationBoost")

    for (const skill of STORE.skills) {
      if (TARGET_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V50__etherwrathPenetrationReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V50__etherwrathPenetrationReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V50__etherwrathPenetrationReach — through the chain", () => {
  it("is registered and is exactly what the v49 → v50 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V50__etherwrathPenetrationReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 50 })!
    expect(result.applied).toEqual(["V50__etherwrathPenetrationReach"])
    expect(result.blob.v).toBe(50)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V50__etherwrathPenetrationReach,
    )
    const result = runChain(withoutStep, 50, clone(STORE))!
    expect(result.applied).not.toContain("V50__etherwrathPenetrationReach")
    expect(skillIn(result.blob, TARGET_IDS[0]!).receives).not.toContain(
      "etherwrathPenetrationBoost",
    )
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the addition after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const falcon = loaded.find((candidate) => candidate.id === TARGET_IDS[0])!
    expect(falcon.receives).toContain("etherwrathPenetrationBoost")
  })
})
