import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { ReattunementOption, ReattunementWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type ReattunementReason = "ok" | "no-piece" | "no-pool" | "no-selection"

export interface ReattunementAnalysisResult {
  options: ReattunementOption[]
  probImproveOverall: number
  eDeltaDpsOverall: number | null
  pityThreshold: number | null
  reason: ReattunementReason
  isPending: boolean
  forPieceId: string | null
}

const NO_OPTIONS: ReattunementOption[] = []

const NO_SELECTION_RESULT: ReattunementAnalysisResult = {
  options: NO_OPTIONS,
  probImproveOverall: 0,
  eDeltaDpsOverall: null,
  pityThreshold: null,
  reason: "no-selection",
  forPieceId: null,
  isPending: false,
}

interface ReceivedReattunement {
  options: ReattunementOption[]
  probImproveOverall: number
  eDeltaDpsOverall: number | null
  pityThreshold: number | null
  reason: ReattunementReason
  pieceId: string
}

function receivedReattunement(
  response: ReattunementWorkerResponse | null,
): ReceivedReattunement | null {
  if (!response) return null
  const { options, reason, pieceId, probImproveOverall, eDeltaDpsOverall, pityThreshold } = response
  return { options, reason, pieceId, probImproveOverall, eDeltaDpsOverall, pityThreshold }
}

export function useReattunementAnalysis(
  inputs: Inputs,
  selectedPieceId: string | null,
): ReattunementAnalysisResult {
  const [received, setReceived] = useState<ReceivedReattunement | null>(() =>
    receivedReattunement(retainedResponse("reattunement")),
  )
  const isPending = useDpsWorkerPending("reattunement")

  useEffect(() => {
    return subscribeToDpsWorker("reattunement", (response) =>
      setReceived(receivedReattunement(response)),
    )
  }, [])

  useEffect(() => {
    if (!selectedPieceId) return
    postToDpsWorker({ kind: "reattunement", inputs, pieceId: selectedPieceId })
  }, [inputs, selectedPieceId])

  if (!selectedPieceId) return NO_SELECTION_RESULT
  return {
    options: received?.options ?? NO_OPTIONS,
    probImproveOverall: received?.probImproveOverall ?? 0,
    eDeltaDpsOverall: received?.eDeltaDpsOverall ?? null,
    pityThreshold: received?.pityThreshold ?? null,
    reason: received?.reason ?? "no-selection",
    isPending,
    forPieceId: received?.pieceId ?? null,
  }
}
