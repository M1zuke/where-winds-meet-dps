import type { Rotation, RotationStep } from "../../engine/rotation"
import {
  DEFAULT_AVERAGE_FPS,
  DEFAULT_PING_MS,
  DEFAULT_SERVER_PROCESSING_MS,
} from "../../engine/pingFps"
import { DEFAULT_PREFERRED_DISTANCE_METERS } from "../../engine/distance"

export interface RotationDef extends Omit<
  Rotation,
  "steps" | "pingMs" | "averageFps" | "serverProcessingMs" | "preferredDistanceMeters"
> {
  steps: Omit<RotationStep, "id">[]
  pingMs?: number
  averageFps?: number
  serverProcessingMs?: number
  preferredDistanceMeters?: number
}

export function defineRotation(rotation: RotationDef): RotationDef {
  return {
    pingMs: DEFAULT_PING_MS,
    averageFps: DEFAULT_AVERAGE_FPS,
    serverProcessingMs: DEFAULT_SERVER_PROCESSING_MS,
    preferredDistanceMeters: DEFAULT_PREFERRED_DISTANCE_METERS,
    ...rotation,
  }
}
