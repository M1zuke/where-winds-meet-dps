import { kvStore } from "../../../../kvStore"

const KEEP_DISPLACED_KEY = "wwm.gearImportKeepDisplaced"

export const DEFAULT_KEEP_DISPLACED = false

export function loadKeepDisplaced(): boolean {
  const stored = kvStore.get(KEEP_DISPLACED_KEY)
  if (stored !== "true" && stored !== "false") return DEFAULT_KEEP_DISPLACED
  return stored === "true"
}

export function saveKeepDisplaced(keepDisplaced: boolean): void {
  kvStore.set(KEEP_DISPLACED_KEY, String(keepDisplaced))
}
