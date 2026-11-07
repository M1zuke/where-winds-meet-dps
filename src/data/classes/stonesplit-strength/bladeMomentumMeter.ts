import { defineMeter, meterStatusId } from "../../../definitions/resources/meterDef"
import type { TriggerCondition, TriggerOp } from "../../../engine/skill"

// In-game values as of 2026-09-25: base 100, +5 / s in and out of combat, no
// post-spend pause. The Phalanxbane talent's own cap raises (125, then 150
// from its own art stage 5, reached at a world level far below this app's
// lowest supported breakthrough) so every buildable profile already sits at
// the 150 cap.
export const bladeMomentumMeter = defineMeter({
  id: "bladeMomentum",
  name: "Blade Momentum",
  capacity: 150,
  start: "full",
  regenPerSecond: 5,
})

export function bladeMomentumRequires(op: TriggerOp, stacks: number): TriggerCondition {
  return { buffId: meterStatusId(bladeMomentumMeter.id), op, stacks }
}
