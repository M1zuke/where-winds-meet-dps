import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const hengHeavyAttack2 = defineSkill({
  id: SKILL.hengHeavyAttack2,
  classId: "stonesplitStrength",
  name: "Heng Blade - Heavy Attack (2nd Stage)",
  breakdownName: "Heng Blade - Heavy Attack",
  tags: [WEAPON.hengBlade, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengHeavyAttack2,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 43,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 11,
      physMultiplier: 0.202354,
      attributeMultiplier: 0.303531,
      physFixed: 56,
      attributeFixed: 30.5,
    }),
    hit(1, {
      frame: 28,
      physMultiplier: 0.303531,
      attributeMultiplier: 0.455297,
      physFixed: 84,
      attributeFixed: 45.75,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
