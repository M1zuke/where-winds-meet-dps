import { useEffect, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { GraduationWorkerResponse } from "../../engine/dpsWorker"
import { postToDpsWorker, retainedResponse, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface GraduationRateData {
  rate: number | null
  theoreticalDps: number | null
  relayedTheoreticalDps: number | null
}

function graduationData(response: GraduationWorkerResponse | null): GraduationRateData | null {
  if (!response) return null
  return {
    rate: response.graduationRate,
    theoreticalDps: response.theoreticalDps,
    relayedTheoreticalDps: response.relayedTheoreticalDps,
  }
}

const EMPTY_DATA: GraduationRateData = {
  rate: null,
  theoreticalDps: null,
  relayedTheoreticalDps: null,
}

export function useGraduationRate(
  inputs: Inputs,
  currentDps: number,
): GraduationRateData & { isPending: boolean } {
  const [data, setData] = useState<GraduationRateData | null>(() =>
    graduationData(retainedResponse("graduation")),
  )
  const isPending = useDpsWorkerPending("graduation")

  useEffect(() => {
    return subscribeToDpsWorker("graduation", (response) => setData(graduationData(response)))
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "graduation", inputs, currentDps })
  }, [inputs, currentDps])

  return { ...(data ?? EMPTY_DATA), isPending }
}
