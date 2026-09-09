import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordRChargeFollowUp1HitCancel = defineSkill({
  id: SKILL.swordRChargeFollowUp1HitCancel,
  classId: "bellstrikeUmbra",
  name: "Sword R Charge - Follow Up 1-Hit[cancel]",
  breakdownName: "Crisscross - Second Track",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordRChargeFollowUp1HitCancel,
  // A cancel form ends where the animation opens its interrupt window — 33 frames in (in-game animation, 2026-09-09); the parry that ends it is the next rotation step.
  castFrames: 33,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.325601,
      attributeMultiplier: 0.488401,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyDot({ target: DEBUFF.bleedTick }),
        detonateDot({
          target: DEBUFF.bleedTick,
          stacks: 0,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
