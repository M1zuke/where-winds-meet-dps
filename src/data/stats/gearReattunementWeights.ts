import type { GearLevel, GearSlot } from "../../engine/types"

export interface ReattunementBand {
  min: number
  max: number
  weight: number
}

export interface ReattunementImproveBand {
  min: number
  max: number
}

export interface ReattunementLine {
  optionId: string
  weight: number
  bands: readonly ReattunementBand[]
  improveBands?: readonly ReattunementImproveBand[]
}

export interface ReattunementPool {
  totalWeight: number
  lines: readonly ReattunementLine[]
}

function bands(...triples: readonly [number, number, number][]): readonly ReattunementBand[] {
  return triples.map(([min, max, weight]) => ({ min, max, weight }))
}

function improve(...pairs: readonly [number, number][]): readonly ReattunementImproveBand[] {
  return pairs.map(([min, max]) => ({ min, max }))
}

const SKILL_BOOST_BANDS: Readonly<Record<GearLevel, readonly ReattunementBand[]>> = {
  86: bands([0.026, 0.037, 60], [0.038, 0.043, 40]),
  91: bands([0.03, 0.038, 10], [0.039, 0.043, 50], [0.044, 0.046, 30], [0.047, 0.05, 10]),
  96: bands([0.036, 0.045, 10], [0.046, 0.051, 50], [0.052, 0.055, 30], [0.056, 0.06, 10]),
  100: bands([0.042, 0.053, 10], [0.054, 0.06, 50], [0.061, 0.064, 30], [0.065, 0.07, 10]),
  105: bands([0.048, 0.06, 10], [0.061, 0.068, 50], [0.069, 0.074, 30], [0.075, 0.08, 10]),
}

const SKILL_BOOST_IMPROVE: Partial<Record<GearLevel, readonly ReattunementImproveBand[]>> = {
  91: improve([0.004, 0.006], [0.003, 0.004], [0.002, 0.003], [0.001, 0.002]),
  96: improve([0.005, 0.008], [0.003, 0.005], [0.003, 0.004], [0.002, 0.003]),
  100: improve([0.006, 0.009], [0.004, 0.006], [0.003, 0.005], [0.002, 0.003]),
  105: improve([0.007, 0.01], [0.004, 0.007], [0.004, 0.005], [0.002, 0.004]),
}

function skillBoostLine(optionId: string, weight: number, level: GearLevel): ReattunementLine {
  return {
    optionId,
    weight,
    bands: SKILL_BOOST_BANDS[level],
    improveBands: SKILL_BOOST_IMPROVE[level],
  }
}

type ClassWeights = Readonly<Record<GearLevel, Readonly<Record<string, number>>>>

function classPool(
  weights: ClassWeights,
  totalWeight: Readonly<Record<GearLevel, number>>,
): Readonly<Record<GearLevel, ReattunementPool>> {
  const out: Partial<Record<GearLevel, ReattunementPool>> = {}
  for (const [levelKey, memberWeights] of Object.entries(weights)) {
    const level = Number(levelKey) as GearLevel
    out[level] = {
      totalWeight: totalWeight[level],
      lines: Object.entries(memberWeights).map(([optionId, weight]) =>
        skillBoostLine(optionId, weight, level),
      ),
    }
  }
  return out as Readonly<Record<GearLevel, ReattunementPool>>
}

// Bellstrike - Splendor armour re-attunement pool, in-game 2026-09-08. Every
// member is modelled — the pool's full weight is covered.
const SPLENDOR_WEIGHTS: ClassWeights = {
  86: { swordQ: 100, swordCharged: 100, swordSpecial: 100, spearCharged: 100, spearSpecial: 100 },
  91: { swordCharged: 160, swordQ: 100, spearCharged: 100, swordSpecial: 70, spearSpecial: 70 },
  96: { swordCharged: 160, swordQ: 100, spearCharged: 100, swordSpecial: 70, spearSpecial: 70 },
  100: { swordCharged: 150, swordQ: 100, spearCharged: 100, swordSpecial: 80, spearSpecial: 70 },
  105: { swordCharged: 150, swordQ: 100, spearCharged: 100, swordSpecial: 80, spearSpecial: 70 },
}
const SPLENDOR_TOTAL_WEIGHT: Readonly<Record<GearLevel, number>> = {
  86: 500,
  91: 500,
  96: 500,
  100: 500,
  105: 500,
}

