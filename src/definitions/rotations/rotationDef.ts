import type { Rotation, RotationStep } from "../../engine/rotation"

export interface RotationDef extends Omit<Rotation, "steps"> {
  steps: Omit<RotationStep, "id">[]
}

export function defineRotation(rotation: RotationDef): RotationDef {
  return rotation
}
