import { applyBuff } from "../../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../../engine/skill"
import { STATUS } from "../ids"

const inCarouse = [{ buffId: STATUS.carouse, op: "gte" as const, stacks: 1 }]

// In-game values as of 2026-09-16.
export const skillBingePointAccumulationTriggers: HitTrigger[] = [
  applyBuff({ target: STATUS.skillBingePointAccumulation, stacks: 25 }),
  applyBuff({ target: STATUS.skillBingePointAccumulation, stacks: 25, conditions: inCarouse }),
]
