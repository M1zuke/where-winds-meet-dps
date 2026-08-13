import { useEffect, useRef, useState } from "react"
import type { Inputs, ItemRankingRow } from "../../engine/types"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface ItemRankingResult {
  rows: ItemRankingRow[]
  isPending: boolean
}

export function useItemRanking(engineInputs: Inputs, baselineDps: number): ItemRankingResult {
  const reqIdRef = useRef(0)
  const [rows, setRows] = useState<ItemRankingRow[]>([])
  const isPending = useDpsWorkerPending("ranking")

  useEffect(() => {
    return subscribeToDpsWorker("ranking", ({ rows: next }) => setRows(next))
  }, [])

  useEffect(() => {
    postToDpsWorker({
      kind: "ranking",
      reqId: ++reqIdRef.current,
      inputs: engineInputs,
      baselineDps,
    })
  }, [engineInputs, baselineDps])

  return { rows, isPending }
}
