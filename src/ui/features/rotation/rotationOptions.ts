import type { Inputs } from "../../../engine/types"
import type { Rotation } from "../../../engine/rotation"
import { builtinRotationsForClass, defaultRotationForClass } from "../../../engine/builtinLibrary"

export const NO_ROTATION_OPTION_ID = ""

export type RotationOptionGroup = "builtin" | "custom"

export interface RotationOption {
  id: string
  name: string
  description?: string
  group: RotationOptionGroup
  isClassDefault: boolean
  rotation: Rotation
}

export function rotationOptions(classId: string, savedRotations: Rotation[]): RotationOption[] {
  const classDefault = defaultRotationForClass(classId)
  const builtins = builtinRotationsForClass(classId).map<RotationOption>((rotation) => ({
    id: rotation.id,
    name: rotation.name,
    description: rotation.description,
    group: "builtin",
    isClassDefault: rotation.id === classDefault?.id,
    rotation,
  }))
  const customs = savedRotations
    .filter((rotation) => rotation.classId === classId)
    .map<RotationOption>((rotation) => ({
      id: rotation.id,
      name: rotation.name,
      description: rotation.description,
      group: "custom",
      isClassDefault: false,
      rotation,
    }))
  return [...builtins, ...customs]
}

export function usesCustomRotation(inputs: Inputs): boolean {
  return !!inputs.activeCustomRotation && inputs.activeCustomRotation.classId === inputs.classId
}

export function selectedRotationOptionId(inputs: Inputs): string {
  if (usesCustomRotation(inputs)) return inputs.activeCustomRotation!.id
  if (inputs.selectedBuiltinRotationId) return inputs.selectedBuiltinRotationId
  return defaultRotationForClass(inputs.classId)?.id ?? NO_ROTATION_OPTION_ID
}

export function activeRotationName(inputs: Inputs): string | null {
  if (usesCustomRotation(inputs)) return inputs.activeCustomRotation!.name
  const selectedBuiltin = builtinRotationsForClass(inputs.classId).find(
    (rotation) => rotation.id === inputs.selectedBuiltinRotationId,
  )
  if (selectedBuiltin) return selectedBuiltin.name
  return defaultRotationForClass(inputs.classId)?.name ?? null
}

export function inputsWithRotationOption(inputs: Inputs, option: RotationOption): Inputs {
  if (option.group === "builtin") {
    return { ...inputs, activeCustomRotation: null, selectedBuiltinRotationId: option.id }
  }
  return {
    ...inputs,
    activeCustomRotation: option.rotation,
    selectedBuiltinRotationId: null,
  }
}
