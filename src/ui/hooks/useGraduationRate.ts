import { useEffect, useRef, useState } from "react"
import type { Inputs } from "../../engine/types"
import type { WorkerRequest, WorkerResponse } from "../../engine/dpsWorker"
import DpsWorker from "../../engine/dpsWorker?worker"
import { WORKER_DEBOUNCE_MS } from "./workerDebounce"

export interface GraduationRateData {
  rate: number | null
  theoreticalDps: number | null
}

const EMPTY_DATA: GraduationRateData = { rate: null, theoreticalDps: null }

export function useGraduationRate(
  inputs: Inputs,
  currentDps: number,
): GraduationRateData & { isPending: boolean } {
  const workerRef = useRef<Worker | null>(null)
  const reqIdRef = useRef(0)
  const lastReceivedRef = useRef(-1)
  const [data, setData] = useState<GraduationRateData | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const worker = new DpsWorker()
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.kind !== "graduation") return
      const { reqId, graduationRate, theoreticalDps } = event.data
      if (reqId < lastReceivedRef.current) return
      lastReceivedRef.current = reqId
      setData({ rate: graduationRate, theoreticalDps })
      if (reqId === reqIdRef.current) setIsPending(false)
    }
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return
    const reqId = ++reqIdRef.current
    setIsPending(true)
    const handle = setTimeout(() => {
      const request: WorkerRequest = {
        kind: "graduation",
        reqId,
        inputs,
        currentDps,
      }
      worker.postMessage(request)
    }, WORKER_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [inputs, currentDps])

  return { ...(data ?? EMPTY_DATA), isPending }
}
