import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { MockWorker, STALE_INNER_WAY } = vi.hoisted(() => {
  class Mock {
    onmessage: ((event: { data: unknown }) => void) | null = null
    postMessage() {}
    terminate() {}
  }
  return { MockWorker: Mock, STALE_INNER_WAY: "frostCladNight" }
})

vi.mock("../../src/engine/dpsWorker?worker", () => ({ default: MockWorker }))

vi.mock("../../src/definitions/innerWays/registry", async (importOriginal) => {
  const registry = await importOriginal<typeof import("../../src/definitions/innerWays/registry")>()
  return {
    ...registry,
    innerWayDefinition: (id: string) => {
      const definition = registry.innerWayDefinition(id)
      return definition?.id === STALE_INNER_WAY
        ? { ...definition, confirmedBreakthrough: definition.confirmedBreakthrough - 1 }
        : definition
    },
  }
})

const { defaultInputs } = await import("../../src/engine/defaults")
const { saveProfiles } = await import("../../src/storage")
const { BREAKTHROUGH_RELEASES } = await import("../../src/definitions/baseStats/breakthroughs")
const { App } = await import("../../src/app/App")

const AFTER_EVERY_RELEASE = BREAKTHROUGH_RELEASES[BREAKTHROUGH_RELEASES.length - 1].at

const ASKED_CLASS = "Stonesplit Strength"
const CONFIRMED_CLASS = "Bellstrike Umbra"

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
      { id: "only", name: "Only", inputs: { ...defaultInputs, classId: "stonesplitStrength" } },
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
    expect(askedClassName()).toBe(ASKED_CLASS)
  })

  it("holds the close for fifteen seconds", () => {
    render(<App />)

    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled()
    act(() => {
      vi.advanceTimersByTime(15_000)
    })
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled()
  })

  it("asks nothing when the profile moves to a class whose inner ways are confirmed", () => {
    render(<App />)
    dismissDialog()

    chooseClass(CONFIRMED_CLASS)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("does not ask twice about a class already dismissed this session", () => {
    render(<App />)
    dismissDialog()
    chooseClass(CONFIRMED_CLASS)

    chooseClass(ASKED_CLASS)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
