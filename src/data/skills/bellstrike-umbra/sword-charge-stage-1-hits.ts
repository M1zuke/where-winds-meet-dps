import { hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { Displacement, SkillHit } from "../../../engine/skill"

// In-game values as of 2026-09-28: melee, assumed — the cast's own segment
// teleports 1 m short of the target under 9 m live distance, or dashes
// exactly 8 m forward from self between 9 and 20 m.
export const SWORD_CHARGE_STAGE_1_DISPLACEMENT: Displacement = {
  kind: "byDistance",
  bands: [
    { minMeters: 0, maxMeters: 8.999, then: { kind: "toTarget", meters: 1 } },
    { minMeters: 9, maxMeters: 100, then: { kind: "selfForward", meters: 8 } },
  ],
  otherwise: { kind: "towardTarget", referenceMeters: 0 },
}

export const SWORD_CHARGE_STAGE_1_HITS: SkillHit[] = [
  hit(0, {
    frame: 6,
    physMultiplier: 0.402924,
    attributeMultiplier: 0.604386,
    physFixed: 111.6,
    attributeFixed: 60.75,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(1, {
    frame: 30,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(2, {
    frame: 40,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(3, {
    frame: 50,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(4, {
    frame: 108,
    physMultiplier: 0.67154,
    attributeMultiplier: 1.00731,
    physFixed: 186,
    attributeFixed: 101.25,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
]
