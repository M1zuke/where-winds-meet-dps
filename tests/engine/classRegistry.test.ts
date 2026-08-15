import { describe, expect, it } from "vitest"
import {
  CLASS_IDS,
  classDefinition,
  grantsMinPhysCritBoostFor,
} from "../../src/definitions/classes/registry"
import { builtinBuffsForClass } from "../../src/engine/builtinBuffs"
import { prepareMechanics } from "../../src/engine/mechanics"
import type { MechanicSetup } from "../../src/engine/mechanics/types"
import { poisonExtensionForClass } from "../../src/definitions/classes/poisonExtensions"
import { buildBehaviors, DEFAULT_BEHAVIOR, type BuildView } from "../../src/engine/behavior"
import { defaultInputs } from "../../src/engine/defaults"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

describe("class registry — one call answers what a class is made of", () => {
  it("knows every class, and nothing else", () => {
    expect(CLASS_IDS()).toEqual(["bellstrikeUmbra", "stonesplitStrength", "bellstrikeSplendor"])
    expect(classDefinition("notAClass")).toBeNull()
  })

  it("assembles Bellstrike Umbra from every registry that used to be separate", () => {
    const umbra = classDefinition("bellstrikeUmbra")!
    expect(umbra.spec).toBe("bellstrike_umbra")
    expect(umbra.primaryAttribute).toBe("Bellstrike")
    expect(umbra.innerWays).toContain("swordHorizon")
    expect(umbra.classSpecificAttunements).toEqual([
      "bleedingDamage",
      "swordQ",
      "swordSpecial",
      "spearQ",
      "spearCharged",
    ])
    expect(umbra.skills.length).toBeGreaterThan(20)
    expect(umbra.debuffs.map((d) => d.id)).toContain(DEBUFF.bleedTick)
    expect(umbra.buffs.map((b) => b.name)).toContain("River Flow")
    expect(umbra.rotations.length).toBeGreaterThan(0)
    expect(umbra.defaultRotationId).toBeTruthy()
    expect(umbra.attunements.map((a) => a.id)).toEqual(
      expect.arrayContaining(["bleedingDamage", "swordQ"]),
    )
    expect(umbra.retunementPool).not.toBeNull()
  })

  it("gives every class a resolvable definition", () => {
    for (const classId of CLASS_IDS()) {
      const definition = classDefinition(classId)
      expect(definition, classId).not.toBeNull()
      expect(definition!.primaryAttribute, classId).toBeTruthy()
    }
  })
})

