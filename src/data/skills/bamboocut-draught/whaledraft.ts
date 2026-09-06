import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"
import { deepdazeEntryTriggers } from "./buffs/deepdazeEntry"

const noMarks = [{ buffId: STATUS.bingeMarks, op: "eq" as const, stacks: 0 }]
const inCarouse = { buffId: STATUS.carouse, op: "gte" as const, stacks: 1 }

// Whaledraft chained after a skill grants 25 Binge Points, 50 in Carouse, at
// the perfect moment and 5, 10 in Carouse, otherwise; after a Light Attack
// instead every Binge Mark one for one (in-game skill text, 2026-09-05). The
// grants run before the Deepdaze threshold check on the same hit.
const drinkGrants = (points: number) => [
  applyBuff({ target: STATUS.bingePoints, stacks: points, conditions: noMarks }),
  applyBuff({ target: STATUS.bingePoints, stacks: points, conditions: [...noMarks, inCarouse] }),
  applyBuff({ target: STATUS.bingePoints, transferFrom: STATUS.bingeMarks }),
  ...deepdazeEntryTriggers(),
]

export const perfectDrinkGrants = drinkGrants(25)
export const plainDrinkGrants = drinkGrants(5)

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
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 41,
  hits: [
    hit(0, {
      frame: 1,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: plainDrinkGrants,
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
