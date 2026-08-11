// Ids and display names are persisted (`MindMethodSlot.id` / `.name`) —
// `tests/migrations/testProfiles/profile-v4.json` through `-v7.json` all
// store a slot by name alone, so both columns are pinned literally here.
import { describe, expect, it } from "vitest"
import { INNER_WAY_ID, INNER_WAY_NODE } from "../../src/data/innerWays/ids"
import { innerWayHasNode, innerWayNodeTier } from "../../src/definitions/innerWays/innerWayDef"
import {
  INNER_WAYS,
  innerWayDefinition,
  innerWayForBuffParam,
  innerWayIdForName,
  resolveInnerWayId,
} from "../../src/definitions/innerWays/registry"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { getMindMethodContributions } from "../../src/definitions/baseStats"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { bleedTick } from "../../src/data/skills/bellstrike-umbra/debuffs"
import { soulShaken } from "../../src/data/skills/bellstrike-umbra/buffs/soulShaken"
import { ZENITH_BAR_BUFF_ID } from "../../src/data/innerWays/swordHorizonZenith"
import { builtinBuffsForClass } from "../../src/engine/builtinBuffs"
import { displayGateFor } from "../../src/engine/buffs/displayGates"
import { specMechanicDefIds } from "../../src/engine/buffs/catalog"
import { prepareMechanics } from "../../src/engine/mechanics"
import type { MechanicSetup } from "../../src/engine/mechanics/types"
import type { Inputs } from "../../src/engine/types"

describe("INNER_WAYS — ids and display names are pinned", () => {
  it.each([
    [INNER_WAY_ID.bitterSeason, "Bitter Season"],
    [INNER_WAY_ID.insightfulStrike, "Insightful Strike"],
    [INNER_WAY_ID.moraleChant, "Morale Chant"],
    [INNER_WAY_ID.swordHorizon, "Sword Horizon"],
    [INNER_WAY_ID.wolfchasersArt, "Wolfchaser's Art"],
  ])("%s -> %s", (id, name) => {
    const def = INNER_WAYS.find((candidate) => candidate.id === id)
    expect(def?.name).toBe(name)
  })

  it("INNER_WAY_ID and the barrel name exactly the same set of ids", () => {
    const leafIds = new Set(Object.values(INNER_WAY_ID))
    const barrelIds = new Set(INNER_WAYS.map((def) => def.id))
    expect(barrelIds).toEqual(leafIds)
  })
})

describe("INNER_WAYS — selectable tiers", () => {
  it.each([
    [INNER_WAY_ID.swordHorizon, [6, 5]],
    [INNER_WAY_ID.wolfchasersArt, [6, 5]],
    [INNER_WAY_ID.moraleChant, [6, 5]],
    [INNER_WAY_ID.insightfulStrike, [6, 5]],
    [INNER_WAY_ID.bitterSeason, [6, 5, 4, 3, 2, 1]],
  ])("%s offers %j", (id, tiers) => {
    const def = INNER_WAYS.find((candidate) => candidate.id === id)
    expect(def?.selectableTiers).toEqual(tiers)
  })
})

describe("INNER_WAYS — buff params", () => {
  it("every declared buffParam is a value from PARAM", () => {
    const paramValues = new Set(Object.values(PARAM) as string[])
    for (const def of INNER_WAYS) {
      if (def.buffParam !== undefined) expect(paramValues.has(def.buffParam)).toBe(true)
    }
  })

  it("no two inner ways declare the same buffParam", () => {
    const params = INNER_WAYS.map((def) => def.buffParam).filter((param) => param !== undefined)
    expect(new Set(params).size).toBe(params.length)
  })

  it("Insightful Strike deliberately declares no buffParam", () => {
    const insightfulStrike = INNER_WAYS.find((def) => def.id === INNER_WAY_ID.insightfulStrike)
    expect(insightfulStrike?.buffParam).toBeUndefined()
  })

  it("innerWayForBuffParam resolves a param back to its inner way", () => {
    expect(innerWayForBuffParam(PARAM.swordHorizon)?.id).toBe(INNER_WAY_ID.swordHorizon)
    expect(innerWayForBuffParam("notAParam")).toBeUndefined()
  })
})

