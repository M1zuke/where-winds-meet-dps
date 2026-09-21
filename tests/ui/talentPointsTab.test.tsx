import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import type { TalentBoardCell } from "../../src/definitions/baseStats"
import {
  TALENT_BOARD_CELLS,
  TALENT_POINT_BUDGET,
  closeDisabledTalentNodes,
  talentNodesAboveBreakthrough,
} from "../../src/definitions/baseStats"
import { TALENT_BOARD } from "../../src/data/baseStats"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmProvider } from "../../src/ui/components/confirm-dialog/ConfirmDialog"
import { TalentPointsTab } from "../../src/ui/features/talents/talent-points-tab/TalentPointsTab"

const ROOT = TALENT_BOARD_CELLS[0]
const STACKED = TALENT_BOARD_CELLS.find((cell) => cell.ranks.length === 4)!
const EVERY_NODE = TALENT_BOARD.map((node) => node.id)

function renderTab(inputs: Inputs, onChange = vi.fn()) {
  render(
    <I18nProvider>
      <ConfirmProvider>
        <TalentPointsTab inputs={inputs} onChange={onChange} />
      </ConfirmProvider>
    </I18nProvider>,
  )
  return onChange
}

function nodes(): Element[] {
  return [...document.querySelectorAll('g[role="button"]')]
}

function nodeFor(cell: TalentBoardCell): Element {
  return nodes()[TALENT_BOARD_CELLS.indexOf(cell)]
}

function disabledFrom(onChange: ReturnType<typeof vi.fn>): number[] {
  return (onChange.mock.calls[0][0] as Inputs).disabledTalentNodes as number[]
}

describe("TalentPointsTab", () => {
  it("draws one node per grid position rather than a card per stat", () => {
    renderTab({ ...defaultInputs, breakthrough: 17 })
    expect(nodes()).toHaveLength(TALENT_BOARD_CELLS.length)
  })

  it("opens with every node the profile's breakthrough reaches taken", () => {
    renderTab({ ...defaultInputs, breakthrough: 17 })
    for (const node of nodes()) expect(node.getAttribute("data-state")).toBe("full")
  })

  it("greys out a node behind a higher breakthrough and refuses the click", () => {
    const gated = TALENT_BOARD_CELLS.find((cell) =>
      talentNodesAboveBreakthrough(16).includes(cell.ranks[0].id),
    )!
    const onChange = renderTab({ ...defaultInputs, breakthrough: 16 })
    expect(nodeFor(gated).getAttribute("data-state")).toBe("gated")
    fireEvent.click(nodeFor(gated))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("takes the node itself once the breakthrough reaches it", () => {
    const gated = TALENT_BOARD_CELLS.find((cell) =>
      talentNodesAboveBreakthrough(16).includes(cell.ranks[0].id),
    )!
    renderTab({ ...defaultInputs, breakthrough: 17 })
    expect(nodeFor(gated).getAttribute("data-state")).toBe("full")
  })

  it("clears a full position together with everything behind it", () => {
    const onChange = renderTab({ ...defaultInputs, breakthrough: 17 })
    fireEvent.click(nodeFor(ROOT))
    expect(disabledFrom(onChange)).toHaveLength(TALENT_POINT_BUDGET)
  })

  it("leaves the rest of the board alone when a leaf goes off", () => {
    const leaf = TALENT_BOARD_CELLS.find(
      (cell) =>
        cell.ranks.length === 1 && !TALENT_BOARD.some((node) => node.requires === cell.ranks[0].id),
    )!
    const onChange = renderTab({ ...defaultInputs, breakthrough: 17 })
    fireEvent.click(nodeFor(leaf))
    expect(disabledFrom(onChange)).toEqual([leaf.ranks[0].id])
  })

  it("takes one rank per click on a stacked position", () => {
    const cleared = closeDisabledTalentNodes(STACKED.ranks.map((rank) => rank.id))
    const onChange = renderTab({ ...defaultInputs, breakthrough: 17, disabledTalentNodes: cleared })
    fireEvent.click(nodeFor(STACKED))
    expect(disabledFrom(onChange)).toEqual(cleared.filter((id) => id !== STACKED.ranks[0].id))
  })

  it("refuses a node whose predecessor is not taken", () => {
    const onChange = renderTab({
      ...defaultInputs,
      breakthrough: 17,
      disabledTalentNodes: EVERY_NODE,
    })
    fireEvent.click(nodeFor(STACKED))
    expect(onChange).not.toHaveBeenCalled()
    expect(nodeFor(STACKED).getAttribute("data-state")).toBe("locked")
  })

  it("offers the node the cleared board starts from", () => {
    const onChange = renderTab({
      ...defaultInputs,
      breakthrough: 17,
      disabledTalentNodes: EVERY_NODE,
    })
    expect(nodeFor(ROOT).getAttribute("data-state")).toBe("ready")
    fireEvent.click(nodeFor(ROOT))
    expect(disabledFrom(onChange)).not.toContain(ROOT.ranks[0].id)
  })

  it("counts the points the board has spent", () => {
    renderTab({ ...defaultInputs, breakthrough: 17 })
    expect(document.body.textContent).toContain(`${TALENT_POINT_BUDGET}`)
  })

  it("sums only the nodes left on", () => {
    renderTab({
      ...defaultInputs,
      disabledTalentNodes: closeDisabledTalentNodes([TALENT_BOARD[0].id]),
    })
    expect(document.querySelectorAll("dt")).toHaveLength(0)
  })
})
