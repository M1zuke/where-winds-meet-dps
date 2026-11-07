import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { ArsenalTilesWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type ArsenalTileDps = Pick<ArsenalTilesWorkerResponse, "arsenalDpsByChoice">

export interface ArsenalTileDpsResult {
  data: ArsenalTileDps | null
  isPending: boolean
}

function arsenalTileDps(response: ArsenalTilesWorkerResponse | null): ArsenalTileDps | null {
  if (!response) return null
  const { arsenalDpsByChoice } = response
  return { arsenalDpsByChoice }
}

export function useArsenalTileDps(inputs: Inputs): ArsenalTileDpsResult {
  const [data, setData] = useState<ArsenalTileDps | null>(() =>
    arsenalTileDps(retainedResponse("arsenalTiles")),
  )
  const isPending = useDpsWorkerPending("arsenalTiles")

  useEffect(() => {
    return subscribeToDpsWorker("arsenalTiles", (response) => setData(arsenalTileDps(response)))
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "arsenalTiles", inputs })
  }, [inputs])

  return { data, isPending }
}
