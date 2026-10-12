import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

const SWEEP_HIT = {
  physMultiplier: 0.3238308,
  attributeMultiplier: 0.4857462,
  physFixed: 89.64,
  attributeFixed: 48.84,
}

// In-game values as of 2026-10-12: three hits from one collider, at least
// 0.1 s apart — the 2nd and 3rd hit frames are provisional, not measurable.
export const heavyAttack3 = defineSkill({
  id: SKILL.heavyAttack3,
  classId: "bamboocutDust",
  name: "Umbrella - Heavy Attack (3rd stage)",
  breakdownName: "Umbrella - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustHeavyAttack3,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 81,
  triggerable: false,
  hits: [
    hit(0, { frame: 11, ...SWEEP_HIT }),
    hit(1, { frame: 17, ...SWEEP_HIT }),
    hit(2, { frame: 23, ...SWEEP_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
