import { defineSkill, hit } from "../define"
import { applyDot } from "../triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordqFollowUp1HitCancel = defineSkill({
  id: SKILL.swordqFollowUp1HitCancel,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQ 1-Hit [Cancel]",
  tags: [WEAPON.sword, ATTUNE.swordQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQ1HitCancel,
  castFrames: 18,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordq-follow-up-1-hit-cancel-bleed", target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
