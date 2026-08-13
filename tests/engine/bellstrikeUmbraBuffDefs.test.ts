import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { classDefinition } from "../../src/definitions/classes/registry"
import { receivesForSkill } from "../../src/engine/buffs/catalog"
import { makeSkill } from "../../src/engine/skill"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { StatKey } from "../../src/engine/statRegistry"

const umbraOwnBuffDefs = () => classDefinition("bellstrikeUmbra")!.classBuffDefs

const TRACKED: StatKey[] = ["affinityDamageBoost", "phys.penetration", "bellstrike.penetration"]

// Built from tags, never from the display name — a def reaches an entity
// because the entity declares what it is (CLASSES.md § "Id schemes").
function skill(tags: string[]) {
  return makeSkill("test", { name: "probe", tags })
}

function sumsFor(params: Record<string, unknown>, tags: string[]) {
  const engine = new BuffEngine(params, [], umbraOwnBuffDefs())
  const result = engine.calculateDamageEffects(skill(tags), 0)
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
    expect(sumsFor(SWORD_HORIZON, ["role:bleedDetonation"])).toEqual({
      affinityDamageBoost: 0.18,
      "phys.penetration": 0.15,
      "bellstrike.penetration": 0.15,
    })
  })

  it("Combustion gets only the affinity-damage term, never the bleed penetration", () => {
    expect(sumsFor(SWORD_HORIZON, ["role:combustion"])).toEqual({
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
    expect(sumsFor({}, ["role:bleedDetonation"])).toEqual({
      affinityDamageBoost: 0,
      "phys.penetration": 0,
      "bellstrike.penetration": 0,
    })
  })
})

describe("Bellstrike Umbra bleed buff-defs — Skill Editor RECEIVES visibility", () => {
  it("surfaces both buff ids for the Blood Burst skill and neither for Sword Martial Q", () => {
    const detonation = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.name === "Blood Burst",
    )
    const swordQ = builtinSkillsForClass("bellstrikeUmbra").find(
      (s) => s.name === "Sword Martial Q",
    )
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
      (s) => s.name === "Blood Burst",
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
