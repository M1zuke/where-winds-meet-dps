// Game client table attr_first_level_trans as of 2026-09-07: STR_PATK_MIN_X,
// STR_PATK_MAX_X, CRI_PATK_MIN_X, CRI_CRI_PROB_X, BAS_PATK_MAX_X,
// BAS_BASH_PROB_X. The client names agility's pair CRI_* and momentum's BAS_*.
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

// Game client table attr_first_level_trans as of 2026-09-07: CON_HP_X. The
// client names Body's code CON.
export const BODY_PER_POINT = {
  hp: 60,
} as const

// Game client table attr_first_level_trans as of 2026-09-07: AGI_PDEF_X,
// AGI_HP_X. The client names Defense's code AGI, which the app calls defense.
export const DEFENSE_PER_POINT = {
  physDef: 0.57,
  hp: 17,
} as const
