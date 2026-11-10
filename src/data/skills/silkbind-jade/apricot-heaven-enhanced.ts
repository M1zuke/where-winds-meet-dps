import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { castSkill, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { enduranceCost, enduranceMeter } from "../../resources/enduranceMeter"
import type { MeterDrain } from "../../../engine/skill"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-11-10: the air-charge's own -15/s drain, opening 72 f
// after the 14.4 f hold decision and held to this stage's earliest release —
// 1.5 s into the air charge.
const APRICOT_HEAVEN_AIR_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 15, fromFrame: 86.4, stopAfterSec: 1.5 },
]

// Held past the 1.5 s threshold before releasing, trading the extra air-charge
// drain for the enhanced fall. In-game values as of 2026-09-24.
export const apricotHeavenEnhanced = defineSkill({
  id: SKILL.apricotHeavenEnhanced,
  classId: "silkbindJade",
  name: "Apricot Heaven (Enhanced Fall)",
  breakdownName: "Apricot Heaven",
  tags: [PROP.isCharged, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.apricotHeavenEnhanced,
  receives: [BUFF.pursuitChargedBoost, ...VERNAL_UMBRELLA_RECEIVES],
  meterCosts: [enduranceCost(5)],
  meterDrains: APRICOT_HEAVEN_AIR_DRAIN,
  castFrames: 304,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach (the cast is its
  // Heavy Attack); the rise is a vertical AoE with no further scripted
  // displacement.
  reachMeters: 3,
  hits: [
    hit(0, {
      // In-game values as of 2026-11-10: the rise lands 54.18 f after the
      // 14.4 f hold decision.
      frame: 68.58,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [castSkill({ target: SKILL.apricotHeavenRise })],
    }),
    hit(1, {
      // In-game values as of 2026-11-10: -5 more 1.6 s after the hold
      // decision — a zero-damage marker, the pattern `legioncrusher.ts` uses.
      frame: 110.4,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [meterDelta({ target: enduranceMeter.id, stacks: -5 })],
    }),
    hit(2, {
      // In-game values as of 2026-11-10: the enhanced fall is released 1.5 s
      // into the air charge, and its collider is 27.15 f into the release.
      frame: 203.55,
      ...levelScaled(LEVEL_ROWS.apricotHeavenEnhancedHit2),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
