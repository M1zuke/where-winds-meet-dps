import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { BUFF } from "../../skills/buffs/ids"

const CLASS_ID = "silkbindJade"

// In-game values as of 2026-09-24: Gourd Toss rank 4+ opens this for 3 s at
// the water-clone return; the next Forsaken Fame started within it charges
// faster and its whirlwind flies faster. Approximated on Peak's Springless
// Silence's own cast end — this engine has no return event of its own to key
// the window from.
export const GOURD_TOSS_FLYING_TORNADO_DURATION_FRAMES = 180

export const GOURD_TOSS_FLYING_TORNADO_GATE: Buff = defineGateBuff({
  id: BUFF.gourdTossFlyingTornado,
  classId: CLASS_ID,
  name: "Flying Tornado",
  description: "The next Forsaken Fame charges faster and its whirlwind flies faster.",
  scope: "player",
  activation: "triggered",
  durationFrames: GOURD_TOSS_FLYING_TORNADO_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

export const SILKBIND_JADE_GATES: readonly Buff[] = [GOURD_TOSS_FLYING_TORNADO_GATE]
