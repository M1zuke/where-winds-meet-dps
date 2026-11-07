import type { GearLevel } from "../../../../engine/types"

export function targetLevelLabel(
  label: string,
  pieceLevel: GearLevel,
  targetLevel: GearLevel | undefined,
): string {
  return targetLevel === undefined || targetLevel === pieceLevel
    ? label
    : `${label} → lv${targetLevel}`
}
