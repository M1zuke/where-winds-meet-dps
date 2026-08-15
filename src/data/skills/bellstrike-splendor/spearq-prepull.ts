import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// Cast before the pull, so it lands no damage of its own — it is in the
// rotation for the Endless Gale window and the Qi Imbalance it applies.
export const spearqPrepull = defineSkill({
  id: SKILL.spearqPrepull,
  classId: "bellstrikeSplendor",
  name: "SpearQ Prepull",
  breakdownName: "Qiankun's Lock (prepull)",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQPrepull,
  triggersBuffs: [BUFF.endlessGale, BUFF.mountainsMight, BUFF.qiImbalance],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
