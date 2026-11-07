import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V42__calmwatersPerfectDodgeGain,
  healSkill,
} from "../../src/migrations/customSkills/V42__calmwatersPerfectDodgeGain"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, type Skill } from "../../src/engine/skill"
import { perfectDodge } from "../../src/data/skills/universal/perfect-dodge"
import { perfectDodgeFull } from "../../src/data/skills/universal/perfect-dodge-full"
import storeV41File from "./testCustomSkills/v41/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV41File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill | undefined =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)

const isTheGain = (trigger: { kind: string; requiresParam?: string }): boolean =>
  trigger.kind === "meterDelta" && trigger.requiresParam === "calmwatersSet"

const hasGain = (skill: Skill, hitIndex = 0): boolean =>
  !!skill.hits[hitIndex]?.triggers.some(isTheGain)

// `universal-perfect-dodge`/`-full` have no captured copy in the fixture, so
// their untouched-seeded shape is built from the current built-in, with this
// step's own addition stripped back out to reach the genuine pre-V42 shape.
function withoutGain(skill: Skill): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit, index) =>
      index === 0
        ? { ...hit, triggers: hit.triggers.filter((trigger) => !isTheGain(trigger)) }
        : hit,
    ),
  }
}

const SEEDED_ONLY: Record<string, Skill> = {
  "universal-perfect-dodge": withoutGain(perfectDodge),
  "universal-perfect-dodge-full": withoutGain(perfectDodgeFull),
}

const TARGETS = [
  "universal-perfect-dodge",
  "universal-perfect-dodge-full",
  "bamboocutDraught-perfect-dodge",
  "bamboocutDraught-perfect-dodge-full",
]

function beforeShapeOf(id: string): Skill {
  const seeded = SEEDED_ONLY[id]
  return seeded ? seedSkillFromBuiltin("universal", seeded) : skillIn(STORE, id)!
}

describe("the pre-V42 shape", () => {
  it("carries none of the targets with the gain yet", () => {
    for (const id of TARGETS) expect(hasGain(beforeShapeOf(id)), id).toBe(false)
  })
})

describe("healSkill", () => {
  it("adds the unconditional gain, gated on the set param, to every dodge skill", () => {
    for (const id of TARGETS) {
      const healed = healSkill(clone(beforeShapeOf(id))) as Skill
      const gain = healed.hits[0]!.triggers.find(isTheGain)
      expect(gain?.stacks, id).toBe(5)
      expect(gain?.condition, id).toBeNull()
      expect(gain?.requiresParam, id).toBe("calmwatersSet")
    }
  })

  it("does not double-heal a copy that already carries the gain", () => {
    const once = healSkill(clone(beforeShapeOf("universal-perfect-dodge"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-crosswind-blade")!
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V42__calmwatersPerfectDodgeGain — called directly", () => {
  it("heals every matchId and leaves every other skill untouched", () => {
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...STORE,
      skills: [
        ...(STORE.skills as Skill[]),
        ...Object.keys(SEEDED_ONLY).map((id) => beforeShapeOf(id)),
      ],
    }
    const before = clone(seededStore)
    const after = V42__calmwatersPerfectDodgeGain.migrate(before)
    expect(after.v).toBe(42)
    for (const id of TARGETS) expect(hasGain(skillIn(after, id)!), id).toBe(true)
    for (const skill of before.skills) {
      if (TARGETS.includes(skill.id)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V42__calmwatersPerfectDodgeGain.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V42__calmwatersPerfectDodgeGain.migrate(clone(once))).toEqual(once)
  })
})

describe("V42__calmwatersPerfectDodgeGain — through the chain", () => {
  it("is registered and is exactly what the v41 → v42 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V42__calmwatersPerfectDodgeGain)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 42 })!
    expect(result.applied).toEqual(["V42__calmwatersPerfectDodgeGain"])
    expect(result.blob.v).toBe(42)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V42__calmwatersPerfectDodgeGain,
    )
    const result = runChain(withoutStep, 42, clone(STORE))!
    expect(result.applied).not.toContain("V42__calmwatersPerfectDodgeGain")
    expect(hasGain(skillIn(result.blob, "bamboocutDraught-perfect-dodge")!)).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the gain after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "bamboocutDraught-perfect-dodge")!
    expect(hasGain(skill)).toBe(true)
  })
})
