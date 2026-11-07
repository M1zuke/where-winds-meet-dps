import type { EffectContext } from "../../../../engine/effects/context"
import { ROLE } from "../../ids"
import { STATUS } from "../ids"

// In-game values as of 2026-09-24: Binge Points at or above this is Tipsy.
export const TIPSY_BINGE_POINTS_THRESHOLD = 100

export function isInebriate(ctx: EffectContext): boolean {
  return (
    ctx.status.isActive(STATUS.inebriateDeepdaze) ||
    ctx.status.stacks(STATUS.bingePoints) >= TIPSY_BINGE_POINTS_THRESHOLD
  )
}

// A hit of a skill tagged `inebriateEnhanced` needs no Tipsy or Deepdaze. Plain
// Peakfall and Castlink carry no such tag, and their Jadeflush forms only
// exist while Tipsy, so they stay on the state gate (in-game values as of
// 2026-10-15).
export function isInebriateEnhancedHit(ctx: EffectContext): boolean {
  return (
    isInebriate(ctx) || (ctx.event.kind === "damage" && ctx.event.tags.has(ROLE.inebriateEnhanced))
  )
}
