import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-11-10: the floating umbrella leaves 9.06 f into the
// cast and the next input follows at 60 f.
export const returnOfSpring = defineSkill({
  id: SKILL.returnOfSpring,
  classId: "silkbindJade",
  name: "Return of Spring",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.returnOfSpring,
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  castFrames: 60,
  triggerable: true,
  reachMeters: 100,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 9.06,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-11-10T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
