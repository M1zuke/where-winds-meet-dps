import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { PROP, CAST, WEAPON, ATTACK } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"
import type { MeterDrain } from "../../../engine/skill"
import { STORM_DANCE_CLASS_104_HIT_TRIGGERS, STORM_DANCE_FREEZE } from "./stormdance-stage-1"

const WUSHUANG_ACTIVE = { buffId: BUFF.wushuangStance, op: "gte" as const, stacks: 1 }

const SPIN_HIT = {
  physMultiplier: 0.1126455,
  attributeMultiplier: 0.16896825,
  physFixed: 31.141,
  attributeFixed: 16.973,
}
// In-game values as of 2026-09-24: with Wushuang Stance held, stage 2 starts
// at 66 f from the press (not 121.56 f) — the same 69.68 f-long pass,
// 11-collider pattern as the normal timing, just shifted earlier by the
// shorter stage-1 hold above it.
const SPIN_FRAMES = [
  67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 167,
  206, 209, 212, 215, 218, 221, 224, 227, 230, 233, 236,
]

// In-game values as of 2026-09-25: the same continuous 20 / s drain, from the
// earlier Wushuang stage-1 start (18 f) all the way to the full 3.1 s stage-2
// cap; a hold that cannot sustain that falls back to the Wushuang stage-1
// release.
export const STORM_DANCE_STAGE_2_WUSHUANG_DRAIN: MeterDrain[] = [
  {
    meterId: enduranceMeter.id,
    perSecond: 20,
    fromFrame: 18,
    stopAfterSec: 3.9,
    chargeRelease: { fallbackSkillId: SKILL.stormDanceStage1Wushuang },
  },
]

export const stormDanceStage2Wushuang = defineSkill({
  id: SKILL.stormDanceStage2Wushuang,
  classId: "bellstrikeSplendor",
  name: "Storm Dance (Stage 2, Wushuang Stance)",
  breakdownName: "Storm Dance",
  // The 4 spin hits this sub-casts carry the Charged attunement tag on their
  // own module (`stormDanceStage1WushuangSpin`); the stage-2 hits below are
  // not on the attunement's own list (in-game values as of 2026-09-24), so
  // this cast carries no `attune:spearCharged` tag of its own.
  tags: [WEAPON.spear, ATTACK.charge, PROP.isCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.stormDanceStage2,
  castConditions: [WUSHUANG_ACTIVE],
  receives: [
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    ...NAMELESS_SPEAR_RECEIVES,
  ],
  meterDrains: STORM_DANCE_STAGE_2_WUSHUANG_DRAIN,
  meterFreezes: STORM_DANCE_FREEZE,
  // Cast length to the earliest next input: held to the full stage-2 cap,
  // plus the stage-2 finisher's own length (in-game animation, 2026-09-24).
  castFrames: 320,
  triggerable: true,
  reachMeters: 5,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [castSkill({ target: SKILL.stormDanceStage1WushuangSpin })],
    }),
    ...SPIN_FRAMES.map((frame, index) =>
      hit(index + 1, { frame, ...SPIN_HIT, triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS }),
    ),
    hit(SPIN_FRAMES.length + 1, {
      frame: 262,
      physMultiplier: 1.02405,
      attributeMultiplier: 1.536075,
      physFixed: 283.1,
      attributeFixed: 154.3,
      triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS,
    }),
    hit(SPIN_FRAMES.length + 2, {
      frame: 286,
      physMultiplier: 2.0481,
      attributeMultiplier: 3.07215,
      physFixed: 566.2,
      attributeFixed: 308.6,
      triggers: STORM_DANCE_CLASS_104_HIT_TRIGGERS,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
