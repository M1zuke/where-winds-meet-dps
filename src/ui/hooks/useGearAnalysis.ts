import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { GearSlotAnalysisRow } from "../../engine/gearAnalysis"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface GearAnalysisResult {
  rows: GearSlotAnalysisRow[]
  allSlotsLoss: number | null
  isPending: boolean
}

interface ReceivedAnalysis {
  rows: GearSlotAnalysisRow[]
  allSlotsLoss: number | null
}

const NO_ROWS: GearSlotAnalysisRow[] = []

export function useGearAnalysis(
  engineInputs: Inputs,
  baselineDps: number,
  baselineQiBreaks?: readonly { startSec: number; endSec: number }[],
): GearAnalysisResult {
  const [received, setReceived] = useState<ReceivedAnalysis | null>(
    () => retainedResponse("gearAnalysis") ?? null,
  )
  const isPending = useDpsWorkerPending("gearAnalysis")

  useEffect(() => {
    return subscribeToDpsWorker("gearAnalysis", ({ rows, allSlotsLoss }) =>
      setReceived({ rows, allSlotsLoss }),
    )
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "gearAnalysis", inputs: engineInputs, baselineDps, baselineQiBreaks })
  }, [engineInputs, baselineDps, baselineQiBreaks])

  return {
    rows: received?.rows ?? NO_ROWS,
    allSlotsLoss: received?.allSlotsLoss ?? null,
    isPending,
  }
}
