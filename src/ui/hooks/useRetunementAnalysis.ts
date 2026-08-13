import { useEffect, useRef, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { RetunementRow } from "../../engine/dpsWorker"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type RetunementReason = "ok" | "no-piece" | "no-pool" | "relayed" | "no-selection"

export interface RetunementAnalysisResult {
  rows: RetunementRow[]
  reason: RetunementReason
  isPending: boolean
  forPieceId: string | null
}

const NO_ROWS: RetunementRow[] = []

const NO_SELECTION_RESULT: RetunementAnalysisResult = {
  rows: NO_ROWS,
  reason: "no-selection",
  forPieceId: null,
  isPending: false,
}

interface ReceivedRetunement {
  rows: RetunementRow[]
  reason: RetunementReason
  pieceId: string
}

export function useRetunementAnalysis(
  inputs: Inputs,
  selectedPieceId: string | null,
): RetunementAnalysisResult {
  const reqIdRef = useRef(0)
  const [received, setReceived] = useState<ReceivedRetunement | null>(null)
  const isPending = useDpsWorkerPending("retunement")

  useEffect(() => {
    return subscribeToDpsWorker("retunement", ({ rows, reason, pieceId }) =>
      setReceived({ rows, reason, pieceId }),
    )
  }, [])

  useEffect(() => {
    if (!selectedPieceId) return
    postToDpsWorker({
      kind: "retunement",
      reqId: ++reqIdRef.current,
      inputs,
      pieceId: selectedPieceId,
    })
  }, [inputs, selectedPieceId])

  if (!selectedPieceId) return NO_SELECTION_RESULT
  return {
    rows: received?.rows ?? NO_ROWS,
    reason: received?.reason ?? "no-selection",
    isPending,
    forPieceId: received?.pieceId ?? null,
  }
}