// One assertion per field `bellstrikeUmbra.ts` declares, so a field silently
// dropped from the literal — or a registration the barrel's loop stops
// performing — fails here rather than surfacing as a quieter behavior change.
describe("bellstrikeUmbra — every declared ClassDef field is wired", () => {
  const umbra = classDefinition("bellstrikeUmbra")!

  it("spec and classSpecificAttunements", () => {
    expect(umbra.spec).toBe("bellstrike_umbra")
    expect(umbra.classSpecificAttunements).toEqual([
      "bleedingDamage",
      "swordQ",
      "swordSpecial",
      "spearQ",
      "spearCharged",
    ])
  })

  it("allowedMindMethods, folded with the class signature into innerWays", () => {
    expect(umbra.allowedMindMethods).toEqual([
      "wolfchasersArt",
      "insightfulStrike",
      "moraleChant",
      "bitterSeason",
    ])
    expect(umbra.innerWays).toEqual([
      "swordHorizon",
      "wolfchasersArt",
      "insightfulStrike",
      "moraleChant",
      "bitterSeason",
    ])
  })

  it("classBuffDefs — the class's own — keeps its declared order", () => {
    expect(umbra.classBuffDefs.map((module) => module.id)).toEqual([
      "bellstrikeUmbraBleedPen",
      "bellstrikeUmbraBleedingDamage",
    ])
  })

  it("buffModules composes every slottable inner way's buffDefs (barrel order) ahead of the class's own", () => {
    expect(umbra.buffModules.map((module) => module.id)).toEqual([
      "buff-bellstrikeUmbra-zenith-bar",
      "potentRiverFlow",
      "wineGu",
      "soulShaken",
      "bellstrikeUmbraBleedPen",
      "bellstrikeUmbraBleedingDamage",
    ])
  })

  it("buffDefsForClass('bellstrikeUmbra') is the full 16-entry composition: inner-way owned, then the reordered globals, then the class's own", () => {
    expect(buffDefsForClass("bellstrikeUmbra").map((module) => module.id)).toEqual([
      "buff-bellstrikeUmbra-zenith-bar",
      "potentRiverFlow",
      "wineGu",
      "soulShaken",
      "revelryScript",
      "fluteBoost",
      "vulnerabilityTeammate",
      "jadeware",
      "mirage",
      "mirageBonus",
      "rainwhisperShield",
      "resistanceResolve",
      "surgingWaves",
      "dragonHeadLowHp",
      "bellstrikeUmbraBleedPen",
      "bellstrikeUmbraBleedingDamage",
    ])
  })

  it("gateBuffs are registered under this class id", () => {
    expect(builtinBuffsForClass("bellstrikeUmbra").map((buff) => buff.name)).toEqual([
      "River Flow",
      "Spear Special Cooldown",
      "Zenith Bar",
      "Zenith Detonation",
    ])
  })

  it("Umbra's own declared gateBuffs holds only its two class gates", () => {
    expect(umbra.gateBuffs.map((buff) => buff.name)).toEqual([
      "River Flow",
      "Spear Special Cooldown",
    ])
  })

  it("mechanics are registered for this class", () => {
    expect(umbra.mechanics.map(({ mechanic }) => mechanic.id)).toEqual(["levelAttributeBonus"])
    const setup: MechanicSetup = {
      inputs: defaultInputs,
      classId: "bellstrikeUmbra",
      fps: 60,
      rotationDurationSec: 10,
      hitTimesSec: [0],
      weaponHitTimesSec: [0],
      qiPhaseAt: () => "normal",
      paramOn: () => false,
      paramTier: () => 0,
      hasBuffEngine: true,
      effectiveRates: { precision: 1, critRate: 0.5, affinityRate: 0.2 },
    }
    const preparedIds = prepareMechanics(setup).map((prepared) => prepared.mechanic.id)
    expect(preparedIds).toContain("levelAttributeBonus")
  })

  it("the skill behaviour is registered for Blood Burst", () => {
    const bleedDetonation = umbra.skills.find((skill) => skill.id === SKILL.bleedDetonation)!
    const build: BuildView = {
      classId: "bellstrikeUmbra",
      innerWayTier: (name) => (name === "swordHorizon" ? 1 : null),
      classSpecificAttunement: () => 0,
      grantsMinPhysCritBoost: () => false,
    }
    expect(buildBehaviors(build)(bleedDetonation)).not.toBe(DEFAULT_BEHAVIOR)
    const noSwordHorizon: BuildView = { ...build, innerWayTier: () => null }
    expect(buildBehaviors(noSwordHorizon)(bleedDetonation)).toBe(DEFAULT_BEHAVIOR)
  })

  it("declares no skill behaviours of its own — the Blood Burst binding is Sword Horizon's", () => {
    expect(umbra.skillBehaviors).toEqual([])
  })

  it("declares no display gates of its own — Concentration's is Insightful Strike's", () => {
    expect(umbra.displayGates).toEqual([])
  })

  it("the poison extension is registered for this class", () => {
    expect(poisonExtensionForClass("bellstrikeUmbra")).toEqual({
      statusId: "buff-bellstrikeUmbra-zenith-detonation",
      maxRemainingSec: 16,
    })
    expect(poisonExtensionForClass("notAClass")).toBeUndefined()
  })

  it("critBoostWeaponTypes reads back false for every Umbra weapon type, and for an unknown class", () => {
    const umbraGrantsCritBoost = grantsMinPhysCritBoostFor("bellstrikeUmbra")
    expect(umbraGrantsCritBoost("Sword")).toBe(false)
    expect(umbraGrantsCritBoost("Spear")).toBe(false)
    expect(grantsMinPhysCritBoostFor("notAClass")("Sword")).toBe(false)
  })
})
