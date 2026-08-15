import type { Rotation, RotationStep } from "../../engine/rotation"
import defaultRotationsData from "../../data/rotations/defaultRotations.json"
import handRotationsData from "../../data/rotations/handRotations.json"

interface RotationFileEntry extends Omit<Rotation, "steps"> {
  steps: Omit<RotationStep, "id">[]
}

interface RotationPoolFile {
  rotations: RotationFileEntry[]
  defaultRotationId?: string
}

function withStepIds(rotation: RotationFileEntry): Rotation {
  return {
    ...rotation,
    steps: rotation.steps.map((step, index) => ({ ...step, id: `${rotation.id}-${index}` })),
  }
}

function pools(data: unknown): Record<string, { rotations: Rotation[]; defaultRotationId?: string }> {
  const files = data as Record<string, RotationPoolFile>
  return Object.fromEntries(
    Object.entries(files).map(([classId, file]) => [
      classId,
      { ...file, rotations: file.rotations.map(withStepIds) },
    ]),
  )
}

const DEFAULT_ROTATIONS = pools(defaultRotationsData)
const HAND_ROTATIONS = pools(handRotationsData)

export interface RotationPool {
  rotations: readonly Rotation[]
  defaultRotationId: string | null
}

// The default pool, then the hand-authored pool appended after it; a hand
// rotation's own `defaultRotationId` wins over the default pool's.
export function rotationPoolFor(classId: string): RotationPool {
  return {
    rotations: [
      ...(DEFAULT_ROTATIONS[classId]?.rotations ?? []),
      ...(HAND_ROTATIONS[classId]?.rotations ?? []),
    ],
    defaultRotationId:
      HAND_ROTATIONS[classId]?.defaultRotationId ??
      DEFAULT_ROTATIONS[classId]?.defaultRotationId ??
      null,
  }
}
