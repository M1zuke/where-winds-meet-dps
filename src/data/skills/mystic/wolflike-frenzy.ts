import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"
import { LEVEL_ROWS } from "./levelRows"

// "Unstable Poise" needs a Stance bar (cavalry) and never fires against a
// training stake, so it is not modelled.
export const wolflikeFrenzy = defineSkill({
  id: SKILL.wolflikeFrenzy,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Wolflike Frenzy",
  tags: [MYSTIC.control],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.wolflikeFrenzy,
  // Cast length to the earliest next input and hit frames: in-game
  // animation, 2026-10-15.
  castFrames: 218,
  triggerable: true,
  // In-game values as of 2026-10-18.
  vitalityCost: 30,
  // In-game values as of 2026-09-24: a stationary cast, 8 m engagement range.
  reachMeters: 8,
  approach: "stationary",
  hits: [
    hit(0, { frame: 47, ...levelScaled(LEVEL_ROWS.wolflikeFrenzyLarge) }),
    hit(1, { frame: 83, ...levelScaled(LEVEL_ROWS.wolflikeFrenzySmall) }),
    hit(2, { frame: 95, ...levelScaled(LEVEL_ROWS.wolflikeFrenzySmall) }),
    hit(3, { frame: 115, ...levelScaled(LEVEL_ROWS.wolflikeFrenzySmall) }),
    hit(4, { frame: 127, ...levelScaled(LEVEL_ROWS.wolflikeFrenzySmall) }),
    hit(5, { frame: 155, ...levelScaled(LEVEL_ROWS.wolflikeFrenzyLarge) }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
