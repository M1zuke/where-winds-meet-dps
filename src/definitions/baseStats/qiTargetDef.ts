export type QiTargetId = "swordTrial" | "swordTrialResistanceUp"

export const QI_TARGET_IDS: readonly QiTargetId[] = ["swordTrial", "swordTrialResistanceUp"]

export function isQiTargetId(value: unknown): value is QiTargetId {
  return typeof value === "string" && (QI_TARGET_IDS as readonly string[]).includes(value)
}

export const effectiveQiTarget = (inputs: { qiTarget?: string }): QiTargetId =>
  isQiTargetId(inputs.qiTarget) ? inputs.qiTarget : "swordTrial"

export interface QiTargetDef {
  id: QiTargetId
  max: number
  refill: number
  breakSec: number
  directImmunitySec: number
  takenIndex: number
}
