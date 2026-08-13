import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordMartialQqq = defineSkill({
  id: SKILL.swordMartialQqq,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQQ",
  tags: [WEAPON.sword, ATTUNE.swordQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQQ,
  castFrames: 55,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [
        applyDot({ id: "tg-sword-martial-qqq-bleed-h0", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-sword-martial-qqq-detonate-h0", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
    hit(1, {
      frame: 15,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [
        applyDot({ id: "tg-sword-martial-qqq-bleed-h1", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-sword-martial-qqq-detonate-h1", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
})
