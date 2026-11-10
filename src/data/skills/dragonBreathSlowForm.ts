import type { HitVariant } from "../../engine/skill"
import { applyDebuff } from "../../definitions/skills/triggers"
import { DEBUFF } from "./mystic/ids"

// In-game values as of 2026-11-10: without Intoxicated, Dragon's Breath plays
// its slow animation, which lands 76.38 frames in, and opens Intoxicated
// itself. Its hit coefficients are the quick form's.
export const SLOW_FORM_HIT_FRAME = 76.38

export const NOT_INTOXICATED = { buffId: DEBUFF.intoxicated, op: "lt", stacks: 1 } as const

export const OPENS_INTOXICATED = applyDebuff({
  target: DEBUFF.intoxicated,
  condition: NOT_INTOXICATED,
})

export function slowFormVariant(
  skillId: string,
  row: Pick<HitVariant, "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed">,
  castFrames: number,
): HitVariant {
  return {
    id: `hv-${skillId}-hit-0-slow-form`,
    label: "Not Intoxicated",
    conditions: [NOT_INTOXICATED],
    ...row,
    frame: SLOW_FORM_HIT_FRAME,
    castFrames,
  }
}
