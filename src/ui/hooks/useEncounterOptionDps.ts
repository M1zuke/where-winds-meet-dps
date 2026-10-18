import { useEffect, useMemo, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { EncounterOptionsWorkerResponse } from "../../engine/dpsWorker"
import type { EncounterCategory } from "../../engine/encounterOptions"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"
import { requestSignature } from "./workerResultCache"

export interface EncounterOptionDpsResult {
  data: Pick<EncounterOptionsWorkerResponse, "baselineDps" | "dpsByOption"> | null
  isPending: boolean
}

const NO_CATEGORY_RESULT: EncounterOptionDpsResult = { data: null, isPending: false }

function signatureOf(inputs: Inputs, category: EncounterCategory): string | null {
  return requestSignature({ kind: "encounterOptions", reqId: 0, inputs, category })
}

export function useEncounterOptionDps(
  engineInputs: Inputs,
  category: EncounterCategory | null,
): EncounterOptionDpsResult {
  const [received, setReceived] = useState<EncounterOptionsWorkerResponse | null>(() =>
    retainedResponse("encounterOptions"),
  )
  const isWorkerPending = useDpsWorkerPending("encounterOptions")
  const wantedSignature = useMemo(
    () => (category === null ? null : signatureOf(engineInputs, category)),
    [engineInputs, category],
  )
  const receivedSignature = useMemo(
    () => (received === null ? null : signatureOf(received.inputs, received.category)),
    [received],
  )

  useEffect(() => {
    return subscribeToDpsWorker("encounterOptions", setReceived)
  }, [])

  useEffect(() => {
    if (category === null) return
    postToDpsWorker({ kind: "encounterOptions", inputs: engineInputs, category })
  }, [engineInputs, category])

  if (category === null) return NO_CATEGORY_RESULT
  if (received === null || receivedSignature !== wantedSignature) {
    return { data: null, isPending: true }
  }
  return { data: received, isPending: isWorkerPending }
}
