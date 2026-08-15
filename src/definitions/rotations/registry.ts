import type { Rotation, RotationStep } from "../../engine/rotation"
import rotationsData from "../../data/rotations/defaultRotations.json"

interface RotationFileEntry extends Omit<Rotation, "steps"> {
  steps: Omit<RotationStep, "id">[]
}

interface RotationPoolFile {
  rotations: RotationFileEntry[]
  defaultRotationId?: string
}

const ROTATION_POOLS = rotationsData as unknown as Record<string, RotationPoolFile>

export interface RotationPool {
  rotations: readonly Rotation[]
  defaultRotationId: string | null
}

function withStepIds(rotation: RotationFileEntry): Rotation {
  return {
    ...rotation,
    steps: rotation.steps.map((step, index) => ({ ...step, id: `${rotation.id}-${index}` })),
  }
}

export function rotationPoolFor(classId: string): RotationPool {
  const pool = ROTATION_POOLS[classId]
  return {
    rotations: pool?.rotations.map(withStepIds) ?? [],
    defaultRotationId: pool?.defaultRotationId ?? null,
  }
}
