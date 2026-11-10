import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"
import { LEVEL_ROWS } from "./levelRows"

export const freeMorph = defineSkill({
  id: SKILL.freeMorph,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Free Morph",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.freeMorph,
  // Cast length to the earliest next input and hit frames: in-game
  // animation, 2026-10-15.
  castFrames: 270,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 30,
  // In-game values as of 2026-09-24: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, { frame: 24, ...levelScaled(LEVEL_ROWS.freeMorphLarge) }),
    hit(1, { frame: 58, ...levelScaled(LEVEL_ROWS.freeMorphSmall) }),
    hit(2, { frame: 79, ...levelScaled(LEVEL_ROWS.freeMorphSmall) }),
    hit(3, { frame: 100, ...levelScaled(LEVEL_ROWS.freeMorphSmall) }),
    hit(4, { frame: 115, ...levelScaled(LEVEL_ROWS.freeMorphSmall) }),
    hit(5, { frame: 126, ...levelScaled(LEVEL_ROWS.freeMorphSmall) }),
    hit(6, { frame: 170, ...levelScaled(LEVEL_ROWS.freeMorphLarge) }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
