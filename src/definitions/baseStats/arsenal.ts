import type { ArsenalScores } from "../../engine/types"
import { ARSENAL_STORES } from "../../data/baseStats"
import type { ArsenalAttackRung, ArsenalStore } from "./arsenalStoreDef"

export function arsenalStoreDef(store: number): ArsenalStore | undefined {
  return ARSENAL_STORES[store - 1]
}

export function arsenalScoreCap(store: number): number {
  return arsenalStoreDef(store)?.totalMastery ?? 0
}

export function defaultArsenalScores(): ArsenalScores {
  const out: ArsenalScores = {}
  ARSENAL_STORES.forEach((store, index) => {
    out[index + 1] = store.totalMastery
  })
  return out
}

export const DEFAULT_ARSENAL_SCORES: ArsenalScores = defaultArsenalScores()

// The current store never graduates, even once its score clears Total
// Mastery: the game keeps paying it through the overflow formula. Only a
// past store crossing Total Mastery switches to the flat amount.
export interface ArsenalStoreState {
  store: number
  isPast: boolean
  graduated: boolean
  score: number
}

export function arsenalStoreState(
  store: number,
  score: number,
  isPast: boolean,
): ArsenalStoreState {
  const def = arsenalStoreDef(store)
  const graduated = isPast && def !== undefined && score >= def.totalMastery
  return { store, isPast, graduated, score }
}

export function arsenalStoreHp(state: ArsenalStoreState): number {
  const def = arsenalStoreDef(state.store)
  if (!def) return 0
  if (state.graduated) return def.graduationPromotion
  return def.ratioA + def.ratioB * Math.max(0, state.score - def.ratioC)
}

const ARSENAL_ATTACK_RUNG_SECTIONS = 6

// score_section splits Total Mastery into 6 equal-width bands; the ladder
// entry is 1 + the count of thresholds at or below score (inclusive lower
// boundary), same list the Total Mastery threshold's last entry comes from.
function arsenalAttackThresholds(totalMastery: number): readonly number[] {
  return Array.from(
    { length: ARSENAL_ATTACK_RUNG_SECTIONS },
    (_, index) => (totalMastery * (index + 1)) / ARSENAL_ATTACK_RUNG_SECTIONS,
  )
}

// 1-based; the store's number of thresholds at or below score, plus one.
// Unconditional: the graduated/current split governs HP only. A store's
// ladder entry follows its raw score even once the store has graduated, and
// freezes at the top rung once score clears the last threshold — there is no
// overflow rung beyond it.
export function arsenalAttackRungNumber(state: ArsenalStoreState): number {
  const def = arsenalStoreDef(state.store)
  if (!def) return 1
  const thresholds = arsenalAttackThresholds(def.totalMastery)
  return 1 + thresholds.filter((threshold) => threshold <= state.score).length
}

export function arsenalStoreAttack(state: ArsenalStoreState): ArsenalAttackRung {
  const def = arsenalStoreDef(state.store)
  if (!def) return { min: 0, max: 0 }
  return def.attackLadder[arsenalAttackRungNumber(state) - 1]
}
