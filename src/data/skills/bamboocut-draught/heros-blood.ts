import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// The Binge Points grant must run before the Deepdaze threshold check on the
// same hit. Cast length: community speed-rotation workbook v2.0, 2026-09-04,
// 0.8 s.
export const herosBlood = defineSkill({
  id: SKILL.herosBlood,
  classId: "bamboocutDraught",
  name: "Twinblade Special",
  breakdownName: "Hero's Blood",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.herosBlood,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 48,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.65873,
      attributeMultiplier: 0.988095,
      physFixed: 183,
      attributeFixed: 100,
      triggers: [
        applyBuff({ target: STATUS.bingePoints, stacks: 40 }),
        applyBuff({ target: STATUS.carouse, stacks: 1 }),
        applyDebuff({ target: DEBUFF.drunkslay, stacks: 1 }),
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
