import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V43__evasiveChargeDodgeRefund,
  healSkill,
} from "../../src/migrations/customSkills/V43__evasiveChargeDodgeRefund"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, type Skill } from "../../src/engine/skill"
import { perfectDodge } from "../../src/data/skills/universal/perfect-dodge"
import { perfectDodgeFull } from "../../src/data/skills/universal/perfect-dodge-full"
import storeV42File from "./testCustomSkills/v42/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV42File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill | undefined =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)

const isBaseGain = (trigger: { kind: string; requiresParam?: string; requiresMinTier?: number }) =>
  trigger.kind === "meterDelta" &&
  trigger.requiresParam === "evasiveCharge" &&
  trigger.requiresMinTier === undefined

const isTier2Gain = (trigger: { kind: string; requiresParam?: string; requiresMinTier?: number }) =>
  trigger.kind === "meterDelta" &&
  trigger.requiresParam === "evasiveCharge" &&
  trigger.requiresMinTier === 2

const hasBothGains = (skill: Skill, hitIndex = 0): boolean =>
  !!skill.hits[hitIndex]?.triggers.some(isBaseGain) &&
  !!skill.hits[hitIndex]?.triggers.some(isTier2Gain)

// `universal-perfect-dodge`/`-full` have no captured copy in the fixture, so
// their untouched-seeded shape is built from the current built-in, with this
// step's own addition stripped back out to reach the genuine pre-V43 shape.
function withoutGain(skill: Skill): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit, index) =>
      index === 0
        ? { ...hit, triggers: hit.triggers.filter((t) => !isBaseGain(t) && !isTier2Gain(t)) }
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

describe("the pre-V43 shape", () => {
  it("carries none of the targets with either gain yet", () => {
    for (const id of TARGETS) expect(hasBothGains(beforeShapeOf(id)), id).toBe(false)
  })
})

describe("healSkill", () => {
  it("adds both the base and the tier-2 gain, gated on the inner way's own param, to every dodge skill", () => {
    for (const id of TARGETS) {
      const healed = healSkill(clone(beforeShapeOf(id))) as Skill
      const base = healed.hits[0]!.triggers.find(isBaseGain)
      const tier2 = healed.hits[0]!.triggers.find(isTier2Gain)
      expect(base?.refundFractionOfCastCost, id).toBe(0.5)
      expect(base?.condition, id).toBeNull()
      expect(tier2?.refundFractionOfCastCost, id).toBe(0.2)
      expect(tier2?.requiresMinTier, id).toBe(2)
    }
  })

  it("does not double-heal a copy that already carries both gains", () => {
    const once = healSkill(clone(beforeShapeOf("universal-perfect-dodge"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-crosswind-blade")!
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V43__evasiveChargeDodgeRefund — called directly", () => {
  it("heals every matchId and leaves every other skill untouched", () => {
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...STORE,
      skills: [
        ...(STORE.skills as Skill[]),
        ...Object.keys(SEEDED_ONLY).map((id) => beforeShapeOf(id)),
      ],
    }
    const before = clone(seededStore)
    const after = V43__evasiveChargeDodgeRefund.migrate(before)
    expect(after.v).toBe(43)
    for (const id of TARGETS) expect(hasBothGains(skillIn(after, id)!), id).toBe(true)
    for (const skill of before.skills) {
      if (TARGETS.includes(skill.id)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V43__evasiveChargeDodgeRefund.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V43__evasiveChargeDodgeRefund.migrate(clone(once))).toEqual(once)
  })
})

describe("V43__evasiveChargeDodgeRefund — through the chain", () => {
  it("is registered and is exactly what the v42 → v43 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V43__evasiveChargeDodgeRefund)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 43 })!
    expect(result.applied).toEqual(["V43__evasiveChargeDodgeRefund"])
    expect(result.blob.v).toBe(43)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V43__evasiveChargeDodgeRefund,
    )
    const result = runChain(withoutStep, 43, clone(STORE))!
    expect(result.applied).not.toContain("V43__evasiveChargeDodgeRefund")
    expect(hasBothGains(skillIn(result.blob, "bamboocutDraught-perfect-dodge")!)).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps both gains after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "bamboocutDraught-perfect-dodge")!
    expect(hasBothGains(skill)).toBe(true)
  })
})
