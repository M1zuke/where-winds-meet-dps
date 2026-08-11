import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordqFollowUp2HitCancel = defineSkill({
  id: SKILL.swordqFollowUp2HitCancel,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQ 2-Hit[Cancel]",
  tags: [WEAPON.sword, ATTUNE.swordQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQ2HitCancel,
  castFrames: 30,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordq-follow-up-2-hit-cancel-bleed-h0", target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 15,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordq-follow-up-2-hit-cancel-bleed-h1", target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
