import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, MYSTIC } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"

export const fluteOfTheTidesFull = defineSkill({
  id: SKILL.fluteOfTheTidesFull,
  classId: "universal",
  name: "Flute of the Tides Full",
  breakdownName: "Flute Chanting a Thousand Waves",
  tags: [MYSTIC.area],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.fluteOfTheTidesFull,
  triggersBuffs: [BUFF.fluteBoost],
  castFrames: 162,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 3.897,
      attributeMultiplier: 5.8454999999999995,
      physFixed: 800,
      attributeFixed: 0,
    }),
    hit(1, {
      frame: 81,
      physMultiplier: 3.897,
      attributeMultiplier: 5.8454999999999995,
      physFixed: 800,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.fluteRipple })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
