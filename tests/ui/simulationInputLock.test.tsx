import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { WorkerResponse } from "../../src/engine/dpsWorker"

const { created, MockWorker } = vi.hoisted(() => {
  const instances: {
    posted: unknown[]
    onmessage: ((event: { data: unknown }) => void) | null
  }[] = []
  class Mock {
    posted: unknown[] = []
    onmessage: ((event: { data: unknown }) => void) | null = null
    constructor() {
      instances.push(this)
    }
    postMessage(request: unknown) {
      this.posted.push(request)
    }
    terminate() {}
  }
  return { created: instances, MockWorker: Mock }
})

vi.mock("../../src/engine/dpsWorker?worker", () => ({ default: MockWorker }))

const { defaultInputs } = await import("../../src/engine/defaults")
const { saveProfiles } = await import("../../src/storage")
const { App } = await import("../../src/app/App")

function newestParseSimulationReqId(): number {
  let newest = -1
  for (const worker of created) {
    for (const post of worker.posted) {
      const request = post as { kind: string; reqId: number }
      if (request.kind === "parseSimulation") newest = Math.max(newest, request.reqId)
    }
  }
  if (newest < 0) throw new Error("no parse simulation was posted")
  return newest
}

function completion(reqId: number): WorkerResponse {
  return {
    kind: "parseSimulation",
    reqId,
    runs: [
      {
        totalDamage: 100,
        dps: 1.5,
        abrasionHits: 0,
        normalHits: 1,
        criticalHits: 0,
        affinityHits: 0,
      },
    ],
    expectedRates: null,
    rotationDuration: 60,
    requestedRuns: 1000,
    completedRuns: 1000,
    cancelled: false,
    warnings: [],
  }
}

function deliver(response: WorkerResponse): void {
  act(() => {
    for (const worker of created) worker.onmessage?.({ data: response })
  })
}

function startRunThenLeaveSimulationTab() {
  fireEvent.click(screen.getByRole("tab", { name: "Simulation" }))
  fireEvent.click(screen.getByRole("button", { name: "Run" }))
  fireEvent.click(screen.getByRole("tab", { name: "Overview" }))
}

function anyRouteControl(): HTMLElement {
  const control = document.querySelector("fieldset input, fieldset button")
  if (!control) throw new Error("the tab panel rendered no control to check")
  return control as HTMLElement
}

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ""
  saveProfiles({
    profiles: [{ id: "locked", name: "Locked", inputs: defaultInputs }],
    activeId: "locked",
  })
})

describe("input lock while a simulation runs", () => {
  it("disables the controls of the tab the user moved to", () => {
    render(<App />)

    startRunThenLeaveSimulationTab()

    expect(anyRouteControl()).toBeDisabled()
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeDisabled()
  })

  it("gives the controls back once the runs land", () => {
    render(<App />)
    startRunThenLeaveSimulationTab()

    deliver(completion(newestParseSimulationReqId()))

    expect(anyRouteControl()).not.toBeDisabled()
  })

  it("leaves the simulation tab usable so the run can still be cancelled", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("tab", { name: "Simulation" }))

    fireEvent.click(screen.getByRole("button", { name: "Run" }))

    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled()
  })
})
