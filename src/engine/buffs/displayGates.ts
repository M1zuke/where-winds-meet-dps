// Whether the Skill Editor shows a def as active for this build, when the buff
// params cannot express it. The mechanic that implements the def is the one
// place that knows, so it registers the gate rather than the card mirroring its
// checks — mirroring is how the card and the engine drifted apart before.
import type { Inputs } from "../types"

export interface DisplayGateRegistration {
  defId: string
  predicate: (inputs: Inputs) => boolean
}

const gates: Record<string, (inputs: Inputs) => boolean> = {
  vulnerabilityTeammate: (inputs) => !!inputs.shareEasyHurt,
}

export function registerDisplayGate(defId: string, gate: (inputs: Inputs) => boolean): void {
  gates[defId] = gate
}

export function displayGateFor(defId: string): ((inputs: Inputs) => boolean) | undefined {
  return gates[defId]
}
