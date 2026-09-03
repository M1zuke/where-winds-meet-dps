import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordChargeStage14Hit = defineSkill({
  id: SKILL.swordChargeStage14Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 4-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage14Hit,
  castFrames: 88,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.402924,
      attributeMultiplier: 0.604386,
      physFixed: 111.6,
      attributeFixed: 60.75,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 22,
      physMultiplier: 0.268616,
      attributeMultiplier: 0.402924,
      physFixed: 74.4,
      attributeFixed: 40.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(2, {
      frame: 44,
      physMultiplier: 0.268616,
      attributeMultiplier: 0.402924,
      physFixed: 74.4,
      attributeFixed: 40.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(3, {
      frame: 66,
      physMultiplier: 0.268616,
      attributeMultiplier: 0.402924,
      physFixed: 74.4,
      attributeFixed: 40.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
})
