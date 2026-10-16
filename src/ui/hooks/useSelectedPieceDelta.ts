import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { DpsDelta } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface SelectedPieceDeltaResult {
  delta: DpsDelta | undefined
  forPieceId: string | null
  isPending: boolean
}

interface ReceivedDelta {
  delta: DpsDelta
  pieceId: string
}

const NO_PIECE_RESULT: SelectedPieceDeltaResult = {
  delta: undefined,
  forPieceId: null,
  isPending: false,
}

function receivedDelta(
  response: { deltas: Record<string, DpsDelta> } | null,
): ReceivedDelta | null {
  if (!response) return null
  const [pieceId] = Object.keys(response.deltas)
  if (pieceId === undefined) return null
  return { delta: response.deltas[pieceId], pieceId }
}

export function useSelectedPieceDelta(
  inputs: Inputs,
  baselineDps: number,
  pieceId: string | null,
  baselineQiBreaks?: readonly { startSec: number; endSec: number }[],
): SelectedPieceDeltaResult {
  const [received, setReceived] = useState<ReceivedDelta | null>(() =>
    receivedDelta(retainedResponse("selectedPieceDelta")),
  )
  const isPending = useDpsWorkerPending("selectedPieceDelta")

  useEffect(() => {
    return subscribeToDpsWorker("selectedPieceDelta", (response) =>
      setReceived(receivedDelta(response)),
    )
  }, [])

  useEffect(() => {
    if (!pieceId) return
    postToDpsWorker({ kind: "selectedPieceDelta", inputs, baselineDps, pieceId, baselineQiBreaks })
  }, [inputs, baselineDps, pieceId, baselineQiBreaks])

  if (!pieceId) return NO_PIECE_RESULT
  return { delta: received?.delta, forPieceId: received?.pieceId ?? null, isPending }
}
