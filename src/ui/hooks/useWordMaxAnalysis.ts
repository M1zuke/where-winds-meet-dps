import { useEffect, useState } from "react"
import type { GearPiece, Inputs } from "../../engine/types"
import type { WordMaxRow, WordMaxWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface WordMaxAnalysisResult {
  rows: WordMaxRow[]
  isPending: boolean
  forPieceId: string | null
}

const NO_ROWS: WordMaxRow[] = []

const NO_SELECTION_RESULT: WordMaxAnalysisResult = {
  rows: NO_ROWS,
  isPending: false,
  forPieceId: null,
}

interface ReceivedWordMax {
  rows: WordMaxRow[]
  pieceId: string
}

function receivedWordMax(response: WordMaxWorkerResponse | null): ReceivedWordMax | null {
  if (!response) return null
  return { rows: response.rows, pieceId: response.pieceId }
}

export function useWordMaxAnalysis(inputs: Inputs, piece: GearPiece | null): WordMaxAnalysisResult {
  const [received, setReceived] = useState<ReceivedWordMax | null>(() =>
    receivedWordMax(retainedResponse("wordMax")),
  )
  const isPending = useDpsWorkerPending("wordMax")

  useEffect(() => {
    return subscribeToDpsWorker("wordMax", (response) => setReceived(receivedWordMax(response)))
  }, [])

  useEffect(() => {
    if (!piece) return
    postToDpsWorker({ kind: "wordMax", inputs, piece })
  }, [inputs, piece])

  if (!piece) return NO_SELECTION_RESULT
  return { rows: received?.rows ?? NO_ROWS, isPending, forPieceId: received?.pieceId ?? null }
}
