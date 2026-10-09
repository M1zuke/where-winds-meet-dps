import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"
import { BUFF } from "../buffs/ids"

export const fluteOfTheTidesFull = defineSkill({
  id: SKILL.fluteOfTheTidesFull,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Flute of the Tides Full",
  breakdownName: "Flute Chanting a Thousand Waves",
  tags: [MYSTIC.area],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.fluteOfTheTidesFull,
  // Cast length to the earliest next input and hit frames: in-game
  // animation, 2026-09-24.
  castFrames: 198,
  triggerable: true,
  // In-game values as of 2026-09-28: a stationary cast, 40 m engagement range.
  reachMeters: 40,
  approach: "stationary",
  triggersBuffs: [BUFF.fluteArrival],
  hits: [
    hit(0, {
      frame: 78,
      physMultiplier: 1.47645,
      attributeMultiplier: 2.214675,
      physFixed: 320.97,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.fluteRipple })],
    }),
    hit(1, {
      frame: 192,
      physMultiplier: 3.93721,
      attributeMultiplier: 5.905815,
      physFixed: 855.92,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
