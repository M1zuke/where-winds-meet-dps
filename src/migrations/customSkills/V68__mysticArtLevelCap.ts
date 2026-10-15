// v67 → v68 — every mystic art's damage row was re-authored to the values it
// has at the new highest reachable level (76, or 176 with the breakthrough
// branch). A Skill Editor copy seeded before that still carries the old row.
// Only a row still identical to what was seeded is rewritten: once a value
// differs, a stale copy and a deliberate edit are indistinguishable.
import { swapSkillHits, type HitRow, type HitSwap } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const swap = (from: HitRow, to: HitRow): HitSwap => ({ from, to })

const DAMAGELESS_HIT: HitSwap = swap([0, 0, 0, 0], [0, 0, 0, 0])

const FIRE_BREATH_OLD: HitRow = [1.36064, 2.04096, 205.5, 0]
const FIRE_BREATH_NEW: HitRow = [1.360884, 2.041327, 215.2962, 0]
const FIRE_BREATH_SPLIT_OLD: HitRow = [1.360639, 2.040959, 205.4962, 0]
const FIRE_BREATH_BONUS_OLD: HitRow = [1.49948, 2.24922, 226.4652, 0]
const FIRE_BREATH_BONUS_NEW: HitRow = [1.49975, 2.249625, 237.2652, 0]

const SMOLDER_OLD: HitRow = [1.28367, 1.925505, 195.71, 0]
const SMOLDER_NEW: HitRow = [1.283899, 1.925849, 204.9587, 0]
const SMOLDER_SPLIT_OLD: HitRow = [1.283668, 1.925502, 195.7134, 0]
const SMOLDER_BONUS_OLD: HitRow = [1.414655, 2.121982, 215.6842, 0]
const SMOLDER_BONUS_NEW: HitRow = [1.41491, 2.122364, 225.8728, 0]

const POET_STRIKE_OLD: HitRow = [1.02325, 1.534875, 153.82, 0]
const POET_STRIKE_NEW: HitRow = [1.023353, 1.535029, 160.9104, 0]
const COMBUSTION_EXPLOSION_OLD: HitRow = [0.70166, 1.05249, 105.48, 0]
const COMBUSTION_EXPLOSION_NEW: HitRow = [0.701728, 1.052591, 110.3386, 0]
const SMOLDER_EXPLOSION_OLD: HitRow = [1.60796, 2.41194, 241.72, 0]
const SMOLDER_EXPLOSION_NEW: HitRow = [1.608126, 2.412189, 252.8592, 0]

const POET_FIRST_STRIKE_SWAPS: readonly HitSwap[] = [
  swap(POET_STRIKE_OLD, POET_STRIKE_NEW),
  swap(POET_STRIKE_OLD, POET_STRIKE_NEW),
]

const POET_MIDDLE_STRIKE_SWAPS: readonly HitSwap[] = [
  ...POET_FIRST_STRIKE_SWAPS,
  swap(COMBUSTION_EXPLOSION_OLD, COMBUSTION_EXPLOSION_NEW),
  swap(SMOLDER_EXPLOSION_OLD, SMOLDER_EXPLOSION_NEW),
  swap(COMBUSTION_EXPLOSION_OLD, COMBUSTION_EXPLOSION_NEW),
  swap(SMOLDER_EXPLOSION_OLD, SMOLDER_EXPLOSION_NEW),
]

const FLUTE_STRIKE_OLD: HitRow = [1.47645, 2.214675, 320.97, 0]
const FLUTE_STRIKE_NEW: HitRow = [1.483296, 2.224945, 330.4793, 0]
const FLUTE_STAR_FALL_OLD: HitRow = [3.93721, 5.905815, 855.92, 0]
const FLUTE_STAR_FALL_NEW: HitRow = [3.955457, 5.933186, 881.2783, 0]

const SOARING_FIRST_OLD: HitRow = [3.19609, 4.794135, 481.53, 0]
const SOARING_FIRST_NEW: HitRow = [3.196543, 4.794815, 504.027, 0]
const SOARING_SECOND_OLD: HitRow = [3.90633, 5.859495, 588.53, 0]
const SOARING_SECOND_NEW: HitRow = [3.906886, 5.860329, 616.033, 0]

const TOAD_FLIP_OLD: HitRow = [0.54063, 0.810945, 81.23, 0]
const TOAD_FLIP_NEW: HitRow = [0.540669, 0.811003, 84.9328, 0]
const TOAD_POUNCE_OLD: HitRow = [3.24377, 4.865655, 487.39, 0]
const TOAD_POUNCE_NEW: HitRow = [3.244011, 4.866017, 509.5968, 0]

const TOAD_FURY_FLIP_OLD: HitRow = [0.510034, 0.765052, 77.3328, 0]
const TOAD_FURY_FLIP_NEW: HitRow = [0.510072, 0.765108, 80.8234, 0]
const TOAD_FURY_POUNCE_OLD: HitRow = [3.060207, 4.59031, 463.997, 0]
const TOAD_FURY_POUNCE_NEW: HitRow = [3.060433, 4.59065, 484.9404, 0]
const TOAD_FURY_POUNCE_HIT_OLD: HitRow = [3.978269, 5.967404, 603.1961, 0]
const TOAD_FURY_POUNCE_HIT_NEW: HitRow = [3.978563, 5.967845, 630.4225, 0]

