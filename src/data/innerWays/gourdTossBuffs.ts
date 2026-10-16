import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"

// In-game values as of 2026-09-24: a Peak's Springless Silence hit that does
// not launch its target — always true on a training stake — opens this 15 s
// window; the next Peak's Springless Silence deals +30% on every hit and
// consumes it. Rank 3 and up.
export const gourdTossThunderBuffDef = defineBuff({
  id: BUFF.gourdTossThunder,
  name: "Thunder",
  requires: { param: PARAM.gourdToss, minTier: 3 },
  duration: 15,
  summary: "allDamageBoost +30% on the next Peak's Springless Silence",
  effects: [stat("allDamageBoost", 0.3)],
})

// In-game values as of 2026-10-15: rank 6 — a Peak's Springless Silence hit on
// a non-player ends the Moon Shatter Spring cooldown, once per second.
export const gourdTossMoonShatterResetBuffDef = defineBuff({
  id: BUFF.gourdTossMoonShatterReset,
  name: "Moon Shatter Spring Reset",
  requires: { param: PARAM.gourdToss, minTier: 6 },
  duration: 1,
  cooldown: 1,
  buffAppliesAfterLastHitSec: 0,
  dispelsOnGrant: [BUFF.moonShatterSpringLockout],
  effects: [],
})
