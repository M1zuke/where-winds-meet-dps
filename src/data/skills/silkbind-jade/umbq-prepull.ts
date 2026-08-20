import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const umbqPrepull = defineSkill({
  id: SKILL.umbqPrepull,
  classId: "silkbindJade",
  name: "UmbQ Prepull",
  tags: [PROP.isMartialSkillQ, PROP.hasQiBreakPhysPen, WEAPON.umbrella, ATTUNE.umbQ, ROLE.umbQ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbQPrepull,
  receives: [BUFF.combo, BUFF.windWall, BUFF.trajectorySkill],
  triggersBuffs: [BUFF.jadeware, BUFF.combo, BUFF.comboUmbLightBonus, BUFF.springThunder],
  castFrames: 18,
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
