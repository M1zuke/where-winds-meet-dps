import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// The drink itself deals nothing; its damage is Falcon's Pursuit, client
// skill_numerical_config row 20902814 (1.4784, no flat adds, a single level),
// carried as one hit. Binge Points: 25 as the chain link after Castlink,
// Tipsylay or Primepick, 50 during Carouse (client locale text, 2026-09-04).
export const whaledraft = defineSkill({
  id: SKILL.whaledraft,
  classId: "bamboocutDraught",
  name: "Whaledraft",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraft,
  receives: [...CLASS_RECEIVES, BUFF.perfectQuickDrink],
  triggerable: false,
  castFrames: -1,
  hits: [
    hit(0, {
      frame: -1,
      physMultiplier: 1.4784,
      attributeMultiplier: 2.2176,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
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
      ],
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