// Bellstrike - Umbra armour re-attunement pool, in-game 2026-09-08. Fully modelled.
const UMBRA_WEIGHTS: ClassWeights = {
  86: { bleedingDamage: 100, swordSpecial: 100, spearQ: 100, swordQ: 100, spearCharged: 100 },
  91: { bleedingDamage: 160, swordSpecial: 100, spearQ: 100, swordQ: 70, spearCharged: 70 },
  96: { bleedingDamage: 160, swordSpecial: 100, spearQ: 100, swordQ: 70, spearCharged: 70 },
  100: { bleedingDamage: 150, swordSpecial: 100, spearQ: 100, swordQ: 80, spearCharged: 70 },
  105: { bleedingDamage: 150, swordSpecial: 100, spearQ: 100, swordQ: 80, spearCharged: 70 },
}
const UMBRA_TOTAL_WEIGHT: Readonly<Record<GearLevel, number>> = {
  86: 500,
  91: 500,
  96: 500,
  100: 500,
  105: 500,
}

// Stonesplit - Strength armour re-attunement pool, in-game 2026-09-08. Fully modelled.
const STRENGTH_WEIGHTS: ClassWeights = {
  86: {
    snowpartingVariedCombo: 130,
    phalanxChargeDamage: 130,
    snowpartingQ: 80,
    snowpartingCharged: 80,
    phalanxbaneQ: 80,
  },
  91: {
    snowpartingVariedCombo: 130,
    phalanxChargeDamage: 130,
    snowpartingQ: 80,
    snowpartingCharged: 80,
    phalanxbaneQ: 80,
  },
  96: {
    snowpartingVariedCombo: 130,
    phalanxChargeDamage: 130,
    snowpartingQ: 80,
    snowpartingCharged: 80,
    phalanxbaneQ: 80,
  },
  100: {
    snowpartingVariedCombo: 150,
    phalanxChargeDamage: 150,
    phalanxbaneQ: 80,
    snowpartingQ: 60,
    snowpartingCharged: 60,
  },
  105: {
    snowpartingVariedCombo: 150,
    phalanxChargeDamage: 150,
    phalanxbaneQ: 80,
    snowpartingQ: 60,
    snowpartingCharged: 60,
  },
}
const STRENGTH_TOTAL_WEIGHT: Readonly<Record<GearLevel, number>> = {
  86: 500,
  91: 500,
  96: 500,
  100: 500,
  105: 500,
}

// Silkbind - Jade armour re-attunement pool, in-game 2026-09-08. Two pool
// members (`umbCharged`, `umbSpecial`) and one unidentified member carry no
// modelled engine effect; their weight stays in `totalWeight` so the modelled
// lines' draw chance is not overstated.
const JADE_WEIGHTS: ClassWeights = {
  86: { fanCharged: 100, fanSpecial: 100, umbQ: 100 },
  91: { fanCharged: 50, fanSpecial: 100, umbQ: 80 },
  96: { fanCharged: 50, fanSpecial: 100, umbQ: 100 },
  100: { fanCharged: 50, fanSpecial: 100, umbQ: 100 },
  105: { fanCharged: 50, fanSpecial: 100, umbQ: 100 },
}
const JADE_TOTAL_WEIGHT: Readonly<Record<GearLevel, number>> = {
  86: 500,
  91: 500,
  96: 501,
  100: 500,
  105: 500,
}

const CLASS_POOLS: Readonly<Record<string, Readonly<Record<GearLevel, ReattunementPool>>>> = {
  bellstrikeSplendor: classPool(SPLENDOR_WEIGHTS, SPLENDOR_TOTAL_WEIGHT),
  bellstrikeUmbra: classPool(UMBRA_WEIGHTS, UMBRA_TOTAL_WEIGHT),
  stonesplitStrength: classPool(STRENGTH_WEIGHTS, STRENGTH_TOTAL_WEIGHT),
  silkbindJade: classPool(JADE_WEIGHTS, JADE_TOTAL_WEIGHT),
}

interface PenShape {
  pen: readonly ReattunementBand[]
  formless?: readonly ReattunementBand[]
}

interface PenImprove {
  pen?: readonly ReattunementImproveBand[]
  formless?: readonly ReattunementImproveBand[]
}

