import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff, applyDot, castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { SPEAR_SPECIAL_COOLDOWN_BUFF_ID } from "../../innerWays/wolfchasersArtGates"

export const spearspecial1HitCancel = defineSkill({
  id: SKILL.spearspecial1HitCancel,
  classId: "bellstrikeUmbra",
  name: "Spear Special (1 Hit Cancel)",
  breakdownName: "Sweep All",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial1HitCancel,
  receives: [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff],
  castFrames: 59,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 25,
      physMultiplier: 0.6848704,
      attributeMultiplier: 1.0273056,
      physFixed: 189.76,
      attributeFixed: 103.36,
      triggers: [
        applyDot({
          target: DEBUFF.bleedTick,
          condition: { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }],
        }),
        applyDot({
          target: DEBUFF.bleedTick,
          condition: { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }],
        }),
        applyDot({
          target: DEBUFF.bleedTick,
          condition: { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }],
        }),
        castSkill({
          target: SKILL.bleedDetonation,
          stacks: 0,
          condition: { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }],
        }),
        applyDebuff({
          target: DEBUFF.defenseDown,
          condition: { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }],
        }),
        applyBuff({
          target: SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
          condition: { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 },
          conditions: [{ buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }],
        }),
      ],
      variants: [
        {
          id: "hv-spearspecial-1-hit-cancel-river-flow",
          label: "River Flow",
          conditions: [{ buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 }],
          physMultiplier: 1.0273056,
          attributeMultiplier: 1.5409584,
          physFixed: 284.64,
          attributeFixed: 155.04,
        },
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
})
