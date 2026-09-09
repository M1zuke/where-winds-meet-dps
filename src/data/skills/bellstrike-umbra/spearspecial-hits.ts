import { hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff, applyDot, castSkill } from "../../../definitions/skills/triggers"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { SPEAR_SPECIAL_COOLDOWN_BUFF_ID } from "../../innerWays/wolfchasersArtGates"
import type { SkillHit } from "../../../engine/skill"

const RIVER_FLOW_CONDITION = { buffId: BUFF.potentRiverFlow, op: "gte" as const, stacks: 1 }
const COOLDOWN_CONDITION = { buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq" as const, stacks: 0 }

function payloadTriggers() {
  return [
    applyDot({ target: DEBUFF.bleedTick, condition: RIVER_FLOW_CONDITION, conditions: [COOLDOWN_CONDITION] }),
    applyDot({ target: DEBUFF.bleedTick, condition: RIVER_FLOW_CONDITION, conditions: [COOLDOWN_CONDITION] }),
    applyDot({ target: DEBUFF.bleedTick, condition: RIVER_FLOW_CONDITION, conditions: [COOLDOWN_CONDITION] }),
    castSkill({
      target: SKILL.bleedDetonation,
      stacks: 0,
      condition: RIVER_FLOW_CONDITION,
      conditions: [COOLDOWN_CONDITION],
    }),
    applyDebuff({ target: DEBUFF.defenseDown, condition: RIVER_FLOW_CONDITION, conditions: [COOLDOWN_CONDITION] }),
    applyBuff({
      target: SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
      condition: RIVER_FLOW_CONDITION,
      conditions: [COOLDOWN_CONDITION],
    }),
  ]
}

// Two hits, 42 frames apart: in-game animation, 2026-09-09. The whole skill's
// coefficients split 0.40 / 0.60 across them. Both hits carry the same payload
// triggers; the cooldown buff hit 1 sets blocks hit 2's own attempt from firing again.
export const SPEARSPECIAL_HITS: SkillHit[] = [
  hit(0, {
    frame: 16,
    physMultiplier: 0.6848704,
    attributeMultiplier: 1.0273056,
    physFixed: 189.76,
    attributeFixed: 103.36,
    triggers: payloadTriggers(),
    variants: [
      {
        id: "hv-spearspecial-hit-1-river-flow",
        label: "River Flow",
        conditions: [{ buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 }],
        physMultiplier: 1.0273056,
        attributeMultiplier: 1.5409584,
        physFixed: 284.64,
        attributeFixed: 155.04,
      },
    ],
  }),
  hit(1, {
    frame: 58,
    physMultiplier: 1.0273056,
    attributeMultiplier: 1.5409584,
    physFixed: 284.64,
    attributeFixed: 155.04,
    triggers: payloadTriggers(),
    variants: [
      {
        id: "hv-spearspecial-hit-2-river-flow",
        label: "River Flow",
        conditions: [{ buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 }],
        physMultiplier: 1.5409584,
        attributeMultiplier: 2.3114376,
        physFixed: 426.96,
        attributeFixed: 232.56,
      },
    ],
  }),
]
