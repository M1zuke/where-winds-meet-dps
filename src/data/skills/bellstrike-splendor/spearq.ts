import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const spearq = defineSkill({
  id: SKILL.spearq,
  classId: "bellstrikeSplendor",
  name: "SpearQ",
  breakdownName: "Qiankun's Lock",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ,
  triggersBuffs: [BUFF.jadeware, BUFF.endlessGale, BUFF.mountainsMight],
  castFrames: 42,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5732,
      attributeMultiplier: 0.8598,
      physFixed: 133,
      attributeFixed: 74,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
