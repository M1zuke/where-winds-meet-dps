import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"
import { BUFF } from "../buffs/ids"

export const fluteOfTheTidesCancel = defineSkill({
  id: SKILL.fluteOfTheTidesCancel,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Flute of the Tides Cancel",
  breakdownName: "Flute Chanting a Thousand Waves",
  tags: [MYSTIC.areaDamage],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.fluteOfTheTidesCancel,
  castFrames: 81,
  triggerable: true,
  // In-game values as of 2026-09-28: a stationary cast, 40 m engagement range.
  reachMeters: 40,
  approach: "stationary",
  triggersBuffs: [BUFF.fluteArrival],
  hits: [
    hit(0, {
      // Ripple start: in-game animation, 2026-09-24.
      frame: 78,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.fluteRipple })],
    }),
    // In-game values as of 2026-09-24: the first melodic strike lands before the cancel.
    hit(1, {
      frame: 78,
      physMultiplier: 1.47645,
      attributeMultiplier: 2.214675,
      physFixed: 320.97,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
