import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

// In-game values as of 2026-09-24, level 71: power 6.80056, flat 1023.96,
// split across the colliders' own ratios (0.2 opener, 0.15 × 4 rapid strikes,
// 0.2 finisher). "Unstable Poise" needs a Stance bar (cavalry) and never
// fires against a training stake, so it is not modelled.
const POWER = 6.80056
const FLAT = 1023.96
const OPEN_RATIO = 0.2
const STRIKE_RATIO = 0.15
const FINISH_RATIO = 0.2

const row = (ratio: number) => ({
  physMultiplier: POWER * ratio,
  attributeMultiplier: POWER * ratio * 1.5,
  physFixed: FLAT * ratio,
  attributeFixed: 0,
})

export const wolflikeFrenzy = defineSkill({
  id: SKILL.wolflikeFrenzy,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Wolflike Frenzy",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.wolflikeFrenzy,
  castFrames: 167,
  triggerable: true,
  // In-game values as of 2026-09-24: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, { frame: 47, ...row(OPEN_RATIO) }),
    hit(1, { frame: 83, ...row(STRIKE_RATIO) }),
    hit(2, { frame: 95, ...row(STRIKE_RATIO) }),
    hit(3, { frame: 115, ...row(STRIKE_RATIO) }),
    hit(4, { frame: 127, ...row(STRIKE_RATIO) }),
    hit(5, { frame: 167, ...row(FINISH_RATIO) }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
