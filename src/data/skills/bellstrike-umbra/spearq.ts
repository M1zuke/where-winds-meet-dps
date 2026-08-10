import { defineSkill, hit } from "../define"
import { applyBuff } from "../triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"

export const spearq = defineSkill({
  id: SKILL.spearq,
  classId: "bellstrikeUmbra",
  name: "SpearQ",
  tags: [WEAPON.spear, ATTUNE.spearQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ,
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
      triggers: [applyBuff({ id: "tg-spearq-river-flow-h4", target: STATUS.riverFlow })],
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
