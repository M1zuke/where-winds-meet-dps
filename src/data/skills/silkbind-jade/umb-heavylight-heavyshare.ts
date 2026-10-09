import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// Umb HeavyLight's opening hit is the heavy attack's own first stage (no
// attunement), triggered alongside Colorful Phoenix's own share so the
// breakdown still reads as one cast. Mistwillow's stances cross-grant — a
// heavy hit receives the buff a light hit grants — so this heavy share reads
// `mistwillowLightBuff`, not the heavy one. In-game values as of 2026-09-24.
export const umbHeavylightHeavyShare = defineSkill({
  id: SKILL.umbHeavylightHeavyShare,
  classId: "silkbindJade",
  name: "Umb HeavyLight (Heavy Share)",
  breakdownName: "Umb HeavyLight",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbHeavyLightHeavyShare,
  receives: [
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.539718,
      attributeMultiplier: 0.809577,
      physFixed: 149.4,
      attributeFixed: 81.4,
      extraCritDamage: 0,
    }),
  ],
  createdAt: "2026-09-25T00:00:00.000Z",
  updatedAt: "2026-09-25T00:00:00.000Z",
})
