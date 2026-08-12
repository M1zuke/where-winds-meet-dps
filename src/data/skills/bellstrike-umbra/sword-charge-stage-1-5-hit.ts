import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordChargeStage15Hit = defineSkill({
  id: SKILL.swordChargeStage15Hit,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, 5-Hit",
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
      physMultiplier: 0.37606,
      attributeMultiplier: 0.5641,
      physFixed: 104,
      attributeFixed: 56.6,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-5-hit-bleed-h0", target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 31,
      physMultiplier: 0.37606,
      attributeMultiplier: 0.5641,
      physFixed: 104,
      attributeFixed: 56.6,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-5-hit-bleed-h1", target: DEBUFF.bleedTick })],
    }),
    hit(2, {
      frame: 62,
      physMultiplier: 0.37606,
      attributeMultiplier: 0.5641,
      physFixed: 104,
      attributeFixed: 56.6,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-5-hit-bleed-h2", target: DEBUFF.bleedTick })],
    }),
    hit(3, {
      frame: 93,
      physMultiplier: 0.37606,
      attributeMultiplier: 0.5641,
      physFixed: 104,
      attributeFixed: 56.6,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-5-hit-bleed-h3", target: DEBUFF.bleedTick })],
    }),
    hit(4, {
      frame: 124,
      physMultiplier: 0.37606,
      attributeMultiplier: 0.5641,
      physFixed: 104,
      attributeFixed: 56.6,
      triggers: [applyDot({ id: "tg-sword-charge-stage-1-5-hit-bleed-h4", target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
