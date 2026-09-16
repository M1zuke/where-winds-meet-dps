import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"

export const swordq = defineSkill({
  id: SKILL.swordq,
  classId: "bellstrikeSplendor",
  name: "SwordQ",
  breakdownName: "Daunting Strike",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordQ,
  triggersBuffs: [BUFF.jadeware, BUFF.mountainsMightQiImbalance],
  receives: NAMELESS_SWORD_RECEIVES,
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
