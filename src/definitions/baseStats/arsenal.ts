import type { ArsenalScores } from "../../engine/types"
import { ARSENAL_STORES } from "../../data/baseStats"
import type { ArsenalStore } from "./arsenalStoreDef"

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
// Mastery: the client keeps paying it through the overflow formula. Only a
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
