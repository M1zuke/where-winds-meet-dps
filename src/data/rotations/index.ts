import type { Rotation } from "../../engine/rotation"
import defaultRotationsData from "./defaultRotations.json"
import handRotationsData from "./handRotations.json"

interface RotationPoolFile {
  rotations: Rotation[]
  defaultRotationId?: string
}

const DEFAULT_ROTATIONS = defaultRotationsData as unknown as Record<string, RotationPoolFile>
const HAND_ROTATIONS = handRotationsData as unknown as Record<string, RotationPoolFile>

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
