import { useCallback, useEffect, useState } from "react"
import type { ExpectedOutcomeRates, ParseRun } from "../../engine/dpsWorker"
import type { Inputs } from "../../engine/types"
import type { Rotation } from "../../engine/rotation"
import {
  cancelDpsWorkerRequest,
  postToDpsWorker,
  subscribeToDpsWorker,
  subscribeToDpsWorkerProgress,
} from "./dpsWorkerClient"

export type SimulationStatus = "idle" | "running" | "done" | "cancelled"

export interface ParseSimulationRequest {
  inputs: Inputs
  rotation: Rotation | null
  runCount: number
}

interface Completed {
  runs: ParseRun[]
  expectedRates: ExpectedOutcomeRates | null
  rotationDuration: number
  requestedRuns: number
  completedRuns: number
  cancelled: boolean
}

export interface ParseSimulationState extends Completed {
  progress: { done: number; total: number }
  status: SimulationStatus
  start(request: ParseSimulationRequest): void
  cancel(): void
}

const NO_RUNS: ParseRun[] = []
const NO_PROGRESS = { done: 0, total: 0 }
const NOT_RUN: Completed = {
  runs: NO_RUNS,
  expectedRates: null,
  rotationDuration: 0,
  requestedRuns: 0,
  completedRuns: 0,
  cancelled: false,
}

export function useParseSimulation(): ParseSimulationState {
  const [completed, setCompleted] = useState<Completed | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const stopResults = subscribeToDpsWorker("parseSimulation", (response) => {
      setIsRunning(false)
      setProgress({ done: response.completedRuns, total: response.requestedRuns })
      setCompleted({
        runs: response.runs,
        expectedRates: response.expectedRates,
        rotationDuration: response.rotationDuration,
        requestedRuns: response.requestedRuns,
        completedRuns: response.completedRuns,
        cancelled: response.cancelled,
      })
    })
    const stopProgress = subscribeToDpsWorkerProgress("parseSimulation", ({ done, total }) =>
      setProgress({ done, total }),
    )
    return () => {
      stopResults()
      stopProgress()
    }
  }, [])

  const start = useCallback(({ inputs, rotation, runCount }: ParseSimulationRequest) => {
    setIsRunning(true)
    setProgress({ done: 0, total: runCount })
    postToDpsWorker({
      kind: "parseSimulation",
      inputs,
      rotation,
      runs: runCount,
      seed: (Date.now() * 2654435761) | 0,
    })
  }, [])

  const cancel = useCallback(() => cancelDpsWorkerRequest("parseSimulation"), [])

  const status: SimulationStatus = isRunning
    ? "running"
    : completed === null
      ? "idle"
      : completed.cancelled
        ? "cancelled"
        : "done"

  return { ...(completed ?? NOT_RUN), progress: progress ?? NO_PROGRESS, status, start, cancel }
}
