import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// Whaledraft as the chain link after Castlink, Tipsylay or Primepick: 25 Binge
// Points, 50 during Carouse, and a perfect drink unleashes Falcon's Pursuit.
// The drink itself deals nothing.
export const whaledraftTriggers = [
  applyBuff({
    target: STATUS.bingePoints,
    stacks: 25,
    conditions: [{ buffId: STATUS.carouse, op: "gte", stacks: 1 }],
  }),
  applyBuff({ target: STATUS.bingePoints, stacks: 25 }),
  applyBuff({
    target: STATUS.inebriateDeepdaze,
    stacks: 1,
    conditions: [{ buffId: STATUS.bingePoints, op: "gte", stacks: 200 }],
  }),
  castSkill({ target: SKILL.falconsPursuitPerfect }),
]

export const whaledraft = defineSkill({
  id: SKILL.whaledraft,
  classId: "bamboocutDraught",
  name: "Gauntlet Heavy Attack",
  breakdownName: "Whaledraft",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraft,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 60,
  hits: [
    hit(0, {
      frame: 60,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: whaledraftTriggers,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
