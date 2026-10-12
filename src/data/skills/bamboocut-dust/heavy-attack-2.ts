import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

export const heavyAttack2 = defineSkill({
  id: SKILL.heavyAttack2,
  classId: "bamboocutDust",
  name: "Umbrella - Heavy Attack (2nd stage)",
  breakdownName: "Umbrella - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustHeavyAttack2,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 63,
  triggerable: false,
  hits: [
    hit(0, {
      frame: 8,
      physMultiplier: 0.269859,
      attributeMultiplier: 0.4047885,
      physFixed: 74.7,
      attributeFixed: 40.7,
    }),
    hit(1, {
      frame: 37,
      physMultiplier: 0.4047885,
      attributeMultiplier: 0.60718275,
      physFixed: 112.05,
      attributeFixed: 61.05,
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
