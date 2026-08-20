import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const umbq = defineSkill({
  id: SKILL.umbq,
  classId: "silkbindJade",
  name: "UmbQ",
  tags: [PROP.isMartialSkillQ, PROP.hasQiBreakPhysPen, WEAPON.umbrella, ATTUNE.umbQ, ROLE.umbQ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbQ,
  receives: [BUFF.combo, BUFF.windWall, BUFF.trajectorySkill],
  triggersBuffs: [BUFF.jadeware, BUFF.combo, BUFF.comboUmbLightBonus, BUFF.springThunder],
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.3397,
      attributeMultiplier: 3.5095,
      physFixed: 648,
      attributeFixed: 353,
      extraCritDamage: 1,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