const FREE_MORPH_RATIOS = [0.2, 0.12, 0.12, 0.12, 0.12, 0.12, 0.2]
const WOLFLIKE_FRENZY_RATIOS = [0.2, 0.15, 0.15, 0.15, 0.15, 0.2]

const ratioSwaps = (
  ratios: readonly number[],
  oldPower: number,
  oldFlat: number,
  newPower: number,
  newFlat: number,
): readonly HitSwap[] =>
  ratios.map((ratio) =>
    swap(
      [oldPower * ratio, oldPower * ratio * 1.5, oldFlat * ratio, 0],
      [newPower * ratio, newPower * ratio * 1.5, newFlat * ratio, 0],
    ),
  )

const SWAPS_BY_ID_SUFFIX: Readonly<Record<string, readonly HitSwap[]>> = {
  "-fire-breath-1-hit": [swap(FIRE_BREATH_OLD, FIRE_BREATH_NEW)],
  "-fire-breath-1-hit-prepull": [swap(FIRE_BREATH_OLD, FIRE_BREATH_NEW)],
  "-fire-breath-2-hit": [
    swap(FIRE_BREATH_SPLIT_OLD, FIRE_BREATH_NEW),
    swap(FIRE_BREATH_SPLIT_OLD, FIRE_BREATH_NEW),
    swap(FIRE_BREATH_BONUS_OLD, FIRE_BREATH_BONUS_NEW),
  ],
  "-dragon-fire-smolder-1-hit": [swap(SMOLDER_OLD, SMOLDER_NEW)],
  "-dragon-fire-smolder-2-hits": [
    swap(SMOLDER_SPLIT_OLD, SMOLDER_NEW),
    swap(SMOLDER_SPLIT_OLD, SMOLDER_NEW),
    swap(SMOLDER_BONUS_OLD, SMOLDER_BONUS_NEW),
  ],
  "-dragon-head": [swap([19.07454, 28.61181, 2869.37, 0], [19.07564, 28.61346, 3001.372, 0])],
  "-dragon-head-plus": [
    swap([12.59654, 18.89481, 1912.3, 0], [12.597266, 18.895899, 1999.4721, 0]),
  ],
  "-poet1": POET_FIRST_STRIKE_SWAPS,
  "-poet2": POET_MIDDLE_STRIKE_SWAPS,
  "-poet3": POET_MIDDLE_STRIKE_SWAPS,
  "-poet4": POET_MIDDLE_STRIKE_SWAPS,
  "-poet-final-hit-cancel": [
    swap([1.70541, 2.558115, 256.37, 0], [1.705588, 2.558382, 268.184, 0]),
  ],
  "-poet-final-hit-cancel-explosion": [
    swap(COMBUSTION_EXPLOSION_OLD, COMBUSTION_EXPLOSION_NEW),
    swap(SMOLDER_EXPLOSION_OLD, SMOLDER_EXPLOSION_NEW),
  ],
  "-flute-of-the-tides-full": [
    swap(FLUTE_STRIKE_OLD, FLUTE_STRIKE_NEW),
    swap(FLUTE_STAR_FALL_OLD, FLUTE_STAR_FALL_NEW),
  ],
  "-flute-of-the-tides-cancel": [DAMAGELESS_HIT, swap(FLUTE_STRIKE_OLD, FLUTE_STRIKE_NEW)],
  "-free-morph": ratioSwaps(FREE_MORPH_RATIOS, 7.17042, 1079.54, 7.171417, 1129.54),
  "-wolflike-frenzy": ratioSwaps(WOLFLIKE_FRENZY_RATIOS, 6.80056, 1023.96, 6.801561, 1071.46),
  "-soaring": [
    swap(SOARING_FIRST_OLD, SOARING_FIRST_NEW),
    swap(SOARING_SECOND_OLD, SOARING_SECOND_NEW),
  ],
  "-soaring-1-hit": [swap(SOARING_FIRST_OLD, SOARING_FIRST_NEW)],
  "-toad-cancel": [swap(TOAD_FLIP_OLD, TOAD_FLIP_NEW), swap(TOAD_POUNCE_OLD, TOAD_POUNCE_NEW)],
  "-toad-fury": [
    swap(TOAD_FURY_FLIP_OLD, TOAD_FURY_FLIP_NEW),
    swap(TOAD_FURY_POUNCE_OLD, TOAD_FURY_POUNCE_NEW),
  ],
  "-toad-fury-hit": [
    swap(TOAD_FURY_FLIP_OLD, TOAD_FURY_FLIP_NEW),
    swap(TOAD_FURY_POUNCE_HIT_OLD, TOAD_FURY_POUNCE_HIT_NEW),
  ],
}

export function swapsForMysticArt(id: string): readonly HitSwap[] | undefined {
  const suffix = Object.keys(SWAPS_BY_ID_SUFFIX).find((candidate) => id.endsWith(candidate))
  return suffix ? SWAPS_BY_ID_SUFFIX[suffix] : undefined
}

export const V68__mysticArtLevelCap: CustomSkillMigration = {
  to: 68,
  name: "V68__mysticArtLevelCap",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    return { ...blob, v: 68, skills: swapSkillHits(blob, swapsForMysticArt) }
  },
}
