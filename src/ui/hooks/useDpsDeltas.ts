import { useEffect, useState } from "react"
import type { GearPiece, Inputs } from "../../engine/types"
import type { DpsDelta } from "../../engine/dpsWorker"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type DpsDeltaMap = Record<string, DpsDelta | undefined>

export interface DpsDeltasResult {
  deltas: DpsDeltaMap
  isPending: boolean
}

const NO_EXTRAS: readonly GearPiece[] = []

const EMPTY_DELTAS: DpsDeltaMap = {}

export function useDpsDeltas(
  inputs: Inputs,
  baselineDps: number,
  extraCandidates: readonly GearPiece[] = NO_EXTRAS,
): DpsDeltasResult {
  const [deltas, setDeltas] = useState<DpsDeltaMap>({})
  const isPending = useDpsWorkerPending("dpsDeltas")

  useEffect(() => {
    return subscribeToDpsWorker("dpsDeltas", ({ deltas: next }) => setDeltas(next))
  }, [])

  const hasCandidates = inputs.inventory.length > 0 || extraCandidates.length > 0

  useEffect(() => {
    if (!hasCandidates) return
    postToDpsWorker({
      kind: "dpsDeltas",
      inputs,
      baselineDps,
      pieceIds: [...inputs.inventory.map((p) => p.id), ...extraCandidates.map((p) => p.id)],
      extraCandidates: extraCandidates.length > 0 ? [...extraCandidates] : undefined,
    })
  }, [inputs, baselineDps, extraCandidates, hasCandidates])

  if (!hasCandidates) return { deltas: EMPTY_DELTAS, isPending: false }
  return { deltas, isPending }
}
