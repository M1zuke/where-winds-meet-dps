import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { MockWorker } = vi.hoisted(() => {
  class Mock {
    onmessage: ((event: { data: unknown }) => void) | null = null
    postMessage() {}
    terminate() {}
  }
  return { MockWorker: Mock }
})

vi.mock("../../src/engine/dpsWorker?worker", () => ({ default: MockWorker }))

const { defaultInputs } = await import("../../src/engine/defaults")
const { saveProfiles } = await import("../../src/storage")
const { App } = await import("../../src/app/App")

function trigger(): HTMLElement {
  return screen.getByRole("button", { name: /Encounter Settings/ })
}

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ""
  vi.spyOn(document, "hasFocus").mockReturnValue(true)
  saveProfiles({
    profiles: [{ id: "only", name: "Only", inputs: { ...defaultInputs } }],
    activeId: "only",
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("Encounter Settings in the header", () => {
  it("sits in the header metrics card and opens the dialog", () => {
    render(<App />)

    fireEvent.click(trigger())

    expect(screen.getByRole("dialog", { name: "Encounter Settings" })).toBeInTheDocument()
  })

  it("stays available on tabs other than the overview", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("tab", { name: "Gear" }))

    expect(trigger()).toBeEnabled()
  })
})
