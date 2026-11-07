import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06: the tap, starting 6 frames after the press.
export const hengLightAttack1 = defineSkill({
  id: SKILL.hengLightAttack1,
  classId: "stonesplitStrength",
  name: "Heng Blade - Light Attack (1st Stage)",
  breakdownName: "Heng Blade - Light Attack",
  tags: [WEAPON.hengBlade, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengLightAttack1,
  receives: [BUFF.swallowcallLightAttackBoost, ...SNOWPARTING_BLADE_RECEIVES],
  triggersBuffs: [],
  castFrames: 24,
  triggerable: true,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 17,
      physMultiplier: 0.365684,
      attributeMultiplier: 0.548525,
      physFixed: 101.25,
      attributeFixed: 55.2,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
