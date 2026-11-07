import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

// In-game as of 2026-09-24: the Drunken Aura this strike leaves explodes on a
// target already burning from Combustion or Smolder, Smolder taking priority
// when both are present — bounded at 4 explosions per five-strike chain (the
// first strike has no aura yet to consume); the true per-strike count is
// unsettled (4-9).
export const poetFinalHitCancelExplosion = defineSkill({
  id: SKILL.poetFinalHitCancelExplosion,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Poet Final Hit[Cancel] (Explosion)",
  breakdownName: "Poet Final Hit[Cancel]",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.poetFinalHitCancelExplosion,
  cancelledBy: "deflectCancel",
  castFrames: 0,
  triggerable: true,
  // In-game values as of 2026-10-15, level 76.
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.701728,
      attributeMultiplier: 1.052591,
      physFixed: 110.3386,
      attributeFixed: 0,
      conditions: [
        { buffId: DEBUFF.combustion, op: "gte", stacks: 1 },
        { buffId: DEBUFF.smolder, op: "eq", stacks: 0 },
      ],
    }),
    hit(1, {
      frame: 0,
      physMultiplier: 1.608126,
      attributeMultiplier: 2.412189,
      physFixed: 252.8592,
      attributeFixed: 0,
      conditions: [{ buffId: DEBUFF.smolder, op: "gte", stacks: 1 }],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
