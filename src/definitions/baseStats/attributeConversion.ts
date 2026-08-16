// Read from the game client's formula table
// (`wwm_lite/LocalData/Patch/HD/oversea/formula/formula_player.ft`, build
// 2026-07-22): STR_PATK_MIN_X, STR_PATK_MAX_X, CRI_PATK_MIN_X,
// CRI_CRI_PROB_X, BAS_PATK_MAX_X, BAS_BASH_PROB_X. The client names agility's
// pair CRI_* and momentum's BAS_*.
export const POWER_PER_POINT = {
  minPhys: 0.22,
  maxPhys: 1.36,
} as const

export const AGILITY_PER_POINT = {
  minPhys: 0.9,
  critRate: 0.00076,
} as const

export const MOMENTUM_PER_POINT = {
  maxPhys: 0.9,
  affinityRate: 0.00038,
} as const
