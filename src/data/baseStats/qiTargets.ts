import type { QiTargetDef, QiTargetId } from "../../definitions/baseStats/qiTargetDef"
import { getBreakthrough } from "../../definitions/baseStats/breakthroughs"

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
  herosRealm: {
    id: "herosRealm",
    max: 1200,
    refill: 1200,
    breakSec: 10,
    directImmunitySec: 4,
    takenIndex: 12,
  },
}

// Hero's Realm HP is only captured at breakthrough 16/17; every other
// breakthrough scales it by the Sword Trial stake's own ratio there — the
// same arithmetic continuation the Sword Trial table itself carries beyond
// breakthrough 17 (in-game values as of 2026-09-25).
const HERO_REALM_HP_AT_96 = 34852167
const SWORD_TRIAL_HP_AT_96 = 9674809

export function qiTargetHpMax(targetId: QiTargetId, breakthrough: number): number {
  const swordTrialHp = getBreakthrough(breakthrough).targetHp
  return targetId === "herosRealm"
    ? Math.round(swordTrialHp * (HERO_REALM_HP_AT_96 / SWORD_TRIAL_HP_AT_96))
    : swordTrialHp
}
