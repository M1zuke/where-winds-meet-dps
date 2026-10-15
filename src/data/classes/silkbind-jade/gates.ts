import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { peaksSpringlessSilenceChargesMeter } from "./chargeMeters"

const CLASS_ID = "silkbindJade"

// In-game values as of 2026-10-15: Gourd Toss rank 4+ opens this for 3 s at the
// end of the water-clone return; the next Forsaken Fame started within it
// charges faster and its whirlwind flies faster.
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
  updatedAt: "2026-10-15T00:00:00.000Z",
})

// In-game values as of 2026-10-15: Peak's Springless Silence leaves a water
// clone at its start; the return to it is castable for 5 s and removes it.
export const WATER_CLONE_DURATION_FRAMES = 300

export const WATER_CLONE_GATE: Buff = defineGateBuff({
  id: BUFF.waterClone,
  classId: CLASS_ID,
  name: "Water Clone",
  description: "Peak's Springless Silence can return to its water clone.",
  scope: "player",
  activation: "triggered",
  durationFrames: WATER_CLONE_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})

// In-game values as of 2026-10-15: Gourd Toss rank 6 opens this for 3 s on a
// Peak's Springless Silence hit; each Moon Shatter Spring hit inside it cuts
// 1 s off the Special's recharge.
export const GOURD_TOSS_PURSUIT_CUT_WINDOW_DURATION_FRAMES = 180

export const GOURD_TOSS_PURSUIT_CUT_WINDOW_GATE: Buff = defineGateBuff({
  id: BUFF.gourdTossPursuitCutWindow,
  classId: CLASS_ID,
  name: "Gourd Toss — Pursuit Recharge",
  description: "Each Moon Shatter Spring hit shortens Peak's Springless Silence's recharge.",
  scope: "player",
  activation: "triggered",
  durationFrames: GOURD_TOSS_PURSUIT_CUT_WINDOW_DURATION_FRAMES,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 6,
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})

// In-game values as of 2026-10-15: with Gourd Toss slotted the Special recharges
// in 15 s instead of 12.
export const GOURD_TOSS_SPECIAL_RECHARGE_GATE: Buff = defineGateBuff({
  id: BUFF.gourdTossSpecialRecharge,
  classId: CLASS_ID,
  name: "Gourd Toss — Special Recharge",
  description: "Peak's Springless Silence recharges in 15 s instead of 12.",
  scope: "player",
  activation: "triggered",
  durationFrames: 1,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.gourdToss,
  meterModifiers: [
    {
      meterId: peaksSpringlessSilenceChargesMeter.id,
      kind: "regen",
      amount: -0.2,
      alwaysActive: true,
    },
  ],
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})

export const SILKBIND_JADE_GATES: readonly Buff[] = [
  GOURD_TOSS_FLYING_TORNADO_GATE,
  WATER_CLONE_GATE,
  GOURD_TOSS_PURSUIT_CUT_WINDOW_GATE,
  GOURD_TOSS_SPECIAL_RECHARGE_GATE,
]
