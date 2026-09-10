import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { classDefinition } from "../../src/definitions/classes/registry"
import { receivesForSkill } from "../../src/engine/buffs/catalog"
import { makeSkill } from "../../src/engine/skill"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { StatKey } from "../../src/engine/statRegistry"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const umbraOwnBuffDefs = () => classDefinition("bellstrikeUmbra")!.classBuffDefs

const TRACKED: StatKey[] = ["affinityDamageBoost", "phys.penetration", "bellstrike.penetration"]

function skill(receives: string[]) {
  return makeSkill("test", { name: "probe", receives })
}

function sumsFor(params: Record<string, unknown>, receives: string[]) {
  const engine = new BuffEngine(params, [], umbraOwnBuffDefs())
  const result = engine.calculateDamageEffects(skill(receives), 0)
  return Object.fromEntries(
    TRACKED.map((statKey) => [
      statKey,
      result.effects
        .filter((effect) => effect.statKey === statKey)
        .reduce((sum, effect) => sum + effect.amount, 0),
    ]),
  )
}

const SWORD_HORIZON = { swordHorizon: true, swordHorizonTier: 6 }

describe("Bellstrike Umbra bleed buff-defs — BuffEngine unit", () => {
  it("Blood Burst gets both the affinity-damage and bleed-penetration terms", () => {
    expect(
      sumsFor(SWORD_HORIZON, ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"]),
    ).toEqual({
      affinityDamageBoost: 0.18,
      "phys.penetration": 0.15,
      "bellstrike.penetration": 0.15,
    })
  })

  it("Combustion gets only the affinity-damage term, never the bleed penetration", () => {
    expect(sumsFor(SWORD_HORIZON, ["bellstrikeUmbraBleedingDamage"])).toEqual({
      affinityDamageBoost: 0.18,
      "phys.penetration": 0,
      "bellstrike.penetration": 0,
    })
  })

  it("a non-bleed skill (Sword Martial Q) gets neither term", () => {
    expect(sumsFor(SWORD_HORIZON, [])).toEqual({
      affinityDamageBoost: 0,
      "phys.penetration": 0,
      "bellstrike.penetration": 0,
    })
  })

  it("with no swordHorizon param, neither Umbra buff is seeded (alwaysActive gated off)", () => {
    expect(sumsFor({}, ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"])).toEqual({
      affinityDamageBoost: 0,
      "phys.penetration": 0,
      "bellstrike.penetration": 0,
    })
  })
})

describe("Bellstrike Umbra bleed power coefficient — a multiplier, never a damage-boost term", () => {
  const factorFor = (params: Record<string, unknown>, receives: string[]) =>
    new BuffEngine(params, [], umbraOwnBuffDefs()).calculateDamageEffects(skill(receives), 0)
      .damageFactor

  it("scales a bleed row that receives it", () => {
    expect(factorFor(SWORD_HORIZON, ["bellstrikeUmbraBleedCoefficient"])).toBeCloseTo(1.03, 10)
  })

  it("leaves a row that does not receive it alone", () => {
    expect(factorFor(SWORD_HORIZON, ["bellstrikeUmbraBleedingDamage"])).toBe(1)
  })

  it("contributes no stat effect, so it can never join the additive boost sum", () => {
    expect(sumsFor(SWORD_HORIZON, ["bellstrikeUmbraBleedCoefficient"])).toEqual({
      affinityDamageBoost: 0,
      "phys.penetration": 0,
      "bellstrike.penetration": 0,
    })
  })

  it("reaches exactly the two bleed rows among the class's built-in skills", () => {
    const carriers = builtinSkillsForClass("bellstrikeUmbra")
      .filter((candidate) => (candidate.receives ?? []).includes("bellstrikeUmbraBleedCoefficient"))
      .map((candidate) => candidate.id)
      .sort()
    expect(carriers).toEqual([SKILL.bleedDetonation, SKILL.bleedTick].sort())
  })
})

describe("Bellstrike Umbra bleed buff-defs — Skill Editor RECEIVES visibility", () => {
  it("surfaces both buff ids for the Blood Burst skill and neither for Sword Martial Q", () => {
    const detonation = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.id === SKILL.bleedDetonation,
    )
    const swordQ = builtinSkillsForClass("bellstrikeUmbra").find((s) => s.id === SKILL.swordq)
    expect(detonation).toBeTruthy()
    expect(swordQ).toBeTruthy()

    const detonationIds = receivesForSkill(detonation!).map((r) => r.id)
    expect(detonationIds).toContain("bellstrikeUmbraBleedPen")
    expect(detonationIds).toContain("bellstrikeUmbraBleedingDamage")

    const swordQIds = receivesForSkill(swordQ!).map((r) => r.id)
    expect(swordQIds).not.toContain("bellstrikeUmbraBleedPen")
    expect(swordQIds).not.toContain("bellstrikeUmbraBleedingDamage")
  })

  it("flags the Umbra bleed buffs as spec mechanics, split out from ordinary buff rows", () => {
    const detonation = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.id === SKILL.bleedDetonation,
    )
    const detRows = receivesForSkill(detonation!, "bellstrikeUmbra")
    const specIds = detRows.filter((r) => r.isSpecMechanic).map((r) => r.id)
    expect(specIds).toEqual(
      expect.arrayContaining(["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"]),
    )
    expect(specIds).not.toContain("soulShaken")
    const soulShakenRow = detRows.find((r) => r.id === "soulShaken")
    expect(soulShakenRow).toBeTruthy()
    expect(soulShakenRow!.isSpecMechanic).toBe(false)
  })
})
