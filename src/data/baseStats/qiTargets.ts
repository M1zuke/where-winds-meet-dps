import type { QiTargetDef, QiTargetId } from "../../definitions/baseStats/qiTargetDef"

// In-game values as of 2026-09-25: no in-combat regeneration for any of
// these targets' own Qi bar.
export const QI_TARGETS: Readonly<Record<QiTargetId, QiTargetDef>> = {
  swordTrial: {
    id: "swordTrial",
    max: 800,
    refill: 800,
    breakSec: 10,
    directImmunitySec: 4,
    takenIndex: 17.28,
  },
  swordTrialResistanceUp: {
    id: "swordTrialResistanceUp",
    max: 800,
    refill: 800,
    breakSec: 10,
    directImmunitySec: 4,
    takenIndex: 17.76,
  },
}
