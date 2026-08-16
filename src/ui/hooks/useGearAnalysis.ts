import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { GearSlotAnalysisRow } from "../../engine/gearAnalysis"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface GearAnalysisResult {
  rows: GearSlotAnalysisRow[]
  isPending: boolean
}

const NO_ROWS: GearSlotAnalysisRow[] = []

export function useGearAnalysis(engineInputs: Inputs, baselineDps: number): GearAnalysisResult {
  const [received, setReceived] = useState<GearSlotAnalysisRow[] | null>(null)
  const isPending = useDpsWorkerPending("gearAnalysis")

  useEffect(() => {
    return subscribeToDpsWorker("gearAnalysis", ({ rows }) => setReceived(rows))
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "gearAnalysis", inputs: engineInputs, baselineDps })
  }, [engineInputs, baselineDps])

  return { rows: received ?? NO_ROWS, isPending }
}
