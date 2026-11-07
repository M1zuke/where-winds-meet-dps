import type { Inputs } from "./types"
import type { Rotation } from "./rotation"
import { builtinRotationsForClass, defaultRotationForClass } from "./builtinLibrary"

export function usesCustomRotation(inputs: Inputs): boolean {
  return !!inputs.activeCustomRotation && inputs.activeCustomRotation.classId === inputs.classId
}

export function activeRotationForInputs(inputs: Inputs): Rotation | null {
  if (usesCustomRotation(inputs)) return inputs.activeCustomRotation ?? null
  if (inputs.selectedBuiltinRotationId) {
    const selected = builtinRotationsForClass(inputs.classId).find(
      (rotation) => rotation.id === inputs.selectedBuiltinRotationId,
    )
    if (selected) return selected
  }
  return defaultRotationForClass(inputs.classId)
}
