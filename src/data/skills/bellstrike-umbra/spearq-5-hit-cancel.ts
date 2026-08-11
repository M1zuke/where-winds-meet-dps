import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"

export const spearq5HitCancel = defineSkill({
  id: SKILL.spearq5HitCancel,
  classId: "bellstrikeUmbra",
  name: "SpearQ 5-Hit Cancel",
  tags: [WEAPON.spear, ATTUNE.spearQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ5HitCancel,
  castFrames: 85,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, physMultiplier: 0.321, attributeMultiplier: 0.4814, physFixed: 74, attributeFixed: 41 }),
    hit(1, { frame: 21, physMultiplier: 0.321, attributeMultiplier: 0.4814, physFixed: 74, attributeFixed: 41 }),
    hit(2, { frame: 42, physMultiplier: 0.321, attributeMultiplier: 0.4814, physFixed: 74, attributeFixed: 41 }),
    hit(3, { frame: 63, physMultiplier: 0.321, attributeMultiplier: 0.4814, physFixed: 74, attributeFixed: 41 }),
    hit(4, {
      frame: 84,
      physMultiplier: 0.321,
      attributeMultiplier: 0.4814,
      physFixed: 74,
      attributeFixed: 41,
      triggers: [applyBuff({ id: "tg-spearq-5-hit-cancel-river-flow-h4", target: STATUS.riverFlow })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
