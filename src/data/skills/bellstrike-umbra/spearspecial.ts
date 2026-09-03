import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff, applyDot, castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { SPEAR_SPECIAL_COOLDOWN_BUFF_ID } from "../../innerWays/wolfchasersArtGates"

export const spearspecial = defineSkill({
  id: SKILL.spearspecial,
  classId: "bellstrikeUmbra",
  name: "Spear Special",
  breakdownName: "Sweep All",
  tags: [WEAPON.spear, ATTACK.heavy, ATTUNE.spearSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearSpecial,
  receives: [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff],
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 25,
      physMultiplier: 1.712176,
      attributeMultiplier: 2.568264,
      physFixed: 474.4,
      attributeFixed: 258.4,
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
          id: "hv-spearspecial-river-flow",
          label: "River Flow",
          conditions: [{ buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 }],
          physMultiplier: 2.568264,
          attributeMultiplier: 3.852396,
          physFixed: 711.6,
          attributeFixed: 387.6,
        },
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
})
