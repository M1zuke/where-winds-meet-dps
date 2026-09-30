import type { EngineRunOptions, Inputs, Result } from "./types"
import type { Rotation } from "./rotation"
import { simulateTimeline } from "./timeline"
import { defaultRotationForClass, builtinRotationsForClass } from "./builtinLibrary"
import { isValidAverageFps, isValidPingMs } from "./pingFps"

export function usesCustomRotation(inputs: Inputs): boolean {
  return !!inputs.activeCustomRotation && inputs.activeCustomRotation.classId === inputs.classId
}

export function activeRotationForInputs(inputs: Inputs): Rotation | null {
  if (usesCustomRotation(inputs)) return inputs.activeCustomRotation ?? null
  if (inputs.selectedBuiltinRotationId) {
    const r = builtinRotationsForClass(inputs.classId).find(
      (x) => x.id === inputs.selectedBuiltinRotationId,
    )
    if (r) return r
  }
  return defaultRotationForClass(inputs.classId)
}

// The profile's own edit for a built-in rotation, `null` off a custom one or
// with nothing stored for this rotation's id (docs/TIMELINE.md §
// "Coefficients").
export function builtinRotationPingFpsOverride(
  inputs: Inputs,
  rotationId: string,
): { pingMs: number; averageFps: number } | null {
  if (usesCustomRotation(inputs)) return null
  const stored = inputs.builtinRotationPingFpsOverrides?.[rotationId]
  if (!stored || !isValidPingMs(stored.pingMs) || !isValidAverageFps(stored.averageFps)) return null
  return stored
}

function resolvedRotationPingFps(
  inputs: Inputs,
  rotation: Rotation,
): { pingMs: number; averageFps: number } {
  const override = builtinRotationPingFpsOverride(inputs, rotation.id)
  return override ?? { pingMs: rotation.pingMs, averageFps: rotation.averageFps }
}

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
  const { pingMs, averageFps } = resolvedRotationPingFps(inputs, rotation)
  return simulateTimeline(
    { ...inputs, activeCustomRotation: { ...rotation, pingMs, averageFps } },
    options,
  )
}
