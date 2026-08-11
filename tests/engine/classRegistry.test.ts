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
import { displayGateFor } from "../../src/engine/buffs/displayGates"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"

describe("class registry — one call answers what a class is made of", () => {
  it("knows every class, and nothing else", () => {
    expect(CLASS_IDS()).toContain("bellstrikeUmbra")
    expect(CLASS_IDS()).toHaveLength(1)
    expect(classDefinition("notAClass")).toBeNull()
  })

  it("assembles Bellstrike Umbra from every registry that used to be separate", () => {
    const umbra = classDefinition("bellstrikeUmbra")!
    expect(umbra.spec).toBe("bellstrike_umbra")
    expect(umbra.primaryAttribute).toBe("Bellstrike")
    expect(umbra.innerWays).toContain("swordHorizon")
    expect(umbra.dingYinTags).toEqual(["Bleed Boost"])
    expect(umbra.skills.length).toBeGreaterThan(20)
    expect(umbra.debuffs.map((d) => d.name)).toContain("Bleed Tick")
    expect(umbra.buffs.map((b) => b.name)).toContain("River Flow")
    expect(umbra.rotations.length).toBeGreaterThan(0)
    expect(umbra.defaultRotationId).toBeTruthy()
    expect(umbra.attunements.map((a) => a.id)).toContain("bleedingDamage")
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

  it("spec and dingYinTags", () => {
    expect(umbra.spec).toBe("bellstrike_umbra")
    expect(umbra.dingYinTags).toEqual(["Bleed Boost"])
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

  it("classBuffDefs keeps its declared order", () => {
    expect(umbra.classBuffDefs.map((module) => module.id)).toEqual([
      "concentration",
      "potentRiverFlow",
      "wineGu",
      "crosswindSpirit",
      "revelryScript",
      "fluteBoost",
    ])
  })

  it("mechanicBuffDefs keeps its declared order", () => {
    expect(umbra.mechanicBuffDefs.map((module) => module.id)).toEqual([
      "soulShaken",
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

  it("mechanics are registered and prepare for this class", () => {
    const insightfulStrikeInputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: "Insightful Strike", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    const setup: MechanicSetup = {
      inputs: insightfulStrikeInputs,
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
    expect(preparedIds).toContain("concentration")
  })

  it("the skill behaviour is registered for Bleed Detonation", () => {
    const bleedDetonation = umbra.skills.find((skill) => skill.name === "Bleed Detonation")!
    const build: BuildView = {
      classId: "bellstrikeUmbra",
      innerWayTier: (name) => (name === "swordHorizon" ? 1 : null),
      dingYin: () => 0,
      grantsMinPhysCritBoost: () => false,
    }
    expect(buildBehaviors(build)(bleedDetonation)).not.toBe(DEFAULT_BEHAVIOR)
    const noSwordHorizon: BuildView = { ...build, innerWayTier: () => null }
    expect(buildBehaviors(noSwordHorizon)(bleedDetonation)).toBe(DEFAULT_BEHAVIOR)
  })

  it("the display gate is registered for concentration", () => {
    const gate = displayGateFor("concentration")!
    expect(
      gate({
        ...defaultInputs,
        classId: "bellstrikeUmbra",
        mindMethods: [
          { name: "Insightful Strike", stacks: "tier 6" },
          { ...emptyMindMethod },
          { ...emptyMindMethod },
          { ...emptyMindMethod },
        ],
      }),
    ).toBe(true)
    expect(gate({ ...defaultInputs, classId: "bellstrikeUmbra" })).toBe(false)
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
