import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { DpsActivityToast } from "../../src/ui/layout/dps-activity-toast/DpsActivityToast"
import type { DpsWorkerActivity } from "../../src/ui/hooks/dpsWorkerClient"

const activity = vi.hoisted(() => ({
  current: { kinds: [], done: 0, total: 0 } as DpsWorkerActivity,
}))

vi.mock("../../src/ui/hooks/useDpsWorkerActivity", () => ({
  useDpsWorkerActivity: () => activity.current,
}))

function renderToast(next: DpsWorkerActivity, hidden = false) {
  activity.current = next
  return render(
    <I18nProvider>
      <DpsActivityToast hidden={hidden} />
    </I18nProvider>,
  )
}

afterEach(() => {
  activity.current = { kinds: [], done: 0, total: 0 }
})

describe("DpsActivityToast", () => {
  it("stays out of the way when no sweep is running", () => {
    renderToast({ kinds: [], done: 0, total: 0 })

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("counts the sweeps still owed, not the ones already answered", () => {
    renderToast({ kinds: ["dpsDeltas", "gearAnalysis"], done: 4, total: 6 })

    expect(screen.getByRole("status")).toHaveTextContent("2 left")
  })

  it("names every sweep still running", () => {
    renderToast({ kinds: ["equippedDeltas", "wordMax"], done: 0, total: 2 })

    expect(screen.getByRole("status")).toHaveTextContent("Equipped slots, Word maxing")
  })

  it("reports progress against the whole batch", () => {
    renderToast({ kinds: ["ranking"], done: 3, total: 4 })

    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "3")
    expect(bar).toHaveAttribute("aria-valuemax", "4")
  })

  it("yields to the simulation toast while a run is in flight", () => {
    renderToast({ kinds: ["ranking"], done: 0, total: 1 }, true)

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
