import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { SimulationToast } from "../../src/ui/layout/simulation-toast/SimulationToast"
import type { SimulationStatus } from "../../src/ui/hooks/useParseSimulation"

function renderToast(
  overrides: {
    status?: SimulationStatus
    done?: number
    total?: number
    hasUnacknowledgedRun?: boolean
    onCancel?: () => void
    onAcknowledge?: () => void
    startAt?: string
  } = {},
) {
  const {
    status = "running",
    done = 250,
    total = 1000,
    hasUnacknowledgedRun = true,
    onCancel = () => {},
    onAcknowledge = () => {},
    startAt = "/gear",
  } = overrides

  render(
    <MemoryRouter initialEntries={[startAt]}>
      <I18nProvider>
        <SimulationToast
          status={status}
          done={done}
          total={total}
          hasUnacknowledgedRun={hasUnacknowledgedRun}
          onCancel={onCancel}
          onAcknowledge={onAcknowledge}
        />
        <Routes>
          <Route path="/gear" element={<p>gear tab</p>} />
          <Route path="/simulation" element={<p>simulation tab</p>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe("SimulationToast", () => {
  it("counts the runs of a simulation left behind on another tab", () => {
    renderToast()

    expect(screen.getByText("250 / 1,000 runs")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "250")
  })

  it("stays out of the way on the simulation tab, which shows its own progress", () => {
    renderToast({ startAt: "/simulation" })

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("cancels the run and asks for nothing further", () => {
    const onCancel = vi.fn()
    const onAcknowledge = vi.fn()
    renderToast({ onCancel, onAcknowledge })

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onAcknowledge).toHaveBeenCalledOnce()
  })

  it("offers the finished results and routes to them", () => {
    renderToast({ status: "done", done: 1000 })

    fireEvent.click(screen.getByRole("button", { name: "Checkout results" }))

    expect(screen.getByText("simulation tab")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Checkout results" })).not.toBeInTheDocument()
  })

  it("says nothing about a result the user has already seen", () => {
    renderToast({ status: "done", hasUnacknowledgedRun: false })

    expect(screen.queryByRole("button", { name: "Checkout results" })).not.toBeInTheDocument()
  })

  it("marks a finished run seen when the user reaches the tab on their own", () => {
    const onAcknowledge = vi.fn()
    renderToast({ status: "done", startAt: "/simulation", onAcknowledge })

    expect(onAcknowledge).toHaveBeenCalled()
  })
})
