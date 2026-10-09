import { useEffect, useState } from "react"
import type { Inputs, ItemRankingRow } from "../../engine/types"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface ItemRankingResult {
  rows: ItemRankingRow[]
  isPending: boolean
}

const NO_ROWS: ItemRankingRow[] = []

export function useItemRanking(
  engineInputs: Inputs,
  baselineDps: number,
  baselineQiBreaks?: readonly { startSec: number; endSec: number }[],
): ItemRankingResult {
  const [rows, setRows] = useState<ItemRankingRow[]>(
    () => retainedResponse("ranking")?.rows ?? NO_ROWS,
  )
  const isPending = useDpsWorkerPending("ranking")

  useEffect(() => {
    return subscribeToDpsWorker("ranking", ({ rows: next }) => setRows(next))
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "ranking", inputs: engineInputs, baselineDps, baselineQiBreaks })
  }, [engineInputs, baselineDps, baselineQiBreaks])

  return { rows, isPending }
}
