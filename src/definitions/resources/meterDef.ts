export interface MeterMaxContext {
  paramTier(id: string): number
  paramOn(id: string): boolean
  whiteAffinityRate: number
}

export interface MeterDef {
  id: string
  name: string
  capacity: number | ((ctx: MeterMaxContext) => number)
  start: number | "full"
  regenPerSecond: number
  regenPauseAfterSpendSec?: number
}

export function defineMeter<const Definition extends MeterDef>(definition: Definition): Definition {
  return definition
}

export function meterStatusId(meterId: string): string {
  return `meter:${meterId}`
}

// The `BuildView.paramValue` key a meter's own resolved capacity is injected
// under, so a reader (e.g. "missing = max − current") reaches it through the
// same generic accessor every other build-level number already uses, with no
// new context surface.
export function meterMaxParamKey(meterId: string): string {
  return `meterMax:${meterId}`
}

export function resolveMeterCapacity(def: MeterDef, ctx: MeterMaxContext): number {
  return typeof def.capacity === "function" ? def.capacity(ctx) : def.capacity
}

export function resolveMeterStart(def: MeterDef, capacity: number): number {
  return def.start === "full" ? capacity : Math.min(def.start, capacity)
}
