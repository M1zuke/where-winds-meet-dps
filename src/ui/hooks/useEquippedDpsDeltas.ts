import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import type { DpsDeltaMap } from "./useDpsDeltas"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface EquippedDpsDeltasResult {
  deltas: DpsDeltaMap
  isPending: boolean
}

const EMPTY_DELTAS: DpsDeltaMap = {}

export function useEquippedDpsDeltas(inputs: Inputs, baselineDps: number): EquippedDpsDeltasResult {
  const [deltas, setDeltas] = useState<DpsDeltaMap>(
    () => retainedResponse("equippedDeltas")?.deltas ?? EMPTY_DELTAS,
  )
  const isPending = useDpsWorkerPending("equippedDeltas")

  useEffect(() => {
    return subscribeToDpsWorker("equippedDeltas", ({ deltas: next }) => setDeltas(next))
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "equippedDeltas", inputs, baselineDps })
  }, [inputs, baselineDps])

  return { deltas, isPending }
}
