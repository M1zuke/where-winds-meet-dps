import type { EffectContext } from "../../../../engine/effects/context"
import { STATUS } from "../ids"

export function isFlowerBurial(ctx: EffectContext): boolean {
  return ctx.status.isActive(STATUS.flowerBurial)
}
