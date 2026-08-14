import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const snowpartingchargedForgetfulness = defineSkill({
  id: SKILL.snowpartingchargedForgetfulness,
  classId: "stonesplitStrength",
  name: "SnowpartingCharged[Forgetfulness]",
  tags: [PROP.isCharged, WEAPON.hengBlade, ATTACK.charge, ATTUNE.snowpartingCharged],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingChargedForgetfulness,
  triggersBuffs: [BUFF.forgetfulness],
  castFrames: 57,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.3333,
      attributeFixed: 73.6667,
    }),
    hit(1, {
      frame: 14,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.3333,
      attributeFixed: 73.6667,
    }),
    hit(2, {
      frame: 28,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.3333,
      attributeFixed: 73.6667,
    }),
    hit(3, {
      frame: 42,
      physMultiplier: 0.9798,
      attributeMultiplier: 1.4697,
      physFixed: 271,
      attributeFixed: 147,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
