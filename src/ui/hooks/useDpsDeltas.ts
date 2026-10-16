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
const PIECE_ID_SEPARATOR = "\n"

export function useDpsDeltas(
  inputs: Inputs,
  baselineDps: number,
  pieceIds: readonly string[],
  baselineQiBreaks?: readonly { startSec: number; endSec: number }[],
): DpsDeltasResult {
  const [deltas, setDeltas] = useState<DpsDeltaMap>(
    () => retainedResponse("dpsDeltas")?.deltas ?? EMPTY_DELTAS,
  )
  const isPending = useDpsWorkerPending("dpsDeltas")

  const hasCandidates = pieceIds.length > 0
  const pieceIdsKey = pieceIds.join(PIECE_ID_SEPARATOR)

  useEffect(() => {
    return subscribeToDpsWorker("dpsDeltas", ({ deltas: next }) => setDeltas(next))
  }, [])

  useEffect(() => {
    if (!hasCandidates) return
    postToDpsWorker({
      kind: "dpsDeltas",
      inputs,
      baselineDps,
      pieceIds: pieceIdsKey.split(PIECE_ID_SEPARATOR),
      baselineQiBreaks,
    })
  }, [inputs, baselineDps, pieceIdsKey, hasCandidates, baselineQiBreaks])

  if (!hasCandidates) return { deltas: EMPTY_DELTAS, isPending: false }
  return { deltas, isPending }
}
