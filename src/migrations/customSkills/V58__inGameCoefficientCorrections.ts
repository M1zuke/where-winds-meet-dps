// v57 → v58 — corrected in-game coefficients: the Silkbind Jade drone tick now
// takes the martial art's attribute multiplier, and the Lion's Roar Throw,
// Flaming Meteor crash, both Dragon's Breath splits, Moon Shatter Spring,
// Peak's Springless Silence, Colorful Phoenix, Unfading Flower's throw,
// Healer Extension, Burning Heart stage 3 and Shadow Step rows changed value.
// A Skill Editor copy seeded before that still carries the old row, and the
// drone tick the opt-out flag. Only a row still identical to what was seeded is
// rewritten — once a value differs, a stale copy and a deliberate edit are
// indistinguishable.
import { swapHits, type HitRow, type HitSwap } from "./hitRows"
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const DRONE_TICK_IDS: ReadonlySet<string> = new Set([
  "silkbindJade-umbdrone",
  "silkbindJade-umbdrone-12hit",
  "silkbindJade-umbdrone-16hit",
  "silkbindJade-umbdrone-20hit",
  "silkbindJade-umbdrone-23hit",
  "silkbindJade-umbdrone-26hit",
])

const swapAt = (index: number, swap: HitSwap): HitSwap[] => {
  const swaps: HitSwap[] = []
  swaps[index] = swap
  return swaps
}

const scaled = (row: HitRow, share: number): HitRow => [
  row[0] * share,
  row[1] * share,
  row[2] * share,
  row[3] * share,
]

const evenlySplit = (row: HitRow, hitCount: number): HitRow => [
  row[0] / hitCount,
  row[1] / hitCount,
  row[2] / hitCount,
  row[3] / hitCount,
]

const LIONS_ROAR_THROW_OLD: HitRow = [3.60865 * 1.2, 3.60865 * 1.2 * 1.5, 543.2 * 1.2, 0]
const LIONS_ROAR_THROW_NEW: HitRow = [3.404574 * 1.2, 3.404574 * 1.2 * 1.5, 517.1698 * 1.2, 0]

const METEOR_CRASH_OLD: HitRow = [11.01916 * 0.35, 11.01916 * 0.35 * 1.5, 1660.42 * 0.35, 0]
const METEOR_CRASH_NEW: HitRow = [11.01916 * 0.385, 11.01916 * 0.385 * 1.5, 1660.42 * 0.385, 0]

const FIRE_BREATH_OLD: HitRow = [1.40692, 2.11038, 212.49, 0]
const FIRE_BREATH_BREATH: HitRow = [1.360639, 2.040959, 205.4962, 0]
const FIRE_BREATH_BONUS: HitRow = [1.49948, 2.24922, 226.4652, 0]

const SMOLDER_OLD: HitRow = [1.32733, 1.990995, 202.37, 0]
const SMOLDER_BREATH: HitRow = [1.283668, 1.925502, 195.7134, 0]
const SMOLDER_BONUS: HitRow = [1.414655, 2.121982, 215.6842, 0]

const MOON_SHATTER_3_TOTAL: HitRow = [1.2478, 1.8716, 346, 188]
const MOON_SHATTER_3_OLD = evenlySplit(MOON_SHATTER_3_TOTAL, 3)
const MOON_SHATTER_5_TOTAL: HitRow = [3.0185, 4.5278, 835, 455]
const MOON_SHATTER_5_OLD = evenlySplit(MOON_SHATTER_5_TOTAL, 5)

const SPRINGLESS_TOTAL: HitRow = [1.2798, 1.9197, 355, 193]
const SPRINGLESS_OLD = evenlySplit(SPRINGLESS_TOTAL, 2)

const COLORFUL_PHOENIX_TOTAL: HitRow = [1.1604, 1.1604 * 1.5, 322, 175]
const COLORFUL_PHOENIX_OLD = evenlySplit(COLORFUL_PHOENIX_TOTAL, 3)
const COLORFUL_PHOENIX_NEW = scaled(COLORFUL_PHOENIX_TOTAL, 0.33)

const UNFADING_FLOWER_OLD: HitRow = [0.54, 0.81, 149.4, 81.5]
const UNFADING_FLOWER_NEW: HitRow = [0.539718, 0.809577, 149.4, 81.4]
const UNFADING_FLOWER_SWAPS: HitSwap[] = [{ from: UNFADING_FLOWER_OLD, to: UNFADING_FLOWER_NEW }]

const HEALER_EXTENSION_SWAP: HitSwap = {
  from: [0.19388, 0.290832, 44.8, 25.04],
  to: [0.19392, 0.29088, 53.68, 29.28],
}

const DAMAGELESS_HIT_SWAP: HitSwap = { from: [0, 0, 0, 0], to: [0, 0, 0, 0] }
const BURNING_HEART_SWAPS: HitSwap[] = [
  DAMAGELESS_HIT_SWAP,
  DAMAGELESS_HIT_SWAP,
  { from: [1.7199, 2.5798, 475, 259], to: [1.7199, 2.5798, 475.8, 259.2] },
  { from: [4.0131, 6.0196, 1110, 604], to: [4.0131, 6.0196, 1110.2, 604.8] },
]

