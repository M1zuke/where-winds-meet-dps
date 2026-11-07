import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const hengHeavyAttack1 = defineSkill({
  id: SKILL.hengHeavyAttack1,
  classId: "stonesplitStrength",
  name: "Heng Blade - Heavy Attack (1st Stage)",
  breakdownName: "Heng Blade - Heavy Attack",
  tags: [WEAPON.hengBlade, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengHeavyAttack1,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 33,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 21,
      physMultiplier: 0.404708,
      attributeMultiplier: 0.607062,
      physFixed: 112,
      attributeFixed: 61,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
