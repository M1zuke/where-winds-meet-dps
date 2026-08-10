import { defineSkill, hit } from "../define"
import { applyBuff, applyDot, castSkill } from "../triggers"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF, STATUS } from "./ids"

export const spearspecial = defineSkill({
  id: SKILL.spearspecial,
  classId: "bellstrikeUmbra",
  name: "Spear Special",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 25,
      physMultiplier: 1.7122,
      attributeMultiplier: 2.5683,
      physFixed: 474,
      attributeFixed: 258,
      triggers: [
        applyDot({
          id: "tg-spearspecial-bleed-1-h0",
          target: DEBUFF.bleedTick,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        applyDot({
          id: "tg-spearspecial-bleed-2-h0",
          target: DEBUFF.bleedTick,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        applyDot({
          id: "tg-spearspecial-bleed-3-h0",
          target: DEBUFF.bleedTick,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        castSkill({
          id: "tg-spearspecial-detonation-h0",
          target: SKILL.bleedDetonation,
          stacks: 0,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        applyBuff({
          id: "tg-spearspecial-cooldown-h0",
          target: STATUS.spearSpecialCooldown,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
      ],
      variants: [
        {
          id: "hv-spearspecial-river-flow",
          label: "River Flow",
          conditions: [{ buffId: STATUS.riverFlow, op: "gte", stacks: 1 }],
          physMultiplier: 2.5683,
          attributeMultiplier: 3.8524,
          physFixed: 711,
          attributeFixed: 387,
        },
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
})
