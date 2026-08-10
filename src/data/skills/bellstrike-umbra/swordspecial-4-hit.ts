import { defineSkill, hit } from "../define"
import { applyDot, detonateDot } from "../triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordspecial4Hit = defineSkill({
  id: SKILL.swordspecial4Hit,
  classId: "bellstrikeUmbra",
  name: "SwordSpecial 4-Hit",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial4Hit,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.245325,
      attributeMultiplier: 0.367975,
      physFixed: 56.75,
      attributeFixed: 31.75,
      triggers: [
        applyDot({ id: "tg-swordspecial-4-hit-bleed-h0", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-4-hit-detonate-h0", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    hit(1, {
      frame: 15,
      physMultiplier: 0.245325,
      attributeMultiplier: 0.367975,
      physFixed: 56.75,
      attributeFixed: 31.75,
      triggers: [
        applyDot({ id: "tg-swordspecial-4-hit-bleed-h1", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-4-hit-detonate-h1", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    hit(2, {
      frame: 30,
      physMultiplier: 0.245325,
      attributeMultiplier: 0.367975,
      physFixed: 56.75,
      attributeFixed: 31.75,
      triggers: [
        applyDot({ id: "tg-swordspecial-4-hit-bleed-h2", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-4-hit-detonate-h2", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    hit(3, {
      frame: 45,
      physMultiplier: 0.245325,
      attributeMultiplier: 0.367975,
      physFixed: 56.75,
      attributeFixed: 31.75,
      triggers: [
        applyDot({ id: "tg-swordspecial-4-hit-bleed-h3", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-swordspecial-4-hit-detonate-h3", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
