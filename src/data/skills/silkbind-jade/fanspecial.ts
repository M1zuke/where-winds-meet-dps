import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill, meterDelta } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import {
  UNITS_PER_SECOND_OF_RECHARGE,
  chargeAvailable,
  chargeCost,
  peaksSpringlessSilenceChargesMeter,
} from "../../classes/silkbind-jade/chargeMeters"
import {
  GOURD_TOSS_PURSUIT_CUT_WINDOW_DURATION_FRAMES,
  WATER_CLONE_DURATION_FRAMES,
} from "../../classes/silkbind-jade/gates"

// In-game values as of 2026-09-24: a hit that does not launch its target —
// always true on a training stake — opens Gourd Toss's own Thunder window
// for the next cast, at this cast's own end. Rank 3 and up.
const gourdTossThunderGrant = applyBuff({
  target: BUFF.gourdTossThunder,
  appliesOnCastEnd: true,
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 3,
})

// In-game values as of 2026-10-15: the same non-launching hit cuts 3 s off the
// recharge at the cast's end. Rank 3 and up.
const gourdTossRechargeCut = meterDelta({
  target: peaksSpringlessSilenceChargesMeter.id,
  stacks: 3 * UNITS_PER_SECOND_OF_RECHARGE,
  appliesOnCastEnd: true,
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 3,
})

// In-game values as of 2026-10-15: rank 6 cuts 2 s off the recharge and opens a
// 3 s window in which each Moon Shatter Spring hit cuts 1 s more; once per
// second.
const GOURD_TOSS_HIT_GROUP = "gourdTossSpecialHit"
const gourdTossHitRechargeCut = meterDelta({
  target: peaksSpringlessSilenceChargesMeter.id,
  stacks: 2 * UNITS_PER_SECOND_OF_RECHARGE,
  cooldownFrames: 60,
  cooldownGroup: GOURD_TOSS_HIT_GROUP,
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 6,
})
const gourdTossPursuitCutWindow = applyBuff({
  target: BUFF.gourdTossPursuitCutWindow,
  durationFrames: GOURD_TOSS_PURSUIT_CUT_WINDOW_DURATION_FRAMES,
  cooldownFrames: 60,
  cooldownGroup: GOURD_TOSS_HIT_GROUP,
  requiresParam: PARAM.gourdToss,
  requiresMinTier: 6,
})

// In-game values as of 2026-10-15: the landing hit grants Windrider when the
// target already carried your Lingering Bone, before this hit's own mark.
const windriderOnMarkedTarget = castSkill({
  target: SKILL.fanspecialWindriderGrant,
  condition: { buffId: BUFF.lingeringBone, op: "gte", stacks: 1, source: "buffEngine" },
})

// In-game values as of 2026-10-06: the cast's small first hit needs the caster
// at least 2.5 m from the target after the dash, which never happens on a
// training stake, so only the large hit lands.
const CAST_TOTAL = {
  physMultiplier: 1.2798,
  attributeMultiplier: 1.9197,
  physFixed: 355,
  attributeFixed: 193,
}
const LANDING_HIT_SHARE = 0.995

const landingHitCoefficients = {
  physMultiplier: CAST_TOTAL.physMultiplier * LANDING_HIT_SHARE,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier * LANDING_HIT_SHARE,
  physFixed: CAST_TOTAL.physFixed * LANDING_HIT_SHARE,
  attributeFixed: CAST_TOTAL.attributeFixed * LANDING_HIT_SHARE,
  extraCritDamage: 0,
}

export const fanspecial = defineSkill({
  id: SKILL.fanspecial,
  classId: "silkbindJade",
  name: "FanSpecial",
  tags: [WEAPON.fan, ATTUNE.fanSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanSpecial,
  receives: [BUFF.gourdTossThunder, ...INKWELL_FAN_RECEIVES],
  triggersBuffs: [
    BUFF.lingeringBone,
    BUFF.starReacherSupreme,
    BUFF.starReacher,
    BUFF.gourdTossMoonShatterReset,
  ],
  meterCosts: [chargeCost(peaksSpringlessSilenceChargesMeter)],
  castConditions: [chargeAvailable(peaksSpringlessSilenceChargesMeter)],
  // Cast length to the earliest next input (in-game animation, 2026-10-15).
  castFrames: 66.8,
  triggerable: true,
  // In-game values as of 2026-09-28: 9 m approach reach; the cast's own
  // segments then teleport to about 1.5 m from the target, along its facing.
  reachMeters: 9,
  displacement: { kind: "toTarget", meters: 1.5 },
  hits: [
    hit(0, {
      frame: 33.45,
      ...landingHitCoefficients,
      triggers: [
        gourdTossThunderGrant,
        gourdTossRechargeCut,
        gourdTossHitRechargeCut,
        gourdTossPursuitCutWindow,
        windriderOnMarkedTarget,
      ],
    }),
    hit(1, {
      // In-game values as of 2026-10-15: the water clone appears 0.24 f in and
      // can be returned to for 5 s.
      frame: 0.24,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: BUFF.waterClone, durationFrames: WATER_CLONE_DURATION_FRAMES }),
      ],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
