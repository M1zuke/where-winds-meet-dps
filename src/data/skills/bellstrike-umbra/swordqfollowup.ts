import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordqfollowup = defineSkill({
  id: SKILL.swordqfollowup,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQ",
  breakdownName: "Inner Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQ,
  castFrames: 66,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordqfollowup-bleed-h0", target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 16,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordqfollowup-bleed-h1", target: DEBUFF.bleedTick })],
    }),
    hit(2, {
      frame: 32,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordqfollowup-bleed-h2", target: DEBUFF.bleedTick })],
    }),
    hit(3, {
      frame: 48,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordqfollowup-bleed-h3", target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
