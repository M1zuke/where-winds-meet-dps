import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const fluteOfTheTidesPrepull = defineSkill({
  id: SKILL.fluteOfTheTidesPrepull,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Flute of the Tides Prepull",
  breakdownName: "Flute Chanting a Thousand Waves",
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
      triggers: [applyDebuff({ target: DEBUFF.fluteRipple })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
