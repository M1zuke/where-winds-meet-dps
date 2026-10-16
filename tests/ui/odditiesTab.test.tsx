import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import { RELEASED_ODDITY_BOARD } from "../../src/definitions/baseStats"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { ConfirmContext } from "../../src/ui/components/confirm-dialog/confirmContext"
import { OdditiesTab } from "../../src/ui/features/talents/oddities-tab/OdditiesTab"

const NEWEST = RELEASED_ODDITY_BOARD[RELEASED_ODDITY_BOARD.length - 1]
const OLDEST = RELEASED_ODDITY_BOARD[0]

function renderTab(inputs: Inputs = defaultInputs, onChange = vi.fn()) {
  render(
    <I18nProvider>
      <ConfirmContext.Provider value={() => Promise.resolve(true)}>
        <OdditiesTab inputs={inputs} onChange={onChange} />
      </ConfirmContext.Provider>
    </I18nProvider>,
  )
  return onChange
}

function nodes(): Element[] {
  return [...document.querySelectorAll('g[role="button"]')]
}

function unclaimedFrom(onChange: ReturnType<typeof vi.fn>): Record<string, readonly number[]> {
  return (onChange.mock.calls[0][0] as Inputs).unclaimedOddityNodes
}

describe("OdditiesTab", () => {
  it("lists the regions newest first and opens the newest one", () => {
    renderTab()
    const headers = [...document.querySelectorAll("button[aria-expanded]")]
    expect(headers[0]).toHaveAttribute("aria-expanded", "true")
    expect(headers[0].textContent).toContain(NEWEST.key)
    expect(headers[headers.length - 1].textContent).toContain(OLDEST.key)
  })

  it("does not list an unreleased region", () => {
    renderTab()
    expect(document.body.textContent).not.toContain("Jiangnan")
  })

  it("keeps the stored entry of an unreleased region when everything is reset", async () => {
    const onChange = renderTab({
      ...defaultInputs,
      unclaimedOddityNodes: { Jiangnan: [700], [NEWEST.key]: [NEWEST.nodes[0].id] },
    })
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(unclaimedFrom(onChange)).toEqual({ Jiangnan: [700] })
  })

  it("draws only the open region's board", () => {
    renderTab()
    expect(nodes()).toHaveLength(NEWEST.nodes.length)
  })

  it("names every chapter of the open region above the board", () => {
    renderTab()
    for (const chapter of new Set(NEWEST.chapters)) {
      expect(screen.getAllByText(chapter).length).toBeGreaterThan(0)
    }
  })

  it("switches the drawn board when another region is opened", () => {
    renderTab()
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${OLDEST.key}`) }))
    expect(nodes()).toHaveLength(OLDEST.nodes.length)
  })

  it("releases a claimed melody together with everything past it", () => {
    const onChange = renderTab()
    fireEvent.click(nodes()[0])
    expect(unclaimedFrom(onChange)[NEWEST.key]).toHaveLength(NEWEST.nodes.length)
  })

  it("claims a released melody together with the chain in front of it", () => {
    const last = NEWEST.nodes[NEWEST.nodes.length - 1]
    const released = { [NEWEST.key]: NEWEST.nodes.map((node) => node.id) }
    const onChange = renderTab({ ...defaultInputs, unclaimedOddityNodes: released })
    fireEvent.click(nodes()[NEWEST.nodes.length - 1])
    const unclaimed = unclaimedFrom(onChange)
    expect(unclaimed[NEWEST.key] ?? []).not.toContain(last.id)
    expect(unclaimed[NEWEST.key] ?? []).not.toContain(last.requires)
  })

  it("draws a claimed melody the same whether or not the calculator reads it", () => {
    renderTab()
    const withStat = NEWEST.nodes.findIndex((node) => node.stat)
    const withoutStat = NEWEST.nodes.findIndex((node) => !node.stat)
    expect(nodes()[withStat]).toHaveAttribute("data-state", "claimed")
    expect(nodes()[withoutStat]).toHaveAttribute("data-state", "claimed")
  })

  it("gives every melody an icon", () => {
    renderTab()
    for (const node of nodes()) {
      expect(node.querySelector("use")?.getAttribute("href")).toMatch(/^#oddityIcon/)
    }
  })
})
