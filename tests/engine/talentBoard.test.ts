import { describe, expect, it } from "vitest"
import {
  TALENT_BOARD_CELLS,
  TALENT_POINT_BUDGET,
  closeDisabledTalentNodes,
  effectiveDisabledTalentNodes,
  formlessAttack,
  getConfiguredBase,
  isTalentNodeTaken,
  playerAttributes,
  takenRanks,
  takenTalentPoints,
  talentBoardTotals,
  talentNodesAboveBreakthrough,
  withTalentCellRanks,
} from "../../src/definitions/baseStats"
import { TALENT_BOARD } from "../../src/data/baseStats"
import { defaultInputs } from "../../src/engine/defaults"
import type { DisabledTalentNodes, Inputs } from "../../src/engine/types"

const ATTRIBUTE_STATS = ["agility", "body", "defense", "momentum", "power"]

function withDisabled(disabled: DisabledTalentNodes): Inputs {
  return { ...defaultInputs, disabledTalentNodes: disabled }
}

function cellGranting(stat: string) {
  return TALENT_BOARD_CELLS.find((cell) => cell.ranks[0].effects && stat in cell.ranks[0].effects)!
}

describe("talent board authoring", () => {
  it("carries 122 nodes, one point each", () => {
    expect(TALENT_BOARD).toHaveLength(122)
    expect(TALENT_POINT_BUDGET).toBe(122)
    expect(new Set(TALENT_BOARD.map((node) => node.id)).size).toBe(TALENT_BOARD.length)
  })

  it("hangs every node but the first off a node the board defines", () => {
    const ids = new Set(TALENT_BOARD.map((node) => node.id))
    const roots = TALENT_BOARD.filter((node) => node.requires === undefined)
    expect(roots).toHaveLength(1)
    for (const node of TALENT_BOARD) {
      if (node.requires === undefined) continue
      expect(ids.has(node.requires), `${node.id} requires a node the board lacks`).toBe(true)
    }
  })

  it("stacks a grid position's ranks in id order and hangs a branch off the first of them", () => {
    for (const cell of TALENT_BOARD_CELLS) {
      const ids = cell.ranks.map((node) => node.id)
      expect(ids).toEqual([...ids].sort((left, right) => left - right))
      for (let index = 1; index < cell.ranks.length; index++) {
        expect(cell.ranks[index].requires).toBe(cell.ranks[index - 1].id)
      }
    }
  })

  it("grants all five attributes, not just power/agility/momentum, on all 19 of its nodes", () => {
    const allFive = TALENT_BOARD.filter((node) => Object.keys(node.effects ?? {}).length === 5)
    expect(allFive).toHaveLength(19)
    for (const node of allFive) {
      expect(Object.keys(node.effects ?? {}).sort()).toEqual(ATTRIBUTE_STATS)
    }
  })

  it("totals +7000 Max HP and +92.4 Physical Defense over the whole board", () => {
    const totals = talentBoardTotals([])
    expect(totals.maxHp).toBe(7000)
    expect(totals.physDef).toBeCloseTo(92.4, 9)
  })

  it("keeps a min/max attack pair as two separate nodes", () => {
    for (const node of TALENT_BOARD) {
      const stats = Object.keys(node.effects ?? {})
      expect(stats.includes("minPhys") && stats.includes("maxPhys")).toBe(false)
      expect(stats.includes("minFormless") && stats.includes("maxFormless")).toBe(false)
    }
  })

  it("leaves 31 nodes without a stat, which cost their point and grant nothing", () => {
    expect(TALENT_BOARD.filter((node) => !node.effects)).toHaveLength(31)
  })
})

