import { IN_COMBAT_STATUS } from "../../../engine/combatState"
import type { EffectContext } from "../../../engine/effects/context"

const SECONDS_PER_STACK = 3
const MAX_STACKS = 10
const BOUNDARY_TOLERANCE_SEC = 1e-9

export const COMBAT_ENTRY_STACK_BONUS = 0.01

export function combatEntryStacks(ctx: EffectContext): number {
  const secondsSinceEntry = ctx.status.secondsSinceStacksReachedThreshold(IN_COMBAT_STATUS, 1)
  if (secondsSinceEntry === null || secondsSinceEntry <= 0) return 0
  const completedIntervals = Math.floor((secondsSinceEntry + BOUNDARY_TOLERANCE_SEC) / SECONDS_PER_STACK)
  return Math.min(MAX_STACKS, 1 + completedIntervals)
}
