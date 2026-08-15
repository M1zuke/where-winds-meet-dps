import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"

export const spearq = defineSkill({
  id: SKILL.spearq,
  classId: "bellstrikeUmbra",
  name: "SpearQ",
  breakdownName: "Sober Sorrow",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ,
  triggersBuffs: [BUFF.potentRiverFlow, BUFF.wineGu, BUFF.soulShaken, BUFF.jadeware],
  castFrames: 120,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.3566833333333333,
      attributeMultiplier: 0.5350166666666667,
      physFixed: 98,
      attributeFixed: 53.333333333333336,
    }),
    hit(1, {
      frame: 20,
      physMultiplier: 0.3566833333333333,
      attributeMultiplier: 0.5350166666666667,
      physFixed: 98,
      attributeFixed: 53.333333333333336,
    }),
    hit(2, {
      frame: 40,
      physMultiplier: 0.3566833333333333,
      attributeMultiplier: 0.5350166666666667,
      physFixed: 98,
      attributeFixed: 53.333333333333336,
    }),
    hit(3, {
      frame: 60,
      physMultiplier: 0.3566833333333333,
      attributeMultiplier: 0.5350166666666667,
      physFixed: 98,
      attributeFixed: 53.333333333333336,
    }),
    hit(4, {
      frame: 80,
      physMultiplier: 0.3566833333333333,
      attributeMultiplier: 0.5350166666666667,
      physFixed: 98,
      attributeFixed: 53.333333333333336,
      triggers: [applyBuff({ target: STATUS.riverFlow })],
    }),
    hit(5, {
      frame: 100,
      physMultiplier: 0.3566833333333333,
      attributeMultiplier: 0.5350166666666667,
      physFixed: 98,
      attributeFixed: 53.333333333333336,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
