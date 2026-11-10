import { hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff, applyDot, castSkill, meterDelta } from "../../../definitions/skills/triggers"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import {
  EMPOWERED_RIVER_FLOW_BUFF_ID,
  SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
  SPEAR_SPECIAL_COOLDOWN_FRAMES,
  SPRING_SURGE_BUFF_ID,
} from "../../innerWays/wolfchasersArtGates"
import { enduranceMeter } from "../../resources/enduranceMeter"
import type { SkillHit } from "../../../engine/skill"
import { LEVEL_ROWS } from "./levelRows"

const SPRING_SURGE_OR_HIGHER = { buffId: SPRING_SURGE_BUFF_ID, op: "gte" as const, stacks: 1 }
const RIVER_FLOW_CONDITION = { buffId: BUFF.potentRiverFlow, op: "gte" as const, stacks: 1 }
const EMPOWERED_CONDITION = { buffId: EMPOWERED_RIVER_FLOW_BUFF_ID, op: "gte" as const, stacks: 1 }
const COOLDOWN_CONDITION = { buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq" as const, stacks: 0 }

// In-game values as of 2026-09-28: Wolfchaser's Art tiers 4-6 grant +20
// Endurance alongside the hidden Blood Burst, on the same Empowered River
// Flow gate — the gate's own `requiresParam` on `EMPOWERED_RIVER_FLOW_BUFF_ID`
// already restricts this to those tiers. A `meterDelta` trigger's own
// condition resolves when its deferred gain is applied, not inline against
// this hit's other triggers, so it keeps its own native cooldown rather than
// racing the status-marker cooldown below — cooldownGroup so a Sword Horizon
// hit-1/hit-2 pair still shares one clock.
function wolfchasersArtEnduranceGain() {
  return meterDelta({
    target: enduranceMeter.id,
    stacks: 20,
    condition: EMPOWERED_CONDITION,
    cooldownFrames: SPEAR_SPECIAL_COOLDOWN_FRAMES,
    cooldownGroup: "wolfchasersArtSweepAllEnduranceGain",
  })
}

// In-game values as of 2026-10-15: one Bleeding stack per River Flow (or
// higher) hit on every cast, no cooldown; the non-clearing Blood Burst and the
// Wolfchaser's Art Endurance gain only under Empowered River Flow, on its
// own 12 s cooldown.
function payloadTriggers() {
  return [
    applyDot({ target: DEBUFF.bleedTick, condition: RIVER_FLOW_CONDITION }),
    castSkill({
      target: SKILL.bleedDetonation,
      stacks: 0,
      condition: EMPOWERED_CONDITION,
      conditions: [COOLDOWN_CONDITION],
    }),
    applyBuff({
      target: SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
      condition: EMPOWERED_CONDITION,
      conditions: [COOLDOWN_CONDITION],
    }),
    wolfchasersArtEnduranceGain(),
  ]
}

// Two damage hits, 42 frames apart: in-game animation, 2026-09-09. Frame 0 is
// a zero-damage hit carrying Shattered Stone, so it lands before hit 1 on
// every Spring Surge (or higher) cast — in-game values as of 2026-09-24.
export const SPEARSPECIAL_HITS: SkillHit[] = [
  hit(0, {
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    triggers: [applyDebuff({ target: DEBUFF.defenseDown, condition: SPRING_SURGE_OR_HIGHER })],
  }),
  hit(1, {
    frame: 16,
    ...levelScaled(LEVEL_ROWS.spearspecial1HitCancelHit1),
    triggers: payloadTriggers(),
    // River Flow before Spring Surge: `selectHitVariant` takes the first
    // variant whose conditions are met, and both are true once River Flow
    // (or Empowered) is reached — see the layering note above. Both land 2 f
    // later than the plain form's own hit 1: in-game animation, 2026-09-24.
    variants: [
      {
        id: "hv-spearspecial-hit-1-river-flow",
        label: "River Flow",
        conditions: [RIVER_FLOW_CONDITION],
        ...levelScaled(LEVEL_ROWS.spearspecial1HitCancelHit1RiverFlow),
        frame: 18,
      },
      {
        id: "hv-spearspecial-hit-1-spring-surge",
        label: "Spring Surge",
        conditions: [SPRING_SURGE_OR_HIGHER],
        ...levelScaled(LEVEL_ROWS.spearspecial1HitCancelHit1SpringSurge),
        frame: 18,
      },
    ],
  }),
  hit(2, {
    frame: 58,
    ...levelScaled(LEVEL_ROWS.spearspecial1HitCancelHit1RiverFlow),
    triggers: payloadTriggers(),
    variants: [
      {
        id: "hv-spearspecial-hit-2-river-flow",
        label: "River Flow",
        conditions: [RIVER_FLOW_CONDITION],
        ...levelScaled(LEVEL_ROWS.spearspecialHit2RiverFlow),
      },
      {
        id: "hv-spearspecial-hit-2-spring-surge",
        label: "Spring Surge",
        conditions: [SPRING_SURGE_OR_HIGHER],
        ...levelScaled(LEVEL_ROWS.spearspecialHit2SpringSurge),
      },
    ],
  }),
]
