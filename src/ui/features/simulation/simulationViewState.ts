import { DEFAULT_RUN_COUNT } from "./simulationRunSettings"
import type { RunSortColumn } from "./simulation-runs-panel/runsPaging"

export const simulationViewState: {
  optionId: string | null
  runCount: number
  ranSignature: string | null
  selectedRunIndex: number | null
  page: number
  sortColumn: RunSortColumn
  sortDescending: boolean
} = {
  optionId: null,
  runCount: DEFAULT_RUN_COUNT,
  ranSignature: null,
  selectedRunIndex: null,
  page: 1,
  sortColumn: "dps",
  sortDescending: true,
}

export function rememberSelectedRun(runIndex: number | null): void {
  simulationViewState.selectedRunIndex = runIndex
}

export function rememberRunsPage(page: number): void {
  simulationViewState.page = page
}

export function rememberRunsSort(column: RunSortColumn, descending: boolean): void {
  simulationViewState.sortColumn = column
  simulationViewState.sortDescending = descending
}
