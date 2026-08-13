import { useCallback, useSyncExternalStore } from "react"
import type { WorkerRequest } from "../../engine/dpsWorker"
import { isDpsWorkerPending, subscribeToDpsWorkerPending } from "./dpsWorkerClient"

export function useDpsWorkerPending(kind: WorkerRequest["kind"]): boolean {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToDpsWorkerPending(kind, listener),
    [kind],
  )
  const getSnapshot = useCallback(() => isDpsWorkerPending(kind), [kind])
  return useSyncExternalStore(subscribe, getSnapshot)
}
