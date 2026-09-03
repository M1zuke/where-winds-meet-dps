import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordChargeStage15Hit = defineSkill({
  id: SKILL.swordChargeStage15Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 5-Hit",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage15Hit,
  castFrames: 156,
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
      frame: 31,
      physMultiplier: 0.268616,
      attributeMultiplier: 0.402924,
      physFixed: 74.4,
      attributeFixed: 40.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(2, {
      frame: 62,
      physMultiplier: 0.268616,
      attributeMultiplier: 0.402924,
      physFixed: 74.4,
      attributeFixed: 40.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(3, {
      frame: 93,
      physMultiplier: 0.268616,
      attributeMultiplier: 0.402924,
      physFixed: 74.4,
      attributeFixed: 40.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(4, {
      frame: 124,
      physMultiplier: 0.67154,
      attributeMultiplier: 1.00731,
      physFixed: 186,
      attributeFixed: 101.25,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
})
