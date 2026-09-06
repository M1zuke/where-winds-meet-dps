import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"
import { BUFF } from "../buffs/ids"

export const peakfallPrepull = defineSkill({
  id: SKILL.peakfallPrepull,
  classId: "bamboocutDraught",
  name: "Gauntlet Q Prepull",
  breakdownName: "Peakfall",
  tags: [WEAPON.gauntlets, ATTUNE.gauntletsMartialArt, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.peakfallPrepull,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.nonPlayerBaseDamage40],
  triggersBuffs: [BUFF.jadeware],
  prePull: true,
  triggerable: false,
  castFrames: 0,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.91934,
      attributeMultiplier: 1.37901,
      physFixed: 255,
      attributeFixed: 139,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
