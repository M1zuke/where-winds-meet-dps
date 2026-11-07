import type { Rotation } from "../../engine/rotation"
import {
  DEFAULT_AVERAGE_FPS,
  DEFAULT_PING_MS,
  DEFAULT_SERVER_PROCESSING_MS,
} from "../../engine/pingFps"
import { DEFAULT_PREFERRED_DISTANCE_METERS } from "../../engine/distance"
import { ROTATIONS } from "../../data/rotations"
import type { RotationDef } from "./rotationDef"

function withStepIds(rotation: RotationDef): Rotation {
  return {
    ...rotation,
    pingMs: rotation.pingMs ?? DEFAULT_PING_MS,
    averageFps: rotation.averageFps ?? DEFAULT_AVERAGE_FPS,
    serverProcessingMs: rotation.serverProcessingMs ?? DEFAULT_SERVER_PROCESSING_MS,
    preferredDistanceMeters: rotation.preferredDistanceMeters ?? DEFAULT_PREFERRED_DISTANCE_METERS,
    steps: rotation.steps.map((step, index) => ({ ...step, id: `${rotation.id}-${index}` })),
  }
}

export function rotationsFor(classId: string): Rotation[] {
  return ROTATIONS.filter((rotation) => rotation.classId === classId).map(withStepIds)
}
