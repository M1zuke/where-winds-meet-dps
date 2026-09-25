import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// The lift that opens Spring Away, triggered alongside its frame-20 bullet.
// No attunement, no crit term, no non-player factor. In-game values as of
// 2026-09-24.
export const umblightchargeLift = defineSkill({
  id: SKILL.umblightchargeLift,
  classId: "silkbindJade",
  name: "UmbLightCharge (Lift)",
  breakdownName: "UmbLightCharge",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbLightChargeLift,
  receives: [
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.304656,
      attributeMultiplier: 0.456984,
      physFixed: 84.4,
      attributeFixed: 46.0,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})
