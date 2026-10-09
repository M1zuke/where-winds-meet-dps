import { hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import type { SkillHit } from "../../../engine/skill"
import { DEBUFF } from "./ids"

const STRIKE = {
  physMultiplier: 1.02325,
  attributeMultiplier: 1.534875,
  physFixed: 153.82,
  attributeFixed: 0,
}

const COMBUSTION_EXPLOSION = {
  physMultiplier: 0.70166,
  attributeMultiplier: 1.05249,
  physFixed: 105.48,
  attributeFixed: 0,
}

const SMOLDER_EXPLOSION = {
  physMultiplier: 1.60796,
  attributeMultiplier: 2.41194,
  physFixed: 241.72,
  attributeFixed: 0,
}

const COMBUSTION_ONLY_CONDITIONS = [
  { buffId: DEBUFF.combustion, op: "gte" as const, stacks: 1 },
  { buffId: DEBUFF.smolder, op: "eq" as const, stacks: 0 },
]

const SMOLDER_CONDITIONS = [{ buffId: DEBUFF.smolder, op: "gte" as const, stacks: 1 }]

// In-game as of 2026-09-30: Poet1's clip fires one collider; Poet2-4's fire
// two, C1 and C2, each landing the strike's own damage and each
// independently finding a burning, aura-marked target for its own
// explosion — up to 2 explosions per strike. The Combustion-extension
// passive (2026-09-24) fires once per strike, carried on C1 only.
export function poetFirstStrikeHits(): SkillHit[] {
  return [
    hit(0, {
      frame: 0,
      ...STRIKE,
      triggers: [
        applyDebuff({ target: DEBUFF.combustion, stacks: 0, extendFrames: 90, extendOnly: true }),
      ],
    }),
    hit(1, { frame: 0, ...STRIKE }),
  ]
}

export function poetMiddleStrikeHits(): SkillHit[] {
  return [
    ...poetFirstStrikeHits(),
    hit(2, { frame: 0, ...COMBUSTION_EXPLOSION, conditions: COMBUSTION_ONLY_CONDITIONS }),
    hit(3, { frame: 0, ...SMOLDER_EXPLOSION, conditions: SMOLDER_CONDITIONS }),
    hit(4, { frame: 0, ...COMBUSTION_EXPLOSION, conditions: COMBUSTION_ONLY_CONDITIONS }),
    hit(5, { frame: 0, ...SMOLDER_EXPLOSION, conditions: SMOLDER_CONDITIONS }),
  ]
}
