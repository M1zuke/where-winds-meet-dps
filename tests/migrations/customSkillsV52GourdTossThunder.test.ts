import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V52__gourdTossThunder,
  healSkill,
} from "../../src/migrations/customSkills/V52__gourdTossThunder"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV51File from "./testCustomSkills/v51/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const TARGET_ID = "silkbindJade-fanspecial"

const STORE = storeV51File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

function grantsThunder(skill: Skill): boolean {
  const lastHit = skill.hits[skill.hits.length - 1]!
  return lastHit.triggers.some(
    (trigger) => trigger.kind === "applyBuff" && trigger.targetId === "gourdTossThunder",
  )
}

describe("custom-skills v51 fixture", () => {
  it("is v51 and still lacks the Gourd Toss Thunder wiring", () => {
    expect(STORE.v).toBe(V52__gourdTossThunder.to - 1)
    const seeded = skillIn(STORE, TARGET_ID)
    expect(seeded.receives ?? []).not.toContain("gourdTossThunder")
    expect(grantsThunder(seeded)).toBe(false)
  })
})

describe("healSkill", () => {
  it("adds gourdTossThunder to receives and grants it at the last hit", () => {
    const healed = healSkill(clone(skillIn(STORE, TARGET_ID))) as Skill
    expect(healed.receives).toContain("gourdTossThunder")
    expect(grantsThunder(healed)).toBe(true)
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

describe("V52__gourdTossThunder — called directly", () => {
  it("heals the targeted id and leaves every other skill untouched", () => {
    const after = V52__gourdTossThunder.migrate(clone(STORE))
    expect(after.v).toBe(52)
    const healed = skillIn(after, TARGET_ID)
    expect(healed.receives).toContain("gourdTossThunder")
    expect(grantsThunder(healed)).toBe(true)

    for (const skill of STORE.skills) {
      if (skill.id === TARGET_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V52__gourdTossThunder.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V52__gourdTossThunder.migrate(clone(once))).toEqual(once)
  })
})

describe("V52__gourdTossThunder — through the chain", () => {
  it("is registered and is exactly what the v51 → v52 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V52__gourdTossThunder)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 52 })!
    expect(result.applied).toEqual(["V52__gourdTossThunder"])
    expect(result.blob.v).toBe(52)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V52__gourdTossThunder)
    const result = runChain(withoutStep, 52, clone(STORE))!
    expect(result.applied).not.toContain("V52__gourdTossThunder")
    expect(grantsThunder(skillIn(result.blob, TARGET_ID))).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the addition after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === TARGET_ID)!
    expect(skill.receives).toContain("gourdTossThunder")
    expect(grantsThunder(skill)).toBe(true)
  })
})
