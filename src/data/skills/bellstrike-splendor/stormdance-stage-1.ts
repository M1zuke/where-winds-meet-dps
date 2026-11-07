import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, PROP, CAST, WEAPON, ATTACK } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { BATTLE_ANTHEM_ENDURANCE_GAIN } from "./buffs/battleAnthemEnduranceGain"
import { MOUNTAINS_MIGHT_CHARGED_HIT_GAIN } from "./buffs/mountainsMightChargedHitGain"
import { enduranceMeter } from "../../resources/enduranceMeter"
import type { MeterDrain, MeterFreeze, SkillHit } from "../../../engine/skill"

export const STORM_DANCE_CLASS_104_HIT_TRIGGERS = [
  MOUNTAINS_MIGHT_CHARGED_HIT_GAIN,
  BATTLE_ANTHEM_ENDURANCE_GAIN,
]

export const STORM_DANCE_STAGE_1_SPIN_HIT = {
  physMultiplier: 0.2504125,
  attributeMultiplier: 0.37561875,
  physFixed: 69.375,
  attributeFixed: 37.75,
}
const SPIN_HIT = STORM_DANCE_STAGE_1_SPIN_HIT
// In-game values as of 2026-09-24: the 8 stage-1 spin colliders' frames from
// the press (18 f detect + 19.56 f wind-up + each collider's own offset).
const SPIN_FRAMES = [40, 55, 67, 78, 88, 98, 107, 116]

// Stage 2 sub-casts exactly these 8 hits (never stage 1's own finisher below)
// so a full hold never carries the early-release finisher.
export const STORM_DANCE_STAGE_1_SPIN_HITS: SkillHit[] = SPIN_FRAMES.map((frame, index) =>
  hit(index, { frame, ...SPIN_HIT, triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS }),
)

// In-game values as of 2026-09-25: 20 / s from the stage-1 charge node's own
// start (37.56 f from the press), stopped at this stage's earliest release —
// right after the 8th spin hit lands. No lower reachable form exists to fall
// back to (a press always becomes Storm Dance for Nameless Spear).
export const STORM_DANCE_STAGE_1_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 20, fromFrame: 38, stopAfterSec: 1.3 },
]
export const STORM_DANCE_FREEZE: MeterFreeze[] = [{ meterId: enduranceMeter.id, fromFrame: 0 }]

// Stage 2's own castSkill sub-target for the 8 shared spin hits above,
// carrying stage 1's own tags: in-game values as of 2026-09-24, the Charged
// attunement reaches only these hits, never stage 2's own spin or finisher.
export const stormDanceStage1Spin = defineSkill({
  id: SKILL.stormDanceStage1Spin,
  classId: "bellstrikeSplendor",
  name: "Storm Dance (Stage 1 Spin)",
  breakdownName: "Storm Dance",
  tags: [WEAPON.spear, ATTACK.charge, PROP.isCharged, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.stormDanceStage1,
  receives: [
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SPEAR_RECEIVES,
  ],
  castFrames: 0,
  triggerable: true,
  hits: STORM_DANCE_STAGE_1_SPIN_HITS,
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

export const stormDanceStage1 = defineSkill({
  id: SKILL.stormDanceStage1,
  classId: "bellstrikeSplendor",
  name: "Storm Dance (Stage 1)",
  breakdownName: "Storm Dance",
  tags: [WEAPON.spear, ATTACK.charge, PROP.isCharged, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.stormDanceStage1,
  receives: [
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SPEAR_RECEIVES,
  ],
  meterDrains: STORM_DANCE_STAGE_1_DRAIN,
  meterFreezes: STORM_DANCE_FREEZE,
  // Cast length to the earliest next input: released right after the 8th
  // spin hit, plus the stage-1 finisher's own length (in-game animation,
  // 2026-09-24).
  castFrames: 184,
  triggerable: true,
  // In-game values as of 2026-09-28: 5 m approach reach; stationary once in
  // range.
  reachMeters: 5,
  hits: [
    ...STORM_DANCE_STAGE_1_SPIN_HITS,
    hit(SPIN_FRAMES.length, {
      frame: 129,
      physMultiplier: 0.20033,
      attributeMultiplier: 0.300495,
      physFixed: 55.5,
      attributeFixed: 30.2,
      triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS,
    }),
    hit(SPIN_FRAMES.length + 1, {
      frame: 160,
      physMultiplier: 0.40066,
      attributeMultiplier: 0.60099,
      physFixed: 111,
      attributeFixed: 60.4,
      triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
