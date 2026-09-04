import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// Whaledraft straight after a light attack: every Binge Mark becomes a Binge
// Point one for one, and a perfect drink unleashes Falcon's Pursuit (client
// locale text, 2026-09-04). The drink itself deals nothing.
export const quickDrink = defineSkill({
  id: SKILL.quickDrink,
  classId: "bamboocutDraught",
  name: "Gauntlet Heavy Attack - Quick Drink",
  breakdownName: "Whaledraft",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.quickDrink,
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
      triggers: [
        applyBuff({ target: STATUS.bingePoints, transferFrom: STATUS.bingeMarks }),
        applyBuff({
          target: STATUS.inebriateDeepdaze,
          stacks: 1,
          conditions: [{ buffId: STATUS.bingePoints, op: "gte", stacks: 200 }],
        }),
        castSkill({ target: SKILL.falconsPursuitPerfect }),
      ],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
