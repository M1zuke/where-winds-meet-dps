import { useEffect, useRef, useState } from "react"
import type { Inputs } from "../../engine/types"
import { postToDpsWorker, subscribeToDpsWorker } from "./dpsWorkerClient"
import { useDpsWorkerPending } from "./useDpsWorkerPending"

export interface GraduationRateData {
  rate: number | null
  theoreticalDps: number | null
  relayedTheoreticalDps: number | null
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
  const reqIdRef = useRef(0)
  const [data, setData] = useState<GraduationRateData | null>(null)
  const isPending = useDpsWorkerPending("graduation")

  useEffect(() => {
    return subscribeToDpsWorker(
      "graduation",
      ({ graduationRate, theoreticalDps, relayedTheoreticalDps }) =>
        setData({ rate: graduationRate, theoreticalDps, relayedTheoreticalDps }),
    )
  }, [])

  useEffect(() => {
    postToDpsWorker({ kind: "graduation", reqId: ++reqIdRef.current, inputs, currentDps })
  }, [inputs, currentDps])

  return { ...(data ?? EMPTY_DATA), isPending }
}
