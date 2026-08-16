import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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
const { withDerivedStats } = await import("../../src/engine/derivedInputs")
const { applyArmorSet, applyBowSet } = await import("../../src/engine/panel")
const { I18nProvider } = await import("../../src/i18n/I18nProvider")
const { SimulationTab } =
  await import("../../src/ui/features/simulation/simulation-tab/SimulationTab")
const { useParseSimulation } = await import("../../src/ui/hooks/useParseSimulation")
const { simulationViewState } = await import("../../src/ui/features/simulation/simulationViewState")
const { DEFAULT_RUN_COUNT } = await import("../../src/ui/features/simulation/simulationRunSettings")

const umbra = applyBowSet(
  applyArmorSet(withDerivedStats({ ...defaultInputs, classId: "bellstrikeUmbra" })),
)

function OwnedSimulationTab() {
  const simulation = useParseSimulation()
  return (
    <SimulationTab inputs={umbra} engineInputs={umbra} expectedDps={100} simulation={simulation} />
  )
}

function renderTab() {
  render(
    <I18nProvider>
      <OwnedSimulationTab />
    </I18nProvider>,
  )
}

function lastRequest(): Record<string, unknown> {
  const posted = created.flatMap((worker) => worker.posted as Record<string, unknown>[])
  return posted.reduce((newest, post) =>
    (post.reqId as number) > (newest.reqId as number) ? post : newest,
  )
}

function respond(response: WorkerResponse): void {
  act(() => created[0].onmessage?.({ data: response }))
}

function completion(
  reqId: number,
  totals: number[],
  overrides: Partial<Extract<WorkerResponse, { kind: "parseSimulation" }>> = {},
): WorkerResponse {
  return {
    kind: "parseSimulation",
    reqId,
    runs: totals.map((totalDamage) => ({
      totalDamage,
      dps: totalDamage / 60,
      abrasionHits: 1,
      normalHits: 5,
      criticalHits: 3,
      affinityHits: 1,
    })),
    expectedRates: { abrasion: 0.1, normal: 0.5, crit: 0.3, affinity: 0.1 },
    rotationDuration: 60,
    requestedRuns: totals.length,
    completedRuns: totals.length,
    cancelled: false,
    warnings: [],
    ...overrides,
  }
}

beforeEach(() => {
  simulationViewState.optionId = null
  simulationViewState.runCount = DEFAULT_RUN_COUNT
  simulationViewState.ranSignature = null
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("SimulationTab", () => {
  it("shows placeholders in the summary strip before the first run", () => {
    renderTab()

    expect(screen.getByText("not run yet")).toBeInTheDocument()
    expect(screen.getByText("Avg DPS")).toBeInTheDocument()
    expect(screen.queryByText("Parse Ladder")).not.toBeInTheDocument()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("starts a simulation with the run count in the field", () => {
    renderTab()

    fireEvent.click(screen.getByRole("button", { name: "Run" }))

    expect(lastRequest().kind).toBe("parseSimulation")
    expect(lastRequest().runs).toBe(1000)
  })

  it("clamps a run count above the ceiling before starting", () => {
    renderTab()

    fireEvent.change(screen.getByLabelText("Runs"), { target: { value: "99999" } })
    fireEvent.click(screen.getByRole("button", { name: "Run" }))

    expect(lastRequest().runs).toBe(10000)
  })

  it("disables Run and enables Cancel while a simulation is in flight", () => {
    renderTab()

    fireEvent.click(screen.getByRole("button", { name: "Run" }))

    expect(screen.getByRole("button", { name: "Run" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("fills the progress bar as runs complete", () => {
    renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Run" }))
    const reqId = lastRequest().reqId as number

    respond({ kind: "parseSimulationProgress", reqId, done: 250, total: 1000 })

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "250")
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "250 of 1,000 runs")
  })

  it("shows the distribution once the runs land", () => {
    renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Run" }))
    const reqId = lastRequest().reqId as number

    respond(completion(reqId, [80, 100, 120]))

    expect(screen.getByText("Parse Ladder")).toBeInTheDocument()
    expect(screen.getByText("DPS Distribution")).toBeInTheDocument()
    expect(screen.getByText("Outcome Mix")).toBeInTheDocument()
    expect(screen.getByText(/^3 runs · /)).toBeInTheDocument()
    expect(screen.getAllByText("1.67").length).toBeGreaterThan(0)
    expect(screen.getByText("100 dmg")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Run" })).not.toBeDisabled()
  })

  it("keeps the last completed result after a cancel and says how many runs it covers", () => {
    renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Run" }))
    const reqId = lastRequest().reqId as number

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    respond(
      completion(reqId, [90, 110], { cancelled: true, completedRuns: 2, requestedRuns: 1000 }),
    )

    expect(screen.getByText("2 of 1,000 runs · cancelled")).toBeInTheDocument()
    expect(screen.getByText("Parse Ladder")).toBeInTheDocument()
  })

  it("warns that the result predates the current build once the rotation changes", () => {
    renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Run" }))
    respond(completion(lastRequest().reqId as number, [80, 100, 120]))

    expect(
      screen.queryByText("Your build changed since this simulation — run it again"),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("combobox", { name: "Rotation" }))
    const other = screen
      .getAllByRole("option")
      .find((option) => option.getAttribute("aria-selected") !== "true")!
    fireEvent.mouseDown(other)

    expect(
      screen.getByText("Your build changed since this simulation — run it again"),
    ).toBeInTheDocument()
  })

  it("leaves the result alone when only the run count changes", () => {
    renderTab()
    fireEvent.click(screen.getByRole("button", { name: "Run" }))
    respond(completion(lastRequest().reqId as number, [80, 100, 120]))

    fireEvent.change(screen.getByLabelText("Runs"), { target: { value: "5000" } })

    expect(
      screen.queryByText("Your build changed since this simulation — run it again"),
    ).not.toBeInTheDocument()
  })
})
