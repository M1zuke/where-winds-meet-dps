import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { BreakthroughDataDialog } from "../../src/ui/layout/breakthrough-data-dialog/BreakthroughDataDialog"
import { I18nProvider } from "../../src/i18n/I18nProvider"

const REQUEST = {
  classId: "bellstrikeUmbra",
  className: "Bellstrike Umbra",
  liveBreakthrough: 17,
  pendingInnerWays: [
    { id: "swordHorizon", name: "Sword Horizon", confirmedBreakthrough: 16 },
    { id: "moraleChant", name: "Morale Chant", confirmedBreakthrough: 15 },
  ],
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state })
}

function renderDialog(onClose = vi.fn()) {
  render(
    <I18nProvider>
      <BreakthroughDataDialog request={REQUEST} onClose={onClose} />
    </I18nProvider>,
  )
  return onClose
}

function closeButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Close" })
}

function advance(seconds: number): void {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  setVisibility("visible")
  vi.spyOn(document, "hasFocus").mockReturnValue(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setVisibility("visible")
})

describe("BreakthroughDataDialog", () => {
  it("names the class and the breakthrough that superseded its data", () => {
    renderDialog()
    expect(screen.getByText("Bellstrike Umbra")).toBeInTheDocument()
    expect(screen.getByText("17")).toBeInTheDocument()
  })

  it("lists every pending inner way by name, with the breakthrough its data is from", () => {
    renderDialog()
    for (const innerWay of REQUEST.pendingInnerWays) {
      const row = screen.getByText(innerWay.name).closest("li")
      expect(row).toHaveTextContent(String(innerWay.confirmedBreakthrough))
    }
  })

  it("holds the close button shut for fifteen focused seconds", () => {
    renderDialog()
    expect(closeButton()).toBeDisabled()
    advance(14)
    expect(closeButton()).toBeDisabled()
    advance(1)
    expect(closeButton()).toBeEnabled()
  })

  it("refuses Escape and a backdrop click while the hold runs", () => {
    const onClose = renderDialog()
    advance(14)
    fireEvent.keyDown(document, { key: "Escape" })
    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(onClose).not.toHaveBeenCalled()
  })

  it("closes on the button once the hold has run out", () => {
    const onClose = renderDialog()
    advance(15)
    fireEvent.click(closeButton())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("counts down no further while the tab is hidden", () => {
    renderDialog()
    advance(5)
    setVisibility("hidden")
    advance(60)
    setVisibility("visible")
    expect(closeButton()).toBeDisabled()
    advance(10)
    expect(closeButton()).toBeEnabled()
  })

  it("counts down no further while the window has lost focus", () => {
    renderDialog()
    advance(5)
    vi.mocked(document.hasFocus).mockReturnValue(false)
    advance(60)
    expect(screen.getByRole("timer")).toHaveTextContent("Paused")
    vi.mocked(document.hasFocus).mockReturnValue(true)
    advance(10)
    expect(closeButton()).toBeEnabled()
  })

  it("drops the countdown from the footer once the hold is over", () => {
    renderDialog()
    expect(screen.getByRole("timer")).toBeInTheDocument()
    advance(15)
    expect(screen.queryByRole("timer")).not.toBeInTheDocument()
  })
})
