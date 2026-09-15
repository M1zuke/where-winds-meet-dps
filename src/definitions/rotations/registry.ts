import type { Rotation } from "../../engine/rotation"
import { ROTATIONS } from "../../data/rotations"
import type { RotationDef } from "./rotationDef"

function withStepIds(rotation: RotationDef): Rotation {
  return {
    ...rotation,
    steps: rotation.steps.map((step, index) => ({ ...step, id: `${rotation.id}-${index}` })),
  }
}

export function rotationsFor(classId: string): Rotation[] {
  return ROTATIONS.filter((rotation) => rotation.classId === classId).map(withStepIds)
}