describe("the prerequisite chain", () => {
  it("counts every node as taken while nothing is disabled", () => {
    expect(takenTalentPoints([])).toBe(TALENT_POINT_BUDGET)
    for (const node of TALENT_BOARD) expect(isTalentNodeTaken([], node.id)).toBe(true)
  })

  it("drops everything behind a disabled node", () => {
    const root = TALENT_BOARD[0]
    expect(closeDisabledTalentNodes([root.id])).toHaveLength(TALENT_BOARD.length)
    expect(takenTalentPoints(closeDisabledTalentNodes([root.id]))).toBe(0)
  })

  it("leaves a leaf's neighbours alone", () => {
    const leaf = TALENT_BOARD_CELLS.find(
      (cell) =>
        cell.ranks.length === 1 && !TALENT_BOARD.some((node) => node.requires === cell.ranks[0].id),
    )!
    expect(closeDisabledTalentNodes([leaf.ranks[0].id])).toEqual([leaf.ranks[0].id])
  })

  it("takes a rank at a time and clears the whole position in one step", () => {
    const stacked = TALENT_BOARD_CELLS.find((cell) => cell.ranks.length === 4)!
    const cleared = withTalentCellRanks([], stacked, 0)
    expect(takenRanks(stacked, cleared)).toBe(0)
    const twoRanks = withTalentCellRanks(cleared, stacked, 2)
    expect(takenRanks(stacked, twoRanks)).toBe(2)
    expect(withTalentCellRanks(twoRanks, stacked, 4)).toEqual(
      cleared.filter((id) => !stacked.ranks.some((rank) => rank.id === id)),
    )
  })

  it("never mutates the set it was handed", () => {
    const before: number[] = []
    withTalentCellRanks(before, TALENT_BOARD_CELLS[0], 0)
    expect(before).toEqual([])
  })
})

describe("the breakthrough the profile stands at", () => {
  it("holds back every node behind a higher Solo Mode level", () => {
    const blocked = talentNodesAboveBreakthrough(16)
    expect(blocked.length).toBeGreaterThan(0)
    for (const id of blocked) {
      const node = TALENT_BOARD.find((candidate) => candidate.id === id)!
      const gated = node.gate?.kind === "worldLevel" && node.gate.value > 16
      const behindGated = blocked.includes(node.requires ?? -1)
      expect(gated || behindGated).toBe(true)
    }
  })

  it("takes the newly reachable nodes the moment the breakthrough rises", () => {
    expect(takenTalentPoints(effectiveDisabledTalentNodes([], 16))).toBeLessThan(
      TALENT_POINT_BUDGET,
    )
    expect(takenTalentPoints(effectiveDisabledTalentNodes([], 17))).toBe(TALENT_POINT_BUDGET)
  })

  it("keeps the nodes the user switched off when the breakthrough rises", () => {
    const own = [101071]
    expect(effectiveDisabledTalentNodes(own, 17)).toEqual(own)
    expect(effectiveDisabledTalentNodes(own, 16)).toContain(101071)
  })

  it("reaches the engine, so a lower breakthrough scores fewer nodes", () => {
    expect(formlessAttack(16).max).toBeLessThan(formlessAttack(17).max)
    expect(playerAttributes(16).power).toBeLessThan(playerAttributes(17).power)
  })
})

describe("switching a talent node off", () => {
  it("leaves the base untouched when nothing is disabled", () => {
    expect(getConfiguredBase(withDisabled([]), [])).toEqual(getConfiguredBase(defaultInputs, []))
  })

  it("lowers a rate on the configured base", () => {
    const cell = cellGranting("critRate")
    const before = getConfiguredBase(withDisabled([]), [])
    const after = getConfiguredBase(withDisabled(withTalentCellRanks([], cell, 0)), [])
    expect(before.critRate - after.critRate).toBeCloseTo(
      cell.ranks.reduce((sum, rank) => sum + (rank.effects?.critRate ?? 0), 0),
      9,
    )
  })

  it("takes only the min side down when a min-phys position goes off", () => {
    const cell = cellGranting("minPhys")
    const before = getConfiguredBase(withDisabled([]), [])
    const after = getConfiguredBase(withDisabled(withTalentCellRanks([], cell, 0)), [])
    expect(before["phys.min"] - after["phys.min"]).toBeCloseTo(
      cell.ranks.reduce((sum, rank) => sum + (rank.effects?.minPhys ?? 0), 0),
      9,
    )
    expect(after["phys.max"]).toBeCloseTo(before["phys.max"], 9)
  })

  it("carries an attribute node through the attribute conversion", () => {
    const cell = cellGranting("power")
    const disabled = withTalentCellRanks([], cell, 0)
    expect(playerAttributes(defaultInputs.breakthrough, disabled).power).toBeLessThan(
      playerAttributes(defaultInputs.breakthrough).power,
    )
    const before = getConfiguredBase(withDisabled([]), [])
    const after = getConfiguredBase(withDisabled(disabled), [])
    expect(after["phys.max"]).toBeLessThan(before["phys.max"])
    expect(after.critRate).toBeLessThan(before.critRate)
  })

  it("ignores a stored id the board does not define", () => {
    expect(getConfiguredBase(withDisabled([999999]), [])).toEqual(
      getConfiguredBase(withDisabled([]), []),
    )
  })
})
