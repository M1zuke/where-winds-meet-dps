import { hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { DEBUFF } from "./ids"
import type { SkillHit } from "../../../engine/skill"
import { LEVEL_ROWS } from "./levelRows"

// Press-relative frames: the 85 f minimum hold to reach stage 2 plus each
// collider's own frame after release; in-game values as of 2026-10-06.
export const SWORD_CHARGE_STAGE_2_HITS: SkillHit[] = [
  hit(0, {
    frame: 91,
    ...levelScaled(LEVEL_ROWS.swordChargeStage15HitHit4),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(1, {
    frame: 115,
    ...levelScaled(LEVEL_ROWS.swordChargeStage11HitHit0),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(2, {
    frame: 125,
    ...levelScaled(LEVEL_ROWS.swordChargeStage11HitHit0),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(3, {
    frame: 135,
    ...levelScaled(LEVEL_ROWS.swordChargeStage11HitHit0),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
  hit(4, {
    frame: 193,
    ...levelScaled(LEVEL_ROWS.swordChargeStage25HitHit4),
    triggers: [applyDot({ target: DEBUFF.bleedTick })],
  }),
]
