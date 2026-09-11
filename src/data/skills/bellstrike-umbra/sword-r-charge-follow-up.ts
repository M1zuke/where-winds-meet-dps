import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

export const swordRChargeFollowUp = defineSkill({
  id: SKILL.swordRChargeFollowUp,
  classId: "bellstrikeUmbra",
  name: "Sword R Charge - Follow Up",
  breakdownName: "Crisscross - Second Track",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordRChargeFollowUp,
  receives: STRATEGIC_SWORD_RECEIVES,
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 86,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.325601,
      attributeMultiplier: 0.488401,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
    }),
    hit(1, {
      frame: 41,
      physMultiplier: 0.488401,
      attributeMultiplier: 0.732602,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyDot({ target: DEBUFF.bleedTick }), detonateDot({ target: DEBUFF.bleedTick, stacks: 0 })],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
