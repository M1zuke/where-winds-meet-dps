import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const hengHeavyAttack4 = defineSkill({
  id: SKILL.hengHeavyAttack4,
  classId: "stonesplitStrength",
  name: "Heng Blade - Heavy Attack (4th Stage)",
  breakdownName: "Heng Blade - Heavy Attack",
  tags: [WEAPON.hengBlade, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengHeavyAttack4,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 54,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 28,
      physMultiplier: 0.708239,
      attributeMultiplier: 1.062359,
      physFixed: 196,
      attributeFixed: 106.75,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
