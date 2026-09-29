export type QiTargetId = "swordTrial" | "swordTrialResistanceUp" | "herosRealm"

export const QI_TARGET_IDS: readonly QiTargetId[] = [
  "swordTrial",
  "swordTrialResistanceUp",
  "herosRealm",
]

export function isQiTargetId(value: unknown): value is QiTargetId {
  return typeof value === "string" && (QI_TARGET_IDS as readonly string[]).includes(value)
}

export interface QiTargetDef {
  id: QiTargetId
  max: number
  refill: number
  breakSec: number
  directImmunitySec: number
  takenIndex: number
}
