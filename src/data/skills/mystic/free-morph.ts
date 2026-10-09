import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

// In-game values as of 2026-09-24, level 71: power 7.17042, flat 1079.54,
// split across the colliders' own ratios (0.2 launch, 0.12 × 5 mid-air
// strikes, 0.2 slam).
const POWER = 7.17042
const FLAT = 1079.54
const LAUNCH_RATIO = 0.2
const STRIKE_RATIO = 0.12
const SLAM_RATIO = 0.2

const row = (ratio: number) => ({
  physMultiplier: POWER * ratio,
  attributeMultiplier: POWER * ratio * 1.5,
  physFixed: FLAT * ratio,
  attributeFixed: 0,
})

export const freeMorph = defineSkill({
  id: SKILL.freeMorph,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Free Morph",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.freeMorph,
  castFrames: 171,
  triggerable: true,
  // In-game values as of 2026-09-24: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, { frame: 25, ...row(LAUNCH_RATIO) }),
    hit(1, { frame: 59, ...row(STRIKE_RATIO) }),
    hit(2, { frame: 80, ...row(STRIKE_RATIO) }),
    hit(3, { frame: 101, ...row(STRIKE_RATIO) }),
    hit(4, { frame: 115, ...row(STRIKE_RATIO) }),
    hit(5, { frame: 126, ...row(STRIKE_RATIO) }),
    hit(6, { frame: 171, ...row(SLAM_RATIO) }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
