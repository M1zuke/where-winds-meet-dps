import { gearLevelsUpTo } from "../../../../definitions/baseStats/breakthroughs"
import type { GearLevel } from "../../../../engine/types"

export function selectableGearLevels(breakthrough: number, current: GearLevel): GearLevel[] {
  const reached = gearLevelsUpTo(breakthrough)
  if (reached.includes(current)) return reached
  return [...reached, current].sort((left, right) => left - right)
}
