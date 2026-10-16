import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, clearStatus, meterDelta } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import {
  UNITS_PER_SECOND_OF_RECHARGE,
  peaksSpringlessSilenceChargesMeter,
} from "../../classes/silkbind-jade/chargeMeters"
import { GOURD_TOSS_FLYING_TORNADO_DURATION_FRAMES } from "../../classes/silkbind-jade/gates"

// In-game values as of 2026-10-15: the return to the water clone, castable for 5
// s after Peak's Springless Silence. The clone is gone 6 f in; with Gourd Toss
// the return cuts 3 s off the Special's recharge when it ends, and from rank 4
// opens Flying Tornado for the next Forsaken Fame.
export const fanspecialReturn = defineSkill({
  id: SKILL.fanspecialReturn,
  classId: "silkbindJade",
  name: "FanSpecial Return",
  breakdownName: "Peak's Springless Silence",
  tags: [WEAPON.fan],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanSpecialReturn,
  receives: [...INKWELL_FAN_RECEIVES],
  castConditions: [{ buffId: BUFF.waterClone, op: "gte", stacks: 1 }],
  castFrames: 21.66,
  triggerable: true,
  reachMeters: 100,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 6,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        clearStatus({ target: BUFF.waterClone }),
        meterDelta({
          target: peaksSpringlessSilenceChargesMeter.id,
          stacks: 3 * UNITS_PER_SECOND_OF_RECHARGE,
          appliesOnCastEnd: true,
          requiresParam: PARAM.gourdToss,
        }),
        applyBuff({
          target: BUFF.gourdTossFlyingTornado,
          durationFrames: GOURD_TOSS_FLYING_TORNADO_DURATION_FRAMES,
          appliesOnCastEnd: true,
          requiresParam: PARAM.gourdToss,
          requiresMinTier: 4,
        }),
      ],
    }),
  ],
  createdAt: "2026-10-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
