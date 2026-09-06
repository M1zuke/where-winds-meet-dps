import type { EffectContext } from "../../../../engine/effects/context"
import { STATUS } from "../ids"

export function isInebriate(ctx: EffectContext): boolean {
  return (
    ctx.status.isActive(STATUS.inebriateDeepdaze) || ctx.status.stacks(STATUS.bingePoints) >= 100
  )
}
