import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { SetTilesWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type SetTileDps = Pick<
  SetTilesWorkerResponse,
  "armorDpsByKey" | "bowDpsByChoice" | "arsenalDpsByChoice"
>

export interface SetTileDpsResult {
  data: SetTileDps | null
  isPending: boolean
}

function setTileDps(response: SetTilesWorkerResponse | null): SetTileDps | null {
  if (!response) return null
  const { armorDpsByKey, bowDpsByChoice, arsenalDpsByChoice } = response
  return { armorDpsByKey, bowDpsByChoice, arsenalDpsByChoice }
}

export function useSetTileDps(inputs: Inputs): SetTileDpsResult {
  const [data, setData] = useState<SetTileDps | null>(() =>
    setTileDps(retainedResponse("setTiles")),
  )
  const isPending = useDpsWorkerPending("setTiles")

  useEffect(() => {
    return subscribeToDpsWorker("setTiles", (response) => setData(setTileDps(response)))
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "setTiles", inputs })
  }, [inputs])

  return { data, isPending }
}
