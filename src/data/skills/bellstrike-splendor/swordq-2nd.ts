import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const swordq2nd = defineSkill({
  id: SKILL.swordq2nd,
  classId: "bellstrikeSplendor",
  name: "SwordQ[2nd]",
  breakdownName: "Flying Sword (2nd)",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordQ2nd,
  triggersBuffs: [BUFF.qiImbalance],
  castFrames: 26,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.0253,
      attributeMultiplier: 1.538,
      physFixed: 179,
      attributeFixed: 103,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
