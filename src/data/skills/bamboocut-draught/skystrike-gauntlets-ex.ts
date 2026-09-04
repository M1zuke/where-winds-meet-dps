import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"

// The ultimate deals no damage of its own: a big drink that enters Deepdaze
// outright and grants Clash-toast for 15 s at rank 5 (client skill
// descriptions 30616-30620, 2026-09-04). Deepdaze needs the counter at its cap.
export const skystrikeGauntletsEx = defineSkill({
  id: SKILL.skystrikeGauntletsEx,
  classId: "bamboocutDraught",
  name: "Skystrike Gauntlets - EX",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.skystrikeGauntletsEx,
  receives: [],
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
        applyBuff({ target: STATUS.bingePoints, stacks: 200 }),
        applyBuff({ target: STATUS.inebriateDeepdaze, stacks: 1 }),
        applyBuff({ target: STATUS.clashToast, stacks: 1 }),
      ],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
