import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordspecial3Hit = defineSkill({
  id: SKILL.swordspecial3Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 3-Hit",
  breakdownName: "Inner Balance Strike III",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial3Hit,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.21806666666666666,
      attributeMultiplier: 0.3271,
      physFixed: 50.333333333333336,
      attributeFixed: 28.333333333333332,
      triggers: [
        applyDot({ id: "tg-swordspecial-3-hit-bleed-h0", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-3-hit-detonate-h0", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    hit(1, {
      frame: 20,
      physMultiplier: 0.21806666666666666,
      attributeMultiplier: 0.3271,
      physFixed: 50.333333333333336,
      attributeFixed: 28.333333333333332,
      triggers: [
        applyDot({ id: "tg-swordspecial-3-hit-bleed-h1", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-3-hit-detonate-h1", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    hit(2, {
      frame: 40,
      physMultiplier: 0.21806666666666666,
      attributeMultiplier: 0.3271,
      physFixed: 50.333333333333336,
      attributeFixed: 28.333333333333332,
      triggers: [
        applyDot({ id: "tg-swordspecial-3-hit-bleed-h2", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-3-hit-detonate-h2", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
