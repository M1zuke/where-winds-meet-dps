import { describe, expect, it } from "vitest"
import {
  ODDITY_BOARD,
  claimedOddityCost,
  claimedOddityNodes,
  closeUnclaimedOddityNodes,
  getConfiguredBase,
  isOddityNodeClaimed,
  oddityBoardTotals,
  oddityContributions,
  oddityHpTotal,
  oddityPhysDefTotal,
  withOddityNodeClaimed,
} from "../../src/definitions/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs, UnclaimedOddityNodes } from "../../src/engine/types"

function rawTotals(): { min: number; max: number } {
  let min = 0
  let max = 0
  for (const region of ODDITY_BOARD) {
    for (const node of region.nodes) {
      if (node.stat === "minPhys") min += node.value ?? 0
      if (node.stat === "maxPhys") max += node.value ?? 0
    }
  }
  return { min, max }
}

function releasedEverywhere(): UnclaimedOddityNodes {
  const released: UnclaimedOddityNodes = {}
  for (const region of ODDITY_BOARD) released[region.key] = region.nodes.map((node) => node.id)
  return released
}

describe("oddity board", () => {
  it("sums phys.min/phys.max of a fully claimed board to the board's own totals", () => {
    const out = oddityContributions({})
    const raw = rawTotals()
    expect(out["phys.min"]).toBeCloseTo(raw.min, 6)
    expect(out["phys.max"]).toBeCloseTo(raw.max, 6)
  })

  it("leaves the attack-melody total at 124", () => {
    const raw = rawTotals()
    expect(raw.min + raw.max).toBe(124)
  })

  it("sums every region's Max HP melodies to 8150", () => {
    expect(oddityHpTotal({})).toBe(8150)
  })

  it("sums every region's Physical Defense melodies to 50", () => {
    expect(oddityPhysDefTotal({})).toBe(50)
  })

  it("keeps Max HP and Physical Defense off the combat base, unlike the attack melodies", () => {
    const out = oddityContributions({})
    expect(out.maxHp).toBeUndefined()
    expect(out.physDef).toBeUndefined()
  })

  it("contributes nothing once every region is released", () => {
    const released = releasedEverywhere()
    expect(oddityContributions(released)["phys.min"] ?? 0).toBe(0)
    expect(oddityContributions(released)["phys.max"] ?? 0).toBe(0)
    expect(oddityHpTotal(released)).toBe(0)
    expect(oddityPhysDefTotal(released)).toBe(0)
  })

  it("seeds a fully claimed board when inputs carry no oddity field", () => {
    const legacy = { ...defaultInputs } as Partial<Inputs>
    delete legacy.unclaimedOddityNodes
    const withoutField = getConfiguredBase(legacy as Inputs, [])
    const withField = getConfiguredBase({ ...defaultInputs, unclaimedOddityNodes: {} }, [])
    expect(withoutField["phys.min"]).toBeCloseTo(withField["phys.min"], 6)
    expect(withoutField["phys.max"]).toBeCloseTo(withField["phys.max"], 6)
  })

  it("releasing a melody releases everything that hangs off it", () => {
    const region = ODDITY_BOARD[0]
    const released = withOddityNodeClaimed({}, region.key, region.nodes[0].id, false)
    expect(released[region.key]).toHaveLength(region.nodes.length)
    expect(claimedOddityNodes(released, region.key)).toHaveLength(0)
    expect(claimedOddityCost(released, region.key)).toBe(0)
  })

  it("claiming a melody claims the chain in front of it", () => {
    const region = ODDITY_BOARD[0]
    const last = region.nodes[region.nodes.length - 1]
    const released = withOddityNodeClaimed({}, region.key, region.nodes[0].id, false)
    const claimed = withOddityNodeClaimed(released, region.key, last.id, true)

    let cursor = last.requires
    while (cursor !== undefined) {
      expect(isOddityNodeClaimed(claimed, region.key, cursor)).toBe(true)
      cursor = region.nodes.find((node) => node.id === cursor)?.requires
    }
    expect(isOddityNodeClaimed(claimed, region.key, last.id)).toBe(true)
  })

  it("lowers the base by exactly one melody's value when that melody is released", () => {
    const region = ODDITY_BOARD[0]
    const leaf = [...region.nodes]
      .reverse()
      .find(
        (node) =>
          node.stat === "maxPhys" &&
          !region.nodes.some((candidate) => candidate.requires === node.id),
      )!
    const inputs: Inputs = { ...defaultInputs, unclaimedOddityNodes: {} }
    const after = {
      ...inputs,
      unclaimedOddityNodes: withOddityNodeClaimed({}, region.key, leaf.id, false),
    }
    const before = getConfiguredBase(inputs, [])
    expect(before["phys.max"] - getConfiguredBase(after, [])["phys.max"]).toBeCloseTo(
      leaf.value ?? 0,
      6,
    )
  })

  it("closes an unclaimed list over the melodies behind it", () => {
    const region = ODDITY_BOARD[0]
    const opener = region.nodes.find(
      (node) => node.kind === "opener" && node.requires !== undefined,
    )!
    const closed = closeUnclaimedOddityNodes(region.key, [opener.id])
    const children = region.nodes.filter((node) => node.requires === opener.id)
    expect(children.length).toBeGreaterThan(0)
    for (const child of children) expect(closed).toContain(child.id)
  })

  it("gives every melody an icon, a chapter and a cost", () => {
    for (const region of ODDITY_BOARD) {
      expect(region.chapters).toHaveLength(12)
      for (const node of region.nodes) {
        expect(node.icon).not.toBe("")
        expect(node.chapter).toBeGreaterThanOrEqual(1)
        expect(node.chapter).toBeLessThanOrEqual(12)
        expect(node.cost).toBeGreaterThan(0)
      }
    }
  })

  it("reports the same stat totals through the board summary as through the engine helpers", () => {
    const totals = oddityBoardTotals({})
    expect(totals.maxHp).toBe(oddityHpTotal({}))
    expect(totals.physDef).toBe(oddityPhysDefTotal({}))
    expect(totals.maxPhys).toBe(rawTotals().max)
    expect(totals.minPhys).toBe(rawTotals().min)
  })
})
