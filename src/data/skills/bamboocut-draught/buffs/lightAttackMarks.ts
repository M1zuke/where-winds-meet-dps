import { applyBuff } from "../../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../../engine/skill"
import { BUFF } from "../../buffs/ids"
import { STATUS } from "../ids"

const inCarouse = [{ buffId: STATUS.carouse, op: "gte" as const, stacks: 1 }]
const eonpourMarkBonus = [{ buffId: BUFF.eonpourLightAttackPoints, op: "gte" as const, stacks: 1 }]
const eonpourCarouseMarkBonus = [
  { buffId: STATUS.carouse, op: "gte" as const, stacks: 1 },
  { buffId: BUFF.eonpourCarousePoints, op: "gte" as const, stacks: 1 },
]

// Binge Marks per landing: 2 (5 in Carouse), +2 with Eonpour tier 1, +1 with
// Eonpour tier 4 in Carouse (+3 on the stage that closes the chain). In-game
// values as of 2026-09-16.
export const lightAttackMarkTriggers = (closesChain = false): HitTrigger[] => [
  applyBuff({ target: STATUS.bingeMarks, stacks: 2 }),
  applyBuff({ target: STATUS.bingeMarks, stacks: 3, conditions: inCarouse }),
  applyBuff({ target: STATUS.bingeMarks, stacks: 2, conditions: eonpourMarkBonus }),
  applyBuff({
    target: STATUS.bingeMarks,
    stacks: closesChain ? 3 : 1,
    conditions: eonpourCarouseMarkBonus,
  }),
]

// Stage 5's second collider grants its own further Binge Marks on top of
// `lightAttackMarkTriggers`: 2 (5 in Carouse), +1 with Eonpour tier 1 (+2 in
// Carouse). In-game values as of 2026-09-16.
export const lightAttackStageFiveSecondColliderTriggers: HitTrigger[] = [
  applyBuff({ target: STATUS.bingeMarks, stacks: 2 }),
  applyBuff({ target: STATUS.bingeMarks, stacks: 3, conditions: inCarouse }),
  applyBuff({ target: STATUS.bingeMarks, stacks: 1, conditions: eonpourMarkBonus }),
  applyBuff({
    target: STATUS.bingeMarks,
    stacks: 1,
    conditions: [...eonpourMarkBonus, ...inCarouse],
  }),
]
