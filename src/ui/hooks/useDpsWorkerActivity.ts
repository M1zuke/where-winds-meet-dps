import { useSyncExternalStore } from "react"
import {
  dpsWorkerActivity,
  subscribeToDpsWorkerActivity,
  type DpsWorkerActivity,
} from "./dpsWorkerClient"

export function useDpsWorkerActivity(): DpsWorkerActivity {
  return useSyncExternalStore(subscribeToDpsWorkerActivity, dpsWorkerActivity)
}
