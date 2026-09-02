// Rotations removed from `src/data/rotations/rotations.json` that tests still
// need: a cached reference run cannot be re-measured against a rotation the
// picker no longer offers, and no surviving built-in covers the same casts.
import type { Rotation, RotationStep } from "../../src/engine/rotation"
import fixture from "./retiredRotations.fixture.json"

type RetiredEntry = Omit<Rotation, "steps"> & { steps: Omit<RotationStep, "id">[] }

const RETIRED = fixture as unknown as Record<string, RetiredEntry>

export function retiredRotation(rotationId: string): Rotation {
  const rotation = RETIRED[rotationId]
  if (!rotation) throw new Error(`no retired rotation ${rotationId}`)
  return {
    ...rotation,
    steps: rotation.steps.map((step, index) => ({ ...step, id: `${rotation.id}-${index}` })),
  }
}
