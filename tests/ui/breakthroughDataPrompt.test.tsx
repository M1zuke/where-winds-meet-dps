import { act, fireEvent, render, screen } from "@testing-library/react"
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
const { BREAKTHROUGH_RELEASES } = await import("../../src/definitions/baseStats/breakthroughs")
const { App } = await import("../../src/app/App")

const AFTER_EVERY_RELEASE = BREAKTHROUGH_RELEASES[BREAKTHROUGH_RELEASES.length - 1].at

function dismissDialog(): void {
  act(() => {
    vi.advanceTimersByTime(15_000)
  })
  fireEvent.click(screen.getByRole("button", { name: "Close" }))
}

function chooseClass(className: string): void {
  fireEvent.click(screen.getByRole("combobox", { name: "Class" }))
  fireEvent.mouseDown(screen.getByRole("option", { name: new RegExp(className) }))
}

function askedClassName(): string | null {
  const dialog = screen.queryByRole("dialog")
  return dialog?.querySelector("dd:not([class*='live'])")?.textContent ?? null
}

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ""
  vi.useFakeTimers()
  vi.setSystemTime(AFTER_EVERY_RELEASE)
  vi.spyOn(document, "hasFocus").mockReturnValue(true)
  saveProfiles({
    profiles: [
      { id: "only", name: "Only", inputs: { ...defaultInputs, classId: "bellstrikeUmbra" } },
    ],
    activeId: "only",
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("asking for breakthrough data as the active class changes", () => {
  it("asks about the class the app opens on", () => {
    render(<App />)
    expect(askedClassName()).toBe("Bellstrike Umbra")
  })

  it("asks again when the profile moves to another unconfirmed class", () => {
    render(<App />)
    dismissDialog()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    chooseClass("Silkbind Jade")

    expect(askedClassName()).toBe("Silkbind Jade")
  })

  it("gives each class its own fifteen seconds rather than carrying the hold over", () => {
    render(<App />)
    dismissDialog()

    chooseClass("Silkbind Jade")

    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled()
  })

  it("does not ask twice about a class already dismissed this session", () => {
    render(<App />)
    dismissDialog()
    chooseClass("Silkbind Jade")
    dismissDialog()

    chooseClass("Bellstrike Umbra")

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
