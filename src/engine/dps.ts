import type { EngineRunOptions, Inputs, Result } from "./types"
import type { Rotation } from "./rotation"
import { simulateTimeline } from "./timeline"
import { defaultRotationForClass, builtinRotationsForClass } from "./builtinLibrary"

export function activeRotationForInputs(inputs: Inputs): Rotation | null {
  const active = inputs.activeCustomRotation
  if (active && active.classId === inputs.classId) return active
  if (inputs.selectedBuiltinRotationId) {
    const r = builtinRotationsForClass(inputs.classId).find(
      (x) => x.id === inputs.selectedBuiltinRotationId,
    )
    if (r) return r
  }
  return defaultRotationForClass(inputs.classId)
}

export function runEngine(inputs: Inputs, options?: EngineRunOptions): Result {
  const rotation = activeRotationForInputs(inputs)
  if (!rotation) {
    return {
      dps: 0,
      totalDamage: 0,
      rotationDuration: 0,
      graduationRate: null,
      perSkill: [],
      ranking: [],
      warnings: [`No default rotation for ${inputs.classId}.`],
    }
  }
  return simulateTimeline({ ...inputs, activeCustomRotation: rotation }, options)
}
