import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, PROP, CAST, WEAPON, ATTACK } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"
import type { MeterDrain, SkillHit } from "../../../engine/skill"
import {
  STORM_DANCE_CLASS_104_HIT_TRIGGERS,
  STORM_DANCE_FREEZE,
  STORM_DANCE_STAGE_1_SPIN_HIT,
} from "./stormdance-stage-1"

const WUSHUANG_ACTIVE = { buffId: BUFF.wushuangStance, op: "gte" as const, stacks: 1 }

// In-game values as of 2026-09-24: with Wushuang Stance held, stage 1 starts
// at once (18 f from the press, no wind-up) and its cap shrinks from 1.4 s to
// 0.8 s (66 f from the press) — only the first 4 of the 8 spin colliders land
// before the cap.
const WUSHUANG_SPIN_FRAMES = [20, 35, 47, 59]

export const STORM_DANCE_STAGE_1_WUSHUANG_SPIN_HITS: SkillHit[] = WUSHUANG_SPIN_FRAMES.map(
  (frame, index) =>
    hit(index, {
      frame,
      ...STORM_DANCE_STAGE_1_SPIN_HIT,
      triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS,
    }),
)

// In-game values as of 2026-09-25: the same 20 / s drain, from the earlier
// Wushuang start (18 f) to this stage's earliest release — right after the
// 4th spin hit lands.
export const STORM_DANCE_STAGE_1_WUSHUANG_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 20, fromFrame: 18, stopAfterSec: (59 - 18) / 60 },
]

// Stage 2's Wushuang sub-target for the 4 shared spin hits above — the same
// role `stormDanceStage1Spin` plays for the normal timing.
export const stormDanceStage1WushuangSpin = defineSkill({
  id: SKILL.stormDanceStage1WushuangSpin,
  classId: "bellstrikeSplendor",
  name: "Storm Dance (Stage 1 Spin, Wushuang Stance)",
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
  hits: STORM_DANCE_STAGE_1_WUSHUANG_SPIN_HITS,
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})

// A rotation author's Wushuang-Stance-accelerated form of the short, stage-1-
// only hold: pick this instead of `stormDanceStage1` whenever a Legion
// Crusher hit landed within the last 3 s (wushuangStance's own window).
export const stormDanceStage1Wushuang = defineSkill({
  id: SKILL.stormDanceStage1Wushuang,
  classId: "bellstrikeSplendor",
  name: "Storm Dance (Stage 1, Wushuang Stance)",
  breakdownName: "Storm Dance",
  tags: [WEAPON.spear, ATTACK.charge, PROP.isCharged, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.stormDanceStage1,
  castConditions: [WUSHUANG_ACTIVE],
  receives: [
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SPEAR_RECEIVES,
  ],
  meterDrains: STORM_DANCE_STAGE_1_WUSHUANG_DRAIN,
  meterFreezes: STORM_DANCE_FREEZE,
  // Cast length to the earliest next input: released right after the 4th
  // spin hit, plus the stage-1 finisher's own length (in-game animation,
  // 2026-09-24).
  castFrames: 127,
  triggerable: true,
  reachMeters: 5,
  hits: [
    ...STORM_DANCE_STAGE_1_WUSHUANG_SPIN_HITS,
    hit(WUSHUANG_SPIN_FRAMES.length, {
      frame: 72,
      physMultiplier: 0.20033,
      attributeMultiplier: 0.300495,
      physFixed: 55.5,
      attributeFixed: 30.2,
      triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS,
    }),
    hit(WUSHUANG_SPIN_FRAMES.length + 1, {
      frame: 103,
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
