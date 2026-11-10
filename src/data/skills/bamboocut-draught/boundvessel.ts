import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import type { TriggerCondition } from "../../../engine/skill"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTACK, CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import {
  INEBRIATE_ENHANCED_RECEIVES,
  MISTWILLOW_HEAVY_ATTACK_RECEIVES,
  RIVEN_TWINBLADES_RECEIVES,
} from "./receives"
import { SKYSPEAK_TIER_4_CONDITION } from "./skyspeak-tier-4"
import { skillBingePointAccumulationTriggersWhen } from "./buffs/skillBingePointAccumulation"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { LEVEL_ROWS } from "./levelRows"

const INEBRIATE: TriggerCondition[] = [{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }]

export const BOUNDVESSEL_CAST_CONDITIONS: TriggerCondition[] = [
  ...INEBRIATE,
  { buffId: STATUS.empoweredLightAttack, op: "eq", stacks: 0 },
]

const rapidSlash = (index: number, frame: number) =>
  hit(index, {
    frame,
    ...levelScaled(LEVEL_ROWS.boundvesselHit2),
    conditions: INEBRIATE,
  })

// In-game damage tooltip, 2026-09-04: the press splits its total into two
// hits of 0.5 each; rapid slash lands at 0.091 per hit; the two finishing
// slashes split their total 0.2 and 0.4; attribute side × 1.5. The hold is 11
// slashes, spread evenly across the loop window (in-game values as of
// 2026-10-06). The completed hold grants Cloudvault (in-game skill text,
// 2026-09-04); cast length and the finishing hit frames to the full hold's own
// finish: in-game animation, 2026-09-24. With Skyspeak tier 4 the finish
// banks Binge Points on frame 159 for the drink that follows (in-game values
// as of 2026-10-15).
export const boundvesselHits = [
  hit(0, {
    frame: 24,
    ...levelScaled(LEVEL_ROWS.boundvesselHit0),
    conditions: INEBRIATE,
  }),
  hit(14, {
    frame: 24,
    ...levelScaled(LEVEL_ROWS.boundvesselHit0),
    conditions: INEBRIATE,
  }),
  rapidSlash(1, 47),
  rapidSlash(2, 56),
  rapidSlash(3, 65),
  rapidSlash(4, 74),
  rapidSlash(5, 83),
  rapidSlash(6, 91),
  rapidSlash(7, 100),
  rapidSlash(8, 109),
  rapidSlash(9, 118),
  rapidSlash(10, 127),
  rapidSlash(11, 135),
  hit(12, {
    frame: 144,
    ...levelScaled(LEVEL_ROWS.boundvesselHit13),
    conditions: INEBRIATE,
  }),
  hit(15, {
    frame: 159,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    conditions: INEBRIATE,
    triggers: skillBingePointAccumulationTriggersWhen(SKYSPEAK_TIER_4_CONDITION),
  }),
  hit(13, {
    frame: 161,
    ...levelScaled(LEVEL_ROWS.boundvesselHit15),
    conditions: INEBRIATE,
    triggers: [applyBuff({ target: STATUS.cloudvault, stacks: 1 })],
  }),
]

export const boundvessel = defineSkill({
  id: SKILL.boundvessel,
  classId: "bamboocutDraught",
  name: "Twinblade Heavy Attack",
  breakdownName: "Boundvessel",
  tags: [WEAPON.twinBlades, ROLE.inebriateEnhanced, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.boundvessel,
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
    BUFF.nonPlayerBaseDamage50,
    ...MISTWILLOW_HEAVY_ATTACK_RECEIVES,
  ],
  castConditions: BOUNDVESSEL_CAST_CONDITIONS,
  triggerable: false,
  castFrames: 208,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // The rapid-slash loop's own Endurance drain, 1.6 s from its start
  // (in-game values as of 2026-09-24).
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 15, fromFrame: 40, stopAfterSec: 1.6 }],
  hits: boundvesselHits,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
