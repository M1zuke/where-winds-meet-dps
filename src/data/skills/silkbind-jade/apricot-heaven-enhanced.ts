import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"
import { enduranceCost, enduranceMeter } from "../../resources/enduranceMeter"
import type { MeterDrain } from "../../../engine/skill"

// In-game values as of 2026-09-29: the air-charge's own -15/s drain, held to
// this stage's earliest release — 1.5 s into the air charge.
const APRICOT_HEAVEN_AIR_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 15, fromFrame: 72, stopAfterSec: 1.5 },
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
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  meterCosts: [enduranceCost(5)],
  meterDrains: APRICOT_HEAVEN_AIR_DRAIN,
  castFrames: 304,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach (the cast is Heavy
  // Attack 20601005); the rise is a vertical AoE with no further scripted
  // displacement.
  reachMeters: 3,
  hits: [
    hit(0, {
      frame: 54,
      physMultiplier: 0.626038,
      attributeMultiplier: 0.939057,
      physFixed: 173.2,
      attributeFixed: 94.4,
    }),
    hit(1, {
      // In-game values as of 2026-09-24: -5 more at 1.6 s (96 f) in — a
      // zero-damage marker, the pattern `legioncrusher.ts` uses.
      frame: 96,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [meterDelta({ target: enduranceMeter.id, stacks: -5 })],
    }),
    hit(2, {
      // Hit frames with only a window: the enhanced fall cannot land before
      // its own release (1.5 s into the air charge, 162 f from the press),
      // authored at that floor — this class's own evidence.
      frame: 162,
      physMultiplier: 2.504152,
      attributeMultiplier: 3.756228,
      physFixed: 692.8,
      attributeFixed: 377.6,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
