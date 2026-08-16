import { DEFAULT_RUN_COUNT } from "./simulationRunSettings"

export const simulationViewState: {
  optionId: string | null
  runCount: number
  ranSignature: string | null
} = {
  optionId: null,
  runCount: DEFAULT_RUN_COUNT,
  ranSignature: null,
}