// Weapon / disc / pendant re-attunement pool, in-game 2026-09-08 — the same
// pool for every class. `physPen`/`physResist` share one band shape;
// `formlessPen` is its own line and does not exist at 86. Ranges are stated in
// the app's fraction, one hundredth of the in-game percentage-point step.
const PEN_BANDS: Readonly<Record<GearLevel, PenShape>> = {
  86: { pen: bands([0.047, 0.066, 60], [0.067, 0.078, 40]) },
  91: {
    pen: bands([0.054, 0.068, 10], [0.069, 0.077, 50], [0.078, 0.083, 30], [0.084, 0.09, 10]),
    formless: bands([0.065, 0.081, 10], [0.082, 0.092, 50], [0.093, 0.099, 30], [0.1, 0.108, 10]),
  },
  96: {
    pen: bands([0.066, 0.083, 10], [0.084, 0.094, 50], [0.095, 0.101, 30], [0.102, 0.11, 10]),
    formless: bands([0.078, 0.098, 10], [0.099, 0.111, 50], [0.112, 0.12, 30], [0.121, 0.13, 10]),
  },
  100: {
    pen: bands([0.077, 0.096, 10], [0.097, 0.109, 50], [0.11, 0.118, 30], [0.119, 0.128, 10]),
    formless: bands([0.091, 0.114, 10], [0.115, 0.129, 50], [0.13, 0.14, 30], [0.141, 0.152, 10]),
  },
  105: {
    pen: bands([0.088, 0.11, 10], [0.111, 0.124, 50], [0.125, 0.134, 30], [0.135, 0.146, 10]),
    formless: bands([0.104, 0.131, 10], [0.132, 0.148, 50], [0.149, 0.16, 30], [0.161, 0.174, 10]),
  },
}

const PEN_IMPROVE: Partial<Record<GearLevel, PenImprove>> = {
  91: {
    pen: improve([0.008, 0.011], [0.005, 0.008], [0.004, 0.006], [0.002, 0.004]),
    formless: improve([0.009, 0.013], [0.006, 0.009], [0.005, 0.007], [0.003, 0.005]),
  },
  96: {
    pen: improve([0.009, 0.014], [0.006, 0.009], [0.005, 0.007], [0.003, 0.005]),
    formless: improve([0.011, 0.016], [0.007, 0.011], [0.006, 0.008], [0.003, 0.006]),
  },
  100: {
    pen: improve([0.011, 0.016], [0.007, 0.011], [0.006, 0.008], [0.003, 0.006]),
    formless: improve([0.013, 0.019], [0.008, 0.013], [0.007, 0.01], [0.004, 0.007]),
  },
  105: {
    pen: improve([0.012, 0.018], [0.008, 0.012], [0.006, 0.009], [0.003, 0.006]),
    formless: improve([0.014, 0.021], [0.009, 0.014], [0.007, 0.011], [0.004, 0.007]),
  },
}

const PEN_MEMBER_WEIGHT = 150
const PEN_TOTAL_WEIGHT: Readonly<Record<GearLevel, number>> = {
  86: 600,
  91: 450,
  96: 450,
  100: 450,
  105: 450,
}

function generalPool(level: GearLevel): ReattunementPool {
  const shape = PEN_BANDS[level]
  const lineImprove = PEN_IMPROVE[level]
  const lines: ReattunementLine[] = [
    {
      optionId: "physPen",
      weight: PEN_MEMBER_WEIGHT,
      bands: shape.pen,
      improveBands: lineImprove?.pen,
    },
    {
      optionId: "physResist",
      weight: PEN_MEMBER_WEIGHT,
      bands: shape.pen,
      improveBands: lineImprove?.pen,
    },
  ]
  if (shape.formless) {
    lines.push({
      optionId: "formlessPen",
      weight: PEN_MEMBER_WEIGHT,
      bands: shape.formless,
      improveBands: lineImprove?.formless,
    })
  }
  return { totalWeight: PEN_TOTAL_WEIGHT[level], lines }
}

const GENERAL_POOLS: Readonly<Record<GearLevel, ReattunementPool>> = {
  86: generalPool(86),
  91: generalPool(91),
  96: generalPool(96),
  100: generalPool(100),
  105: generalPool(105),
}

const GENERAL_SLOTS = new Set<GearSlot>(["leftWeapon", "rightWeapon", "disc", "pendant"])

export function reattunementPool(
  classId: string,
  slot: GearSlot,
  level: GearLevel,
): ReattunementPool | null {
  if (GENERAL_SLOTS.has(slot)) return GENERAL_POOLS[level] ?? null
  return CLASS_POOLS[classId]?.[level] ?? null
}
