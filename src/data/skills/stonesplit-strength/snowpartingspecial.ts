import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"

export const snowpartingspecial = defineSkill({
  id: SKILL.snowpartingspecial,
  classId: "stonesplitStrength",
  name: "SnowpartingSpecial",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSpecial,
  triggersBuffs: [BUFF.innerPassion, BUFF.jadeware],
  castFrames: 125,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(1, {
      frame: 13,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(2, {
      frame: 26,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(3, {
      frame: 39,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(4, {
      frame: 52,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(5, {
      frame: 65,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(6, {
      frame: 78,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(7, {
      frame: 91,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
    }),
    hit(8, {
      frame: 104,
      physMultiplier: 0.4199666667,
      attributeMultiplier: 0.6299555556,
      physFixed: 116.111111111111,
      attributeFixed: 63.33333333333,
      triggers: [applyBuff({ target: STATUS.dread })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
