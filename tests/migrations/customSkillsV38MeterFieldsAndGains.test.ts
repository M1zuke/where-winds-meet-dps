import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V38__meterFieldsAndGains,
  healSkill,
} from "../../src/migrations/customSkills/V38__meterFieldsAndGains"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV37File from "./testCustomSkills/v37/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV37File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

// One representative id per patch shape this step applies: a skill-level
// cost plus per-hit gains on every hit, a drain/freeze pair with a
// condition-gated spend, a hit-only gain with no condition, and a
// suffix-matched universal skill.
const REPRESENTATIVE_IDS = [
  "stonesplitStrength-snowpartingcharged",
  "bellstrikeSplendor-swordheavycharged",
  "bellstrikeUmbra-crosswind-blade",
  "bamboocutDraught-perfect-dodge",
  "silkbindJade-fanlightcharged",
]

describe("custom-skills v37 fixture", () => {
  it("is v37 and stores the pre-V38 shape for every representative id", () => {
    expect(STORE.v).toBe(V38__meterFieldsAndGains.to - 1)
    for (const id of REPRESENTATIVE_IDS) {
      const skill = skillIn(STORE, id)
      expect(skill, id).toBeTruthy()
      expect(skill.meterCosts, id).toBeUndefined()
      expect(skill.meterDrains, id).toBeUndefined()
      expect(
        skill.hits.some((hit) => hit.triggers.some((trigger) => trigger.kind === "meterDelta")),
        id,
      ).toBe(false)
    }
  })
})

describe("healSkill", () => {
  it("adds the skill-level cost and a gain on every hit for Grave Frost", () => {
    const healed = healSkill(
      clone(skillIn(STORE, "stonesplitStrength-snowpartingcharged")),
    ) as Skill
    expect(healed.meterCosts).toEqual([{ meterId: "endurance", amount: 15 }])
    for (const hit of healed.hits) {
      expect(
        hit.triggers.some(
          (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "bladeMomentum",
        ),
      ).toBe(true)
    }
  })

  it("adds the drain, freeze and a condition-gated spend for Vagrant Sword", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeSplendor-swordheavycharged"))) as Skill
    expect(healed.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
    ])
    expect(healed.meterFreezes).toEqual([{ meterId: "endurance", fromFrame: 12 }])
    const spend = healed.hits[2].triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "endurance",
    )
    expect(spend?.condition).toEqual({ buffId: "swordMorphMultiWaveWindow", op: "gte", stacks: 1 })
  })

  it("adds an unconditional Endurance gain to Crosswind Blade's one hit", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-crosswind-blade"))) as Skill
    expect(
      healed.hits[0].triggers.some(
        (trigger) => trigger.kind === "meterDelta" && trigger.stacks === 8,
      ),
    ).toBe(true)
  })

  it("adds the universal Perfect Dodge gain by id suffix, on any class", () => {
    const healed = healSkill(clone(skillIn(STORE, "bamboocutDraught-perfect-dodge"))) as Skill
    expect(
      healed.hits[0].triggers.some(
        (trigger) => trigger.kind === "meterDelta" && trigger.stacks === 5,
      ),
    ).toBe(true)
  })

  it("adds Forsaken Fame's drain, freeze and gain", () => {
    const healed = healSkill(clone(skillIn(STORE, "silkbindJade-fanlightcharged"))) as Skill
    expect(healed.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 30, fromFrame: 14.4, stopAfterSec: 0.55 },
    ])
    expect(healed.meterFreezes).toEqual([{ meterId: "endurance", fromFrame: 0 }])
    const gain = healed.hits[0].triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.stacks === 10,
    )
    expect(gain?.appliesOnCastEnd).toBe(true)
  })

  it("does not double-heal a copy that already carries the fields", () => {
    const once = healSkill(clone(skillIn(STORE, "stonesplitStrength-snowpartingcharged"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "stonesplitStrength-deflect")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V38__meterFieldsAndGains — called directly", () => {
  it("heals every representative id and leaves every other skill untouched", () => {
    const after = V38__meterFieldsAndGains.migrate(clone(STORE))
    expect(after.v).toBe(38)
    for (const id of REPRESENTATIVE_IDS) {
      const healed = skillIn(after, id)
      const hasMeterField =
        !!healed.meterCosts ||
        !!healed.meterDrains ||
        healed.hits.some((hit) => hit.triggers.some((trigger) => trigger.kind === "meterDelta"))
      expect(hasMeterField, id).toBe(true)
    }
    for (const skill of STORE.skills as Skill[]) {
      if (REPRESENTATIVE_IDS.includes(skill.id)) continue
      const before = skillIn(STORE, skill.id)
      expect(skillIn(after, skill.id), skill.id).toEqual(healSkill(clone(before)))
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V38__meterFieldsAndGains.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V38__meterFieldsAndGains.migrate(clone(once))).toEqual(once)
  })
})

describe("V38__meterFieldsAndGains — through the chain", () => {
  it("is registered and is exactly what the v37 → v38 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V38__meterFieldsAndGains)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 38 })!
    expect(result.applied).toEqual(["V38__meterFieldsAndGains"])
    expect(result.blob.v).toBe(38)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter((step) => step !== V38__meterFieldsAndGains)
    const result = runChain(withoutStep, 38, clone(STORE))!
    expect(result.applied).not.toContain("V38__meterFieldsAndGains")
    expect(skillIn(result.blob, REPRESENTATIVE_IDS[0]).meterCosts).toBeUndefined()
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the fields after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find(
      (candidate) => candidate.id === "stonesplitStrength-snowpartingcharged",
    )!
    expect(skill.meterCosts).toEqual([{ meterId: "endurance", amount: 15 }])
  })

  it("keeps meterDrains, meterFreezes, meterSpendCapToCurrent and cooldownGroup after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find(
      (candidate) => candidate.id === "bellstrikeSplendor-swordheavycharged",
    )!
    expect(skill.meterDrains).toEqual([
      { meterId: "endurance", perSecond: 20, fromFrame: 12.6, stopAfterSec: 1.2 },
    ])
    expect(skill.meterFreezes).toEqual([{ meterId: "endurance", fromFrame: 12 }])
    const spend = skill.hits[2]!.triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "endurance",
    )
    expect(spend?.meterSpendCapToCurrent).toBe(20)
    expect(spend?.recordSpendAsStatus).toBe("swordMorphConvertedAmount")
  })

  it("keeps a meterDelta gain's cooldownGroup after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "stonesplitStrength-anxisoldierheng")!
    const gain = skill.hits[0]!.triggers.find(
      (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "bladeMomentum",
    )
    expect(gain?.cooldownGroup).toBe("anxiSoldierBladeMomentumGain")
  })
})
