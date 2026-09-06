import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { deepdazeEntryTriggers } from "./buffs/deepdazeEntry"

// The ultimate deals no damage of its own: a big drink that fills Binge
// Points to their cap and grants Clash-toast for 15 s at rank 5, entering
// Deepdaze through the same threshold every other source does (in-game
// ultimate text, 2026-09-06). Cast length: in-game animation, 2026-09-05.
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
  castFrames: 48,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: STATUS.bingePoints, stacks: 200 }),
        ...deepdazeEntryTriggers(),
        applyBuff({ target: STATUS.clashToast, stacks: 1 }),
      ],
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
