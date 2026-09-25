import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { deepdazeEntryTriggers } from "./buffs/deepdazeEntry"

// Converts whatever the preceding skill accumulated, not a flat amount — a
// drink after a skill that grants no accumulation converts nothing. "Perfect"
// only adds the falcon and Tenacity. The transfers run before the Deepdaze
// threshold check on the same hit. In-game values as of 2026-09-16.
export const drinkGrants = [
  applyBuff({ target: STATUS.bingePoints, transferFrom: STATUS.skillBingePointAccumulation }),
  applyBuff({ target: STATUS.bingePoints, transferFrom: STATUS.bingeMarks }),
  ...deepdazeEntryTriggers(),
]

// The drink deals nothing; its grants fire on the first frame and the cast
// runs to the earliest next input (in-game animation, 2026-09-05).
export const whaledraft = defineSkill({
  id: SKILL.whaledraft,
  classId: "bamboocutDraught",
  name: "Gauntlet - Drink",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraft,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggerable: false,
  castFrames: 41,
  hits: [
    hit(0, {
      frame: 1,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: drinkGrants,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
