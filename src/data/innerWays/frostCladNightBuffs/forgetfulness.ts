import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"

// Carries no damage of its own — it is the window the Forgetfulness variant of
// Snowparting Charged is authored against.
export const forgetfulness: InnerWayGateBuff = defineInnerWayGateBuff({
  id: BUFF.forgetfulness,
  name: "Forgetfulness",
  scope: "player",
  activation: "triggered",
  durationFrames: 180,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.frostCladNight,
  requiresMinTier: 6,
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})

// In-game values as of 2026-09-24: the free Grave Frost the Forgetfulness
// window lets the player cast starts its own 6 s cooldown, reset by an
// Exhausted-boss hit — not the 6 s counted from Forgetfulness's own grant.
export const forgetfulnessCooldown: InnerWayGateBuff = defineInnerWayGateBuff({
  id: BUFF.forgetfulnessCooldown,
  name: "Forgetfulness Cooldown",
  scope: "player",
  activation: "triggered",
  durationFrames: 360,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.frostCladNight,
  requiresMinTier: 6,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})
