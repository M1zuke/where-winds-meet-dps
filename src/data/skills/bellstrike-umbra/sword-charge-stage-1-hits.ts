import { hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { DEBUFF, SKILL } from "./ids"
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

// Every frame below is press-relative: the 31 f minimum hold to reach stage 1
// (a charge node that starts at 12.6 f plus 0.3 s of charge, rounded up), the
// same reference the drain and freeze below already use, plus each collider's
// own frame after release — in-game values as of 2026-10-06.
export const SWORD_CHARGE_STAGE_1_HITS: SkillHit[] = [
  hit(0, {
    frame: 37,
    physMultiplier: 0.402924,
    attributeMultiplier: 0.604386,
    physFixed: 111.6,
    attributeFixed: 60.75,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(1, {
    frame: 61,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(2, {
    frame: 71,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(3, {
    frame: 81,
    physMultiplier: 0.268616,
    attributeMultiplier: 0.402924,
    physFixed: 74.4,
    attributeFixed: 40.5,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(4, {
    frame: 139,
    physMultiplier: 0.67154,
    attributeMultiplier: 1.00731,
    physFixed: 186,
    attributeFixed: 101.25,
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
]

export const SWORD_CHARGE_STAGE_1_INTO_FOLLOW_UP_SKILL_IDS = [
  SKILL.swordRChargeFollowUp,
  SKILL.swordRChargeFollowUp1HitCancel,
]

// docs/TIMELINE.md § "Conditional hits" — the follow-up's own earliest start
// sits at 87 f press-relative, past hit 3 and hit 4's own landing frames, so a
// partial form cancelled straight into the follow-up still lands both; cut
// short any other way (a Deflect), it does not (in-game animation,
// 2026-10-06).
export const SWORD_CHARGE_STAGE_1_HIT_3_INTO_FOLLOW_UP: SkillHit = {
  ...SWORD_CHARGE_STAGE_1_HITS[2],
  requiresNextStepSkillIds: SWORD_CHARGE_STAGE_1_INTO_FOLLOW_UP_SKILL_IDS,
}
export const SWORD_CHARGE_STAGE_1_HIT_4_INTO_FOLLOW_UP: SkillHit = {
  ...SWORD_CHARGE_STAGE_1_HITS[3],
  requiresNextStepSkillIds: SWORD_CHARGE_STAGE_1_INTO_FOLLOW_UP_SKILL_IDS,
  castFramesWhenGated: 87,
}
