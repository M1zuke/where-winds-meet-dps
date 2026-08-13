import { useEffect, useRef, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { SetTilesWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export type SetTileDps = Pick<
  SetTilesWorkerResponse,
  "armorDpsByKey" | "bowDpsByChoice" | "arsenalDpsByChoice"
>

export interface SetTileDpsResult {
  data: SetTileDps | null
  isPending: boolean
}

export function useSetTileDps(inputs: Inputs): SetTileDpsResult {
  const reqIdRef = useRef(0)
  const [data, setData] = useState<SetTileDps | null>(null)
  const isPending = useDpsWorkerPending("setTiles")

  useEffect(() => {
    return subscribeToDpsWorker(
      "setTiles",
      ({ armorDpsByKey, bowDpsByChoice, arsenalDpsByChoice }) =>
        setData({ armorDpsByKey, bowDpsByChoice, arsenalDpsByChoice }),
    )
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "setTiles", reqId: ++reqIdRef.current, inputs })
  }, [inputs])

  return { data, isPending }
}
