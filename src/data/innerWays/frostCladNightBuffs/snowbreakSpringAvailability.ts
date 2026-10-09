import {
  defineInnerWayGateBuff,
  type InnerWayGateBuff,
} from "../../../definitions/innerWays/innerWayDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"

// In-game values as of 2026-09-24: Snowbreak Spring replaces the plain Heavy
// Attack only while this marker is up, granted by a successful Deflect, or by
// Grave Frost / the Dual-Weapon Skill at tier 3+.
export const snowbreakSpringAvailable: InnerWayGateBuff = defineInnerWayGateBuff({
  id: BUFF.snowbreakSpringAvailable,
  name: "Snowbreak Spring Available",
  scope: "player",
  activation: "triggered",
  durationFrames: 180,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.frostCladNight,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})

// The 2 s spacing Snowbreak Spring's own cast attaches to itself.
export const snowbreakSpringCooldown: InnerWayGateBuff = defineInnerWayGateBuff({
  id: BUFF.snowbreakSpringCooldown,
  name: "Snowbreak Spring Cooldown",
  scope: "player",
  activation: "triggered",
  durationFrames: 120,
  effects: [],
  maxStacks: 1,
  stackScaling: "flat",
  requiresParam: PARAM.frostCladNight,
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})