describe("getMindMethodContributions — panel stats are tier-invariant for four of the five", () => {
  const contributionsFor = (id: string, stacks: string) =>
    getMindMethodContributions({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      mindMethods: [
        { name: id, stacks },
        emptyMindMethod,
        emptyMindMethod,
        emptyMindMethod,
      ] as Inputs["mindMethods"],
    })

  it.each([
    [INNER_WAY_ID.swordHorizon, { "phys.max": 74.4, directAffinityRate: 0.023 }],
    [INNER_WAY_ID.wolfchasersArt, { affinityRate: 0.039, affinityDamageBoost: 0.052 }],
    [INNER_WAY_ID.moraleChant, { "phys.max": 49.6, "phys.min": 24.8, directCritRate: 0.046 }],
    [
      INNER_WAY_ID.insightfulStrike,
      { "phys.min": 22.3, "phys.max": 44.7, "phys.penetration": 0.051 },
    ],
  ])("%s grants the same block at tier 6 and tier 5", (id, expected) => {
    const atTier6 = contributionsFor(id, "tier 6")
    const atTier5 = contributionsFor(id, "tier 5")
    for (const [path, amount] of Object.entries(expected)) {
      expect(atTier6[path]).toBeCloseTo(amount, 10)
      expect(atTier5[path]).toBeCloseTo(amount, 10)
    }
  })
})

describe("INNER_WAY_NODE — every node is declared by exactly one def, at the tier the site source pins", () => {
  const defById = (id: string) => INNER_WAYS.find((candidate) => candidate.id === id)!

  it.each([
    [INNER_WAY_ID.swordHorizon, INNER_WAY_NODE.crosswindChargeRetention, 6],
    [INNER_WAY_ID.swordHorizon, INNER_WAY_NODE.dotDetonationRetention, 6],
    [INNER_WAY_ID.wolfchasersArt, INNER_WAY_NODE.soulShaken, 6],
    [INNER_WAY_ID.insightfulStrike, INNER_WAY_NODE.concentrationDotMultiplier, 6],
    [INNER_WAY_ID.insightfulStrike, INNER_WAY_NODE.concentrationSustainPair, 6],
    [INNER_WAY_ID.moraleChant, INNER_WAY_NODE.yiRiver, 6],
    [INNER_WAY_ID.bitterSeason, INNER_WAY_NODE.bitterSeasonStrongerDefenseReduction, 1],
    [INNER_WAY_ID.bitterSeason, INNER_WAY_NODE.bitterSeasonImprovedProcChance, 4],
    [INNER_WAY_ID.bitterSeason, INNER_WAY_NODE.bitterSeasonMaxStackPenetration, 6],
  ])("%s.%s unlocks at tier %d", (id, node, tier) => {
    const def = defById(id)
    expect(innerWayNodeTier(def, node)).toBe(tier)
    expect(innerWayHasNode(def, tier, node)).toBe(true)
    expect(innerWayHasNode(def, tier - 1, node)).toBe(false)
  })

  it("every INNER_WAY_NODE value is declared by exactly one def", () => {
    for (const node of Object.values(INNER_WAY_NODE)) {
      const owners = INNER_WAYS.filter((def) => innerWayNodeTier(def, node) !== undefined)
      expect(owners, node).toHaveLength(1)
    }
  })
})

describe("a tier-6 node resolves to 6, never undefined, feeding buffEngineEquivalence.fixture.json", () => {
  it("Bleed Tick's detonation.retainMinTier is the number 6", () => {
    expect(bleedTick.detonation?.retainMinTier).toBe(6)
  })

  it("Soul Shaken's requires.minTier is the number 6", () => {
    expect(soulShaken.requires?.minTier).toBe(6)
  })
})

