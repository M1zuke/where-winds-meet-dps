import { useEffect, useRef, useState } from "react"
import type { GearPiece, Inputs } from "../../engine/types"
import type { WordMaxRow } from "../../engine/dpsWorker"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
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

export function useWordMaxAnalysis(inputs: Inputs, piece: GearPiece | null): WordMaxAnalysisResult {
  const reqIdRef = useRef(0)
  const [received, setReceived] = useState<{ rows: WordMaxRow[]; pieceId: string } | null>(null)
  const isPending = useDpsWorkerPending("wordMax")

  useEffect(() => {
    return subscribeToDpsWorker("wordMax", ({ rows, pieceId }) => setReceived({ rows, pieceId }))
  }, [])

  useEffect(() => {
    if (!piece) return
    postToDpsWorker({ kind: "wordMax", reqId: ++reqIdRef.current, inputs, piece })
  }, [inputs, piece])

  if (!piece) return NO_SELECTION_RESULT
  return { rows: received?.rows ?? NO_ROWS, isPending, forPieceId: received?.pieceId ?? null }
}
