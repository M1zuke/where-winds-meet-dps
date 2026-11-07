import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V39__meterModifierGains,
  healSkill,
} from "../../src/migrations/customSkills/V39__meterModifierGains"
import { loadCustomSkills } from "../../src/storage"
import type { HitTrigger, Skill } from "../../src/engine/skill"
import storeV38File from "./testCustomSkills/v38/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV38File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const hasBattleAnthemGain = (skill: Skill): boolean =>
  skill.hits.some((hit) =>
    hit.triggers.some(
      (trigger) =>
        trigger.kind === "meterDelta" && trigger.cooldownGroup === "battleAnthemEnduranceGain",
    ),
  )
const hasEndlessGaleWindowGrants = (skill: Skill): boolean =>
  skill.hits.some((hit) =>
    hit.triggers.some(
      (trigger) => trigger.kind === "applyBuff" && trigger.targetId === "endlessGaleAtStart",
    ),
  )
const hasBleedRefund = (skill: Skill, cooldownGroup: string): boolean =>
  skill.hits.every((hit) =>
    hit.triggers.some(
      (trigger) => trigger.kind === "meterDelta" && trigger.cooldownGroup === cooldownGroup,
    ),
  )

// One representative id per patch shape this step applies: a build-tier-chance
// gain repeated across every charged and released Splendor form, a paired
// cost-reduction grant on Qiankun's Lock, and a condition-gated Bleeding
// refund shared across an Umbra combo's own hits.
const REPRESENTATIVE_CHECKS: [string, (skill: Skill) => boolean][] = [
  ["bellstrikeSplendor-swordheavycharged", hasBattleAnthemGain],
  ["bellstrikeSplendor-spearq", hasEndlessGaleWindowGrants],
  [
    "bellstrikeUmbra-swordspecial-4-hit",
    (skill) => hasBleedRefund(skill, "bleedMechanismEnhancement-innerBalanceStrikeIII"),
  ],
  [
    "bellstrikeUmbra-crosswind-blade",
    (skill) => hasBleedRefund(skill, "bleedMechanismEnhancement-crosswindBlade"),
  ],
]

describe("custom-skills v38 fixture", () => {
  it("is v38 and stores the pre-V39 shape for every representative id", () => {
    expect(STORE.v).toBe(V39__meterModifierGains.to - 1)
    for (const [id, hasGain] of REPRESENTATIVE_CHECKS) {
      const skill = skillIn(STORE, id)
      expect(skill, id).toBeTruthy()
      expect(hasGain(skill), id).toBe(false)
    }
  })
})

describe("healSkill", () => {
  it("adds Battle Anthem's own Endurance gain to Vagrant Sword's first hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordheavycharged"))) as Skill
    const gain = healed.hits[0].triggers.find(
      (trigger) =>
        trigger.kind === "meterDelta" && trigger.cooldownGroup === "battleAnthemEnduranceGain",
    )
    expect((gain as HitTrigger)?.stacks).toBe(10)
  })

  it("adds Endless Gale's window grants and its cost-reduction end grant to Qiankun's Lock", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-spearq"))) as Skill
    const targets = healed.hits[0].triggers
      .filter((trigger) => trigger.kind === "applyBuff")
      .map((trigger) => trigger.targetId)
    expect(targets).toEqual(
      expect.arrayContaining(["endlessGaleAtStart", "endlessGale", "endlessGaleCostReductionEnd"]),
    )
  })

  it("adds the Bleeding refund to every hit of SwordSpecial 4-Hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-swordspecial-4-hit"))) as Skill
    expect(hasBleedRefund(healed, "bleedMechanismEnhancement-innerBalanceStrikeIII")).toBe(true)
  })

  it("adds the Bleeding refund to Crosswind Blade's one hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-crosswind-blade"))) as Skill
    expect(hasBleedRefund(healed, "bleedMechanismEnhancement-crosswindBlade")).toBe(true)
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

describe("V39__meterModifierGains — called directly", () => {
  it("heals every representative id and leaves every other skill untouched", () => {
    const after = V39__meterModifierGains.migrate(clone(STORE))
    expect(after.v).toBe(39)
    for (const [id, hasGain] of REPRESENTATIVE_CHECKS) {
      expect(hasGain(skillIn(after, id)), id).toBe(true)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V39__meterModifierGains.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V39__meterModifierGains.migrate(clone(once))).toEqual(once)
  })
})

describe("V39__meterModifierGains — through the chain", () => {
  it("is registered and is exactly what the v38 → v39 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V39__meterModifierGains)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 39 })!
    expect(result.applied).toEqual(["V39__meterModifierGains"])
    expect(result.blob.v).toBe(39)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V39__meterModifierGains)
    const result = runChain(withoutStep, 39, clone(STORE))!
    expect(result.applied).not.toContain("V39__meterModifierGains")
    const [firstId, firstCheck] = REPRESENTATIVE_CHECKS[0]!
    expect(firstCheck(skillIn(result.blob, firstId))).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the gains after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "bellstrikeSplendor-spearq")!
    const targets = skill.hits[0].triggers
      .filter((trigger) => trigger.kind === "applyBuff")
      .map((trigger) => trigger.targetId)
    expect(targets).toEqual(
      expect.arrayContaining(["endlessGaleAtStart", "endlessGale", "endlessGaleCostReductionEnd"]),
    )
  })

  it("keeps stacks and cooldownGroup on the Battle Anthem gain after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find(
      (candidate) => candidate.id === "bellstrikeSplendor-swordheavycharged",
    )!
    const gain = skill.hits[0]!.triggers.find(
      (trigger) =>
        trigger.kind === "meterDelta" && trigger.cooldownGroup === "battleAnthemEnduranceGain",
    )
    expect(gain?.stacks).toBe(10)
    expect(gain?.cooldownGroup).toBe("battleAnthemEnduranceGain")
  })
})
