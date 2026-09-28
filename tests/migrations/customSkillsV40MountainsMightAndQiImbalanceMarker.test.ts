import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V40__mountainsMightAndQiImbalanceMarker,
  healSkill,
} from "../../src/migrations/customSkills/V40__mountainsMightAndQiImbalanceMarker"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV39File from "./testCustomSkills/v39/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV39File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const hasMountainsMightGain = (skill: Skill): boolean =>
  skill.hits.some((h) =>
    h.triggers.some(
      (t) => t.kind === "meterDelta" && t.cooldownGroup === "mountainsMightChargedHitGain",
    ),
  )
const hasQiImbalanceMarkerGrant = (skill: Skill): boolean =>
  skill.hits.some((h) =>
    h.triggers.some((t) => t.kind === "applyBuff" && t.targetId === "qiImbalanceMarker"),
  )

// One representative id per patch shape this step applies: the per-charged-hit
// Endurance gain, and the marker grant on both its unconditional and its
// Mountain's-Might-gated source.
const REPRESENTATIVE_CHECKS: [string, (skill: Skill) => boolean][] = [
  ["bellstrikeSplendor-swordheavycharged", hasMountainsMightGain],
  ["bellstrikeSplendor-spearq", hasQiImbalanceMarkerGrant],
  ["bellstrikeSplendor-swordq", hasQiImbalanceMarkerGrant],
]

describe("custom-skills v39 fixture", () => {
  it("is v39 and stores the pre-V40 shape for every representative id", () => {
    expect(STORE.v).toBe(V40__mountainsMightAndQiImbalanceMarker.to - 1)
    for (const [id, hasGain] of REPRESENTATIVE_CHECKS) {
      const skill = skillIn(STORE, id)
      expect(skill, id).toBeTruthy()
      expect(hasGain(skill), id).toBe(false)
    }
  })
})

describe("healSkill", () => {
  it("adds Mountain's Might's own Endurance gain to Vagrant Sword's first hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordheavycharged"))) as Skill
    const gain = healed.hits[0].triggers.find(
      (t) => t.kind === "meterDelta" && t.cooldownGroup === "mountainsMightChargedHitGain",
    )
    expect(gain?.condition).toEqual({ buffId: "qiImbalanceMarker", op: "gte", stacks: 1 })
    expect(gain?.requiresMinTier).toBe(6)
  })

  it("adds the unconditional Qi Imbalance marker grant to Qiankun's Lock", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-spearq"))) as Skill
    const grant = healed.hits[0].triggers.find(
      (t) => t.kind === "applyBuff" && t.targetId === "qiImbalanceMarker",
    )
    expect(grant?.requiresParam).toBeUndefined()
    expect(grant?.appliesOnCastEnd).toBe(true)
  })

  it("adds the Mountain's-Might-gated Qi Imbalance marker grant to Daunting Strike", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordq"))) as Skill
    const grant = healed.hits[0].triggers.find(
      (t) => t.kind === "applyBuff" && t.targetId === "qiImbalanceMarker",
    )
    expect(grant?.requiresParam).toBe("mountainsMight")
  })

  it("does not double-heal a copy that already carries the fields", () => {
    const once = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordheavycharged"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "stonesplitStrength-anxisoldiermosweep")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V40__mountainsMightAndQiImbalanceMarker — called directly", () => {
  it("heals every representative id and leaves every other skill untouched", () => {
    const after = V40__mountainsMightAndQiImbalanceMarker.migrate(clone(STORE))
    expect(after.v).toBe(40)
    for (const [id, hasGain] of REPRESENTATIVE_CHECKS) {
      expect(hasGain(skillIn(after, id)), id).toBe(true)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V40__mountainsMightAndQiImbalanceMarker.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V40__mountainsMightAndQiImbalanceMarker.migrate(clone(once))).toEqual(once)
  })
})

describe("V40__mountainsMightAndQiImbalanceMarker — through the chain", () => {
  it("is registered and is exactly what the v39 → v40 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V40__mountainsMightAndQiImbalanceMarker)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 40 })!
    expect(result.applied).toEqual(["V40__mountainsMightAndQiImbalanceMarker"])
    expect(result.blob.v).toBe(40)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V40__mountainsMightAndQiImbalanceMarker,
    )
    const result = runChain(withoutStep, 40, clone(STORE))!
    expect(result.applied).not.toContain("V40__mountainsMightAndQiImbalanceMarker")
    const [firstId, firstCheck] = REPRESENTATIVE_CHECKS[0]!
    expect(firstCheck(skillIn(result.blob, firstId))).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the gains after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find(
      (candidate) => candidate.id === "bellstrikeSplendor-swordheavycharged",
    )!
    expect(hasMountainsMightGain(skill)).toBe(true)
  })
})
