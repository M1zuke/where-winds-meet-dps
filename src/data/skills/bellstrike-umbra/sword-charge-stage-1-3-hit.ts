import { defineSkill, hit } from "../define"
import { applyDot } from "../triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordChargeStage13Hit = defineSkill({
  id: SKILL.swordChargeStage13Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 3-Hit",
  tags: [WEAPON.sword, ATTUNE.swordCharged],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage13Hit,
  castFrames: 66,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.31338333333333335,
      attributeMultiplier: 0.47008333333333335,
      physFixed: 86.66666666666667,
      attributeFixed: 47.166666666666664,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-3-hit-bleed-h0", target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 22,
      physMultiplier: 0.31338333333333335,
      attributeMultiplier: 0.47008333333333335,
      physFixed: 86.66666666666667,
      attributeFixed: 47.166666666666664,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-3-hit-bleed-h1", target: DEBUFF.bleedTick })],
    }),
    hit(2, {
      frame: 44,
      physMultiplier: 0.31338333333333335,
      attributeMultiplier: 0.47008333333333335,
      physFixed: 86.66666666666667,
      attributeFixed: 47.166666666666664,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-3-hit-bleed-h2", target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-31T00:00:00.000Z",
  updatedAt: "2026-07-31T00:00:00.000Z",
})
