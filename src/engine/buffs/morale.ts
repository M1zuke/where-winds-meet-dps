// QI-BREAK MODEL — deliberate deviation from the site (in-game verified
// 2026-08-01): the site doubles the stack COUNT (capped at 10) at 1 %/stack
// (`ta()` ~L42356-42363), but in game the buff never exceeds 5 stacks —
// instead acquisition doubles (still capped at 5) and the per-stack damage
// boost doubles to 2 %, while phys pen per stack (~L22704) stays unchanged.
// Morale pen lands on `phys.penetration` only, never `bellstrike.penetration`
// — the site's weapon/attribute pen track (~L22705) never sums it.
export const MORALE_DMG_PER_STACK = 0.01
export const MORALE_DMG_PER_STACK_QI_BREAK = 0.02
export const MORALE_PEN_PER_STACK = 0.02 // site's moralePenBase: 2 pen points (~L22248) → 0.02 in the panel's fraction-of-100 unit
export const MORALE_STACK_THRESHOLD = 5 // site's zi.moraleStackThreshold
export const YI_RIVER_INTERVAL_SEC = 10 // site's zi.triggerInterval
export const MORALE_MAX_STACKS = 5

// Ramp: site's `ml()` (~L22103-22109).
function baseMoraleStacks(tSec: number): number {
  if (tSec < 0) return 0
  return Math.min(MORALE_MAX_STACKS, 1 + Math.floor(tSec / 2))
}

export function moraleStacksAtTime(tSec: number, controlled: boolean): number {
  const base = baseMoraleStacks(tSec)
  return controlled ? Math.min(MORALE_MAX_STACKS, base * 2) : base
}

export function moraleDmgPerStack(controlled: boolean): number {
  return controlled ? MORALE_DMG_PER_STACK_QI_BREAK : MORALE_DMG_PER_STACK
}