const SHADOW_STEP_SWAPS: HitSwap[] = [
  { from: [1.767, 2.6505, 490, 267], to: [1.76747, 2.651205, 490, 267] },
]

const CORRECTED_HITS: Record<string, readonly HitSwap[]> = {
  "mystic-lions-roar-throw": [{ from: LIONS_ROAR_THROW_OLD, to: LIONS_ROAR_THROW_NEW }],
  "mystic-flaming-meteor": swapAt(2, { from: METEOR_CRASH_OLD, to: METEOR_CRASH_NEW }),
  "mystic-fire-breath-2-hit": [
    { from: FIRE_BREATH_OLD, to: FIRE_BREATH_BREATH },
    { from: FIRE_BREATH_OLD, to: FIRE_BREATH_BREATH },
    { from: FIRE_BREATH_OLD, to: FIRE_BREATH_BONUS },
  ],
  "mystic-dragon-fire-smolder-2-hits": [
    { from: SMOLDER_OLD, to: SMOLDER_BREATH },
    { from: SMOLDER_OLD, to: SMOLDER_BREATH },
    { from: SMOLDER_OLD, to: SMOLDER_BONUS },
  ],
  "silkbindJade-fanheavypursuit-3-hit": [
    { from: MOON_SHATTER_3_OLD, to: scaled(MOON_SHATTER_3_TOTAL, 0.3) },
    { from: MOON_SHATTER_3_OLD, to: scaled(MOON_SHATTER_3_TOTAL, 0.3) },
    { from: MOON_SHATTER_3_OLD, to: scaled(MOON_SHATTER_3_TOTAL, 0.4) },
  ],
  "silkbindJade-fanheavypursuit-5-hit": [
    { from: MOON_SHATTER_5_OLD, to: scaled(MOON_SHATTER_5_TOTAL, 0.175) },
    { from: MOON_SHATTER_5_OLD, to: scaled(MOON_SHATTER_5_TOTAL, 0.175) },
    { from: MOON_SHATTER_5_OLD, to: scaled(MOON_SHATTER_5_TOTAL, 0.175) },
    { from: MOON_SHATTER_5_OLD, to: scaled(MOON_SHATTER_5_TOTAL, 0.175) },
    { from: MOON_SHATTER_5_OLD, to: scaled(MOON_SHATTER_5_TOTAL, 0.3) },
  ],
  "silkbindJade-fanspecial": [
    { from: SPRINGLESS_OLD, to: scaled(SPRINGLESS_TOTAL, 0.005) },
    { from: SPRINGLESS_OLD, to: scaled(SPRINGLESS_TOTAL, 0.995) },
  ],
  "silkbindJade-umb-heavylight": [
    { from: COLORFUL_PHOENIX_OLD, to: COLORFUL_PHOENIX_NEW },
    { from: COLORFUL_PHOENIX_OLD, to: COLORFUL_PHOENIX_NEW },
    { from: COLORFUL_PHOENIX_OLD, to: COLORFUL_PHOENIX_NEW },
  ],
  "silkbindJade-umbdronelaunch": UNFADING_FLOWER_SWAPS,
  "silkbindJade-umbdronelaunch-12hit": UNFADING_FLOWER_SWAPS,
  "silkbindJade-umbdronelaunch-16hit": UNFADING_FLOWER_SWAPS,
  "silkbindJade-umbdronelaunch-20hit": UNFADING_FLOWER_SWAPS,
  "silkbindJade-umbdronelaunch-23hit": UNFADING_FLOWER_SWAPS,
  "silkbindJade-umbdronelaunch-26hit": UNFADING_FLOWER_SWAPS,
  "silkbindJade-healer-extension": Array.from({ length: 10 }, () => HEALER_EXTENSION_SWAP),
  "stonesplitStrength-phalanxcharged-s3": BURNING_HEART_SWAPS,
  "stonesplitStrength-phalanxcharged-s3-innerpassion": BURNING_HEART_SWAPS,
  "bellstrikeSplendor-swordspecial": SHADOW_STEP_SWAPS,
  "bellstrikeSplendor-swordspecial-2nd": SHADOW_STEP_SWAPS,
  "bellstrikeSplendor-swordspecial-deflect": SHADOW_STEP_SWAPS,
}

function withoutStaleDroneFlag(skill: Record<string, unknown>): Record<string, unknown> {
  if (!DRONE_TICK_IDS.has(skill.id as string) || skill.elevatedAttributeMultiplier !== false) {
    return skill
  }
  const { elevatedAttributeMultiplier: _elevatedAttributeMultiplier, ...rest } = skill
  return rest
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const swaps = CORRECTED_HITS[skill.id]
  const healed = swaps ? { ...skill, hits: swapHits(skill.hits, swaps) } : skill
  return withoutStaleDroneFlag(healed)
}

export const V58__inGameCoefficientCorrections: CustomSkillMigration = {
  to: 58,
  name: "V58__inGameCoefficientCorrections",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 58, skills }
  },
}