describe("resolveInnerWayId", () => {
  it("resolves an id to itself", () => {
    expect(resolveInnerWayId(INNER_WAY_ID.moraleChant)).toBe(INNER_WAY_ID.moraleChant)
  })

  it("resolves a display name to its id", () => {
    expect(resolveInnerWayId("Sword Horizon")).toBe(INNER_WAY_ID.swordHorizon)
    expect(innerWayIdForName("Sword Horizon")).toBe(INNER_WAY_ID.swordHorizon)
  })

  it("returns the input unchanged for an unknown name, and '' for empty", () => {
    expect(resolveInnerWayId("notAnInnerWay")).toBe("notAnInnerWay")
    expect(resolveInnerWayId("")).toBe("")
  })
})

describe("inner-way ownership — gate buffs, display gates, and the merged Zenith Bar", () => {
  it("Sword Horizon declares exactly Zenith Bar and Zenith Detonation, by their frozen ids", () => {
    const swordHorizon = innerWayDefinition(INNER_WAY_ID.swordHorizon)!
    expect(swordHorizon.gateBuffs?.map((gate) => gate.id)).toEqual([
      "buff-bellstrikeUmbra-zenith-bar",
      "buff-bellstrikeUmbra-zenith-detonation",
    ])
    expect(swordHorizon.gateBuffs?.map((gate) => gate.name)).toEqual([
      "Zenith Bar",
      "Zenith Detonation",
    ])
  })

  it("every gate an inner way declares reaches builtinBuffsForClass for each class that may slot it", () => {
    for (const classDef of CLASS_DEFS()) {
      const innerWayIds = [classDef.classMindGroup, ...classDef.allowedMindMethods].filter(Boolean)
      const classBuffs = builtinBuffsForClass(classDef.id)
      for (const innerWayId of innerWayIds) {
        for (const gate of innerWayDefinition(innerWayId)?.gateBuffs ?? []) {
          const registered = classBuffs.find((buff) => buff.id === gate.id)
          expect(registered, `${classDef.id}/${gate.id}`).toBeTruthy()
          expect(registered!.classId).toBe(classDef.id)
        }
      }
    }
  })

  it("builtinBuffsForClass('bellstrikeUmbra') returns the four gates in pinned order, each carrying its class id", () => {
    const buffs = builtinBuffsForClass("bellstrikeUmbra")
    expect(buffs.map((buff) => buff.name)).toEqual([
      "River Flow",
      "Spear Special Cooldown",
      "Zenith Bar",
      "Zenith Detonation",
    ])
    for (const buff of buffs) expect(buff.classId).toBe("bellstrikeUmbra")
  })

  it("Insightful Strike's display gate answers on the slotted inner ways alone, no class check", () => {
    const gate = displayGateFor(BUFF.concentration)!
    const insightfulStrikeSlotted: Inputs = {
      ...defaultInputs,
      classId: "notARealClass",
      mindMethods: [
        { name: "Insightful Strike", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    expect(gate(insightfulStrikeSlotted)).toBe(true)
    expect(gate({ ...defaultInputs, classId: "bellstrikeUmbra" })).toBe(false)
  })

  it("the Concentration mechanic prepares for a build with Insightful Strike slotted", () => {
    const setup: MechanicSetup = {
      inputs: {
        ...defaultInputs,
        classId: "bellstrikeUmbra",
        mindMethods: [
          { name: "Insightful Strike", stacks: "tier 6" },
          { ...emptyMindMethod },
          { ...emptyMindMethod },
          { ...emptyMindMethod },
        ],
      },
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
    expect(preparedIds).toContain("concentration")
  })

  it("the merged Zenith Bar id is not a spec-mechanic def id, so it never hides the timeline chip", () => {
    expect(specMechanicDefIds("bellstrikeUmbra").has(ZENITH_BAR_BUFF_ID)).toBe(false)
  })
})
