import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

// In-game values as of 2026-09-24, level 71: power 3.60865, flat 543.2,
// ratio 1.2 — the Throw ("kick") follow-up reached as a combo continuation
// off Lion's Roar. It has no earlier input window, so the animation's own end
// is the cast length.
const POWER = 3.60865
const FLAT = 543.2
const RATIO = 1.2

export const lionsRoarThrow = defineSkill({
  id: SKILL.lionsRoarThrow,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Lion's Roar - Throw",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.lionsRoarThrow,
  castFrames: 150,
  triggerable: true,
  reachMeters: 20,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 63,
      physMultiplier: POWER * RATIO,
      attributeMultiplier: POWER * RATIO * 1.5,
      physFixed: FLAT * RATIO,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
