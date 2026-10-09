import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const hengLightAttack4 = defineSkill({
  id: SKILL.hengLightAttack4,
  classId: "stonesplitStrength",
  name: "Heng Blade - Light Attack (4th Stage)",
  breakdownName: "Heng Blade - Light Attack",
  tags: [WEAPON.hengBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengLightAttack4,
  receives: [BUFF.swallowcallLightAttackBoost, ...SNOWPARTING_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 57,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 11,
      physMultiplier: 0.292547,
      attributeMultiplier: 0.43882,
      physFixed: 81,
      attributeFixed: 44.16,
    }),
    hit(1, {
      frame: 38,
      physMultiplier: 0.560715,
      attributeMultiplier: 0.841072,
      physFixed: 155.25,
      attributeFixed: 84.64,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
