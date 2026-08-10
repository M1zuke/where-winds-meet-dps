import { defineSkill, hit } from "../define"
import { applyDebuff } from "../triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fluteOfTheTidesPrepull = defineSkill({
  id: SKILL.fluteOfTheTidesPrepull,
  classId: "universal",
  name: "Flute of the Tides Prepull",
  tags: [MYSTIC.areaDamage],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.fluteOfTheTidesPrepull,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyDebuff({ id: "tg-flute-of-the-tides-prepull-triggered", target: DEBUFF.fluteRipple })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
