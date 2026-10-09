import type { EffectContext } from "../../../../engine/effects/context"
import { STATUS } from "../ids"

// In-game values as of 2026-09-24: Binge Points at or above this is Tipsy.
export const TIPSY_BINGE_POINTS_THRESHOLD = 100

export function isInebriate(ctx: EffectContext): boolean {
  return (
    ctx.status.isActive(STATUS.inebriateDeepdaze) ||
    ctx.status.stacks(STATUS.bingePoints) >= TIPSY_BINGE_POINTS_THRESHOLD
  )
}
