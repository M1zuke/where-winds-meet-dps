import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { UMBRELLA_HEAVY_CHAIN_RECEIVES } from "./receives"

export const HEAVY_ATTACK_FIRST_HIT = {
  physMultiplier: 0.539718,
  attributeMultiplier: 0.809577,
  physFixed: 149.4,
  attributeFixed: 81.4,
}

// In-game values as of 2026-10-12: the four-stage heavy chain, one module per
// stage. The first stage's cast length starts at the release.
export const heavyAttack1 = defineSkill({
  id: SKILL.heavyAttack1,
  classId: "bamboocutDust",
  name: "Umbrella - Heavy Attack (1st stage)",
  breakdownName: "Umbrella - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustHeavyAttack1,
  receives: UMBRELLA_HEAVY_CHAIN_RECEIVES,
  castFrames: 28,
  triggerable: false,
  hits: [hit(0, { frame: 6, ...HEAVY_ATTACK_FIRST_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
