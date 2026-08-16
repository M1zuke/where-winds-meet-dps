import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { DpsDelta } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type DpsDeltaMap = Record<string, DpsDelta | undefined>

export interface DpsDeltasResult {
  deltas: DpsDeltaMap
  isPending: boolean
}

const EMPTY_DELTAS: DpsDeltaMap = {}

export function useDpsDeltas(inputs: Inputs, baselineDps: number): DpsDeltasResult {
  const [deltas, setDeltas] = useState<DpsDeltaMap>(
    () => retainedResponse("dpsDeltas")?.deltas ?? EMPTY_DELTAS,
  )
  const isPending = useDpsWorkerPending("dpsDeltas")

  const hasCandidates = inputs.inventory.length > 0

  useEffect(() => {
    return subscribeToDpsWorker("dpsDeltas", ({ deltas: next }) => setDeltas(next))
  }, [])

  useEffect(() => {
    if (!hasCandidates) return
    postToDpsWorker({
      kind: "dpsDeltas",
      inputs,
      baselineDps,
      pieceIds: inputs.inventory.map((piece) => piece.id),
    })
  }, [inputs, baselineDps, hasCandidates])

  if (!hasCandidates) return { deltas: EMPTY_DELTAS, isPending: false }
  return { deltas, isPending }
}
