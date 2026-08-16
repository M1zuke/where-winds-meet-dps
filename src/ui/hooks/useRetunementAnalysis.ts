import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { RetunementRow, RetunementWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
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

function receivedRetunement(response: RetunementWorkerResponse | null): ReceivedRetunement | null {
  if (!response) return null
  return { rows: response.rows, reason: response.reason, pieceId: response.pieceId }
}

export function useRetunementAnalysis(
  inputs: Inputs,
  selectedPieceId: string | null,
): RetunementAnalysisResult {
  const [received, setReceived] = useState<ReceivedRetunement | null>(() =>
    receivedRetunement(retainedResponse("retunement")),
  )
  const isPending = useDpsWorkerPending("retunement")

  useEffect(() => {
    return subscribeToDpsWorker("retunement", (response) =>
      setReceived(receivedRetunement(response)),
    )
  }, [])

  useEffect(() => {
    if (!selectedPieceId) return
    postToDpsWorker({ kind: "retunement", inputs, pieceId: selectedPieceId })
  }, [inputs, selectedPieceId])

  if (!selectedPieceId) return NO_SELECTION_RESULT
  return {
    rows: received?.rows ?? NO_ROWS,
    reason: received?.reason ?? "no-selection",
    isPending,
    forPieceId: received?.pieceId ?? null,
  }
}
