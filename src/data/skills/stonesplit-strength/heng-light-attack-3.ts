import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

const TENTH_OF_ROW = {
  physMultiplier: 0.243789,
  attributeMultiplier: 0.365684,
  physFixed: 67.5,
  attributeFixed: 36.8,
}

// In-game values as of 2026-10-06.
export const hengLightAttack3 = defineSkill({
  id: SKILL.hengLightAttack3,
  classId: "stonesplitStrength",
  name: "Heng Blade - Light Attack (3rd Stage)",
  breakdownName: "Heng Blade - Light Attack",
  tags: [WEAPON.hengBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengLightAttack3,
  receives: [BUFF.swallowcallLightAttackBoost, ...SNOWPARTING_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 66,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, { frame: 19, ...TENTH_OF_ROW }),
    hit(1, { frame: 32, ...TENTH_OF_ROW }),
    hit(2, {
      frame: 55,
      physMultiplier: 0.365684,
      attributeMultiplier: 0.548525,
      physFixed: 101.25,
      attributeFixed: 55.2,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
