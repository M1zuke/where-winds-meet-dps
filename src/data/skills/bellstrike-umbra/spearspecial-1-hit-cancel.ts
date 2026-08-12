import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDot, castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF, STATUS } from "./ids"

export const spearspecial1HitCancel = defineSkill({
  id: SKILL.spearspecial1HitCancel,
  classId: "bellstrikeUmbra",
  name: "Spear Special (1 Hit Cancel)",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial1HitCancel,
  castFrames: 59,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 25,
      physMultiplier: 0.8561,
      attributeMultiplier: 1.28415,
      physFixed: 237,
      attributeFixed: 129,
      triggers: [
        applyDot({
          id: "tg-spearspecial-1-hit-cancel-bleed-1-h0",
          target: DEBUFF.bleedTick,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        applyDot({
          id: "tg-spearspecial-1-hit-cancel-bleed-2-h0",
          target: DEBUFF.bleedTick,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        applyDot({
          id: "tg-spearspecial-1-hit-cancel-bleed-3-h0",
          target: DEBUFF.bleedTick,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        castSkill({
          id: "tg-spearspecial-1-hit-cancel-detonation-h0",
          target: SKILL.bleedDetonation,
          stacks: 0,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
        applyBuff({
          id: "tg-spearspecial-1-hit-cancel-cooldown-h0",
          target: STATUS.spearSpecialCooldown,
          condition: { buffId: STATUS.riverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: STATUS.spearSpecialCooldown, op: "eq", stacks: 0 }],
        }),
      ],
      variants: [
        {
          id: "hv-spearspecial-1-hit-cancel-river-flow",
          label: "River Flow",
          conditions: [{ buffId: STATUS.riverFlow, op: "gte", stacks: 1 }],
          physMultiplier: 1.02732,
          attributeMultiplier: 1.54096,
          physFixed: 284.4,
          attributeFixed: 154.8,
        },
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
})
