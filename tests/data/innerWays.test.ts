// Ids and display names are persisted (`MindMethodSlot.id` / `.name`) —
// `tests/migrations/testProfiles/profile-v4.json` through `-v7.json` all
// store a slot by name alone, so both columns are pinned literally here.
import { describe, expect, it } from "vitest"
import { INNER_WAY_ID, INNER_WAY_NODE } from "../../src/data/innerWays/ids"
import { INNER_WAYS } from "../../src/data/innerWays"
import { innerWayHasNode, innerWayNodeTier } from "../../src/data/innerWays/define"
import {
  innerWayForBuffParam,
  innerWayIdForName,
  resolveInnerWayId,
} from "../../src/data/innerWays/registry"
import { PARAM } from "../../src/data/skills/buffs/ids"
import { getMindMethodContributions } from "../../src/data/baseStats"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { bleedTick } from "../../src/data/skills/bellstrike-umbra/debuffs"
import { soulShaken } from "../../src/data/skills/bellstrike-umbra/buffs/soulShaken"
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
