import type { EngineRunOptions, Inputs, Result } from "./types"
import { simulateTimeline } from "./timeline"
import { activeRotationForInputs } from "./activeRotation"

export function runEngine(inputs: Inputs, options?: EngineRunOptions): Result {
  const rotation = activeRotationForInputs(inputs)
  if (!rotation) {
    return {
      dps: 0,
      totalDamage: 0,
      rotationDuration: 0,
      fightStartSec: 0,
      castDuration: 0,
      graduationRate: null,
      perSkill: [],
      ranking: [],
      warnings: [`No default rotation for ${inputs.classId}.`],
    }
  }
  return simulateTimeline({ ...inputs, activeCustomRotation: rotation }, options)
}
