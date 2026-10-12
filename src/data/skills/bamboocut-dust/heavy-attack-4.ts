import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { HEAVY_ATTACK_FIRST_HIT } from "./heavy-attack-1"
import { SKILL } from "./ids"
import { UMBRELLA_HEAVY_CHAIN_RECEIVES } from "./receives"

export const heavyAttack4 = defineSkill({
  id: SKILL.heavyAttack4,
  classId: "bamboocutDust",
  name: "Umbrella - Heavy Attack (4th stage)",
  breakdownName: "Umbrella - Heavy Attack",
  tags: [WEAPON.umbrella, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustHeavyAttack4,
  receives: UMBRELLA_HEAVY_CHAIN_RECEIVES,
  castFrames: 34,
  triggerable: false,
  hits: [hit(0, { frame: 12, ...HEAVY_ATTACK_FIRST_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
