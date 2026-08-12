import { SET_BY_ID } from "../definitions/sets/registry"
import type { SetFormulaBonus } from "../definitions/sets/setDef"

// A skill whose final crit chance is raised, or forced outright, once the
// rolled chance clears `threshold` — the one crit rule that reads the computed
// rate rather than a panel stat, so it lands here and not in the stat layer.
export interface ConditionalFinalCrit {
  threshold: number
  bonusBelowThreshold: number
}

// 120/240 are the breakthrough-16 / level-96+ tier (level 91-95 was 90/180).
// This is the ONLY place the food bonus is applied.
export const FOOD_MIN_PHYS_BONUS = 120
export const FOOD_MAX_PHYS_BONUS = 240

export function effectivePhysRange(
  minPhys: number,
  maxPhys: number,
  food: boolean,
): { min: number; max: number } {
  const min = minPhys + (food ? FOOD_MIN_PHYS_BONUS : 0)
  const maxWithFood = maxPhys + (food ? FOOD_MAX_PHYS_BONUS : 0)
  return { min, max: Math.max(maxWithFood, min) }
}

type ArtRow = {
  name: string
  physMultiplier?: number
  physFixed?: number
  attributeMultiplier?: number
  attributeFixed?: number
  minPhysPctBonus?: number
  minPhysFlatBonus?: number
  maxPhysPctBonus?: number
  maxPhysFlatBonus?: number
  extraCritRate?: number
  extraCritDamage?: number
  extraAffinityRate?: number
  extraAffinityDamage?: number
  correction?: number
  extraDamageBoost?: number
  extraPhysPenetration?: number
  usesChargeBoost?: number
  skillType?: string
  weaponOrAttribute?: string
  attributeAttack?: string
  specialTag?: string
  elevatedAttributeMultiplier?: boolean
  attuneTag?: string
  guaranteedCrit?: number
  guaranteedPrecision?: number
  guaranteedNormal?: number
  conditionalFinalCrit?: ConditionalFinalCrit
  extraStonesplitPenetration?: number
  mysticCategory?: string
}

type Attribute = "Bellstrike" | "Stonesplit" | "Silkbind" | "Bamboocut"

export interface AttackBlock {
  min: number
  max: number
  pen: number
}

export interface FormulaContext {
  smallPhys: number
  largePhys: number
  outerPen: number
  bellstrike: AttackBlock
  stonesplit: AttackBlock
  silkbind: AttackBlock
  bamboocut: AttackBlock
  primaryAttribute: Attribute
  attributePrimaryBonus: number

  precisionPanel: number
  critPanel: number
  affinityPanel: number
  directCritPanel: number
  directAffinityPanel: number
  physDmgBoostPanel: number
  critDmgBoostPanel: number
  affinityDmgBoostPanel: number
  attributeDmgBoostPanel: number
  sustainDmgBoostPanel: number
  dotDamageBoost?: number
  dotDamageMultiplier?: number
  allDamageBoost?: number
  allMartialBoost?: number
  weaponBoosts?: Record<string, number>
  mysticTypeBoosts?: Record<string, number>
  generalDamageBoost: number
  chargeBonus: number
  effectiveDefense: number
  fatigueDamageTaken: number
  hasSixHenZhi: boolean
  food: boolean
  set: string | null
  tianGong: "fire" | "poison" | null
  dingYinByTag: Record<string, number>
  // The scoped view of `dingYinByTag`, keyed by the `attune:` tag an entity
  // declares rather than by the stat's display name.
  attuneBoostByTag?: Record<string, number>
  shareDebuffs: { henZhi: boolean; easyHurt: boolean }
  physPenResistance?: number
  attrPenResistance?: number
  rateResistance?: number
  hawkwingPhysBonus?: number
}

function setFormulaBonus(setId: string | null, field: keyof SetFormulaBonus): number {
  if (!setId) return 0
  const value = SET_BY_ID[setId]?.formulaBonus?.[field]
  return typeof value === "number" ? value : 0
}

interface SkillResult {
  expectedDamage: number
  cells: Record<string, number>
}

export interface RotationCounters {
  qiExhausted: number
  yiShuiLayer: number
  bengJieLayer: number
  lowQi: number
}

export function computeSkillDamage(
  art: ArtRow,
  ctx: FormulaContext,
  count: number,
  counters: RotationCounters = { qiExhausted: 0, yiShuiLayer: 0, bengJieLayer: 0, lowQi: 0 },
): SkillResult {
  const num = (v: number | undefined) => v ?? 0
  const N = num(art.physMultiplier)
  const O = num(art.attributeMultiplier)
  const P = num(art.physFixed)
  const Q = num(art.attributeFixed)
  const skillType = art.skillType ?? ""
  const isWeapon = skillType === "weapon"
  const isTianGong = skillType === "Heavenwork"
  let guaranteedCrit = art.guaranteedCrit === 1
  const guaranteedPrecision = art.guaranteedPrecision === 1
  const guaranteedNormal = art.guaranteedNormal === 1
  const isPersistent = art.specialTag === "sustain"
  const usesChargeBoost = art.usesChargeBoost === 1
  const usesGyrationUmbrella = art.specialTag === "Spinning Umbrella"

  const physPenRes = ctx.physPenResistance ?? 0
  const attrPenRes = ctx.attrPenResistance ?? 0
  // Deliberately INVERTS Midasione PDF §7 (net>0 → ÷200, not ÷100) — see
  // docs/CALCULATION.md § "Calculation rules" rule 2.
  const penFrac = (pen: number, resPct: number) => {
    const net = pen - resPct
    return net <= 0 ? net / 100 : net / 200
  }
  // DoT rows lose flat damage and elevated matching-path scaling (PDF §1); a
  // sustain-tagged burst detonation (elevatedAttributeMultiplier defaults
  // true) is NOT demoted — see docs/CALCULATION.md § "Calculation rules" rule 3.
  const getsElevatedMultiplier = art.elevatedAttributeMultiplier ?? true
  const dotRules = !getsElevatedMultiplier

  const skillCritDamage = num(art.extraCritDamage)
  const X =
    ctx.critDmgBoostPanel +
    skillCritDamage +
    setFormulaBonus(ctx.set, "critDamage") +
    counters.bengJieLayer * 0.05

  const skillAffinityDamage = num(art.extraAffinityDamage)
  const Y =
    ctx.affinityDmgBoostPanel + skillAffinityDamage + setFormulaBonus(ctx.set, "affinityDamage")

  const U = isTianGong || guaranteedPrecision ? 1 : Math.min(ctx.precisionPanel, 1)

  // `ctx.critPanel`/`ctx.affinityPanel` arrive already resisted from
  // `panel.ts`'s white→yellow conversion, so they are never divided here.
  // `art.extraAffinityRate` is the one raw (unconverted) rate source the
  // formula still receives, per PDF §11 divided by (1 + resistance) before
  // the 40 % cap. Exception: Thundercry Blade's (Modao) charged-attack crit
  // rate (`art.extraCritRate`) is a flat, unresisted addition after the cap.
  const rateRes = ctx.rateResistance ?? 0
  const V = isTianGong
    ? 0
    : Math.min(ctx.critPanel, 0.8) +
      ctx.directCritPanel +
      setFormulaBonus(ctx.set, "directCrit") +
      num(art.extraCritRate)

  const isLowQi = counters.lowQi === 1
  const W = isTianGong
    ? 0
    : Math.min(ctx.affinityPanel + num(art.extraAffinityRate) / (1 + rateRes), 0.4) +
      ctx.directAffinityPanel +
      (isLowQi ? setFormulaBonus(ctx.set, "lowQiDirectAffinityRate") : 0)

  const setFalcon = ctx.hawkwingPhysBonus ?? setFormulaBonus(ctx.set, "physBoost")
  const effectivePhys = effectivePhysRange(ctx.smallPhys, ctx.largePhys, ctx.food)
  const AE =
    (effectivePhys.min + num(art.minPhysFlatBonus)) *
      (1 + num(art.minPhysPctBonus)) *
      (1 + setFalcon) -
    ctx.effectiveDefense

  const AG_raw =
    (effectivePhys.max + num(art.maxPhysFlatBonus)) *
      (1 + num(art.maxPhysPctBonus)) *
      (1 + setFalcon) -
    ctx.effectiveDefense
  const AG = Math.max(AG_raw, AE)

  const AF = (AE + AG) / 2

  const physPenTotal =
    ctx.outerPen +
    num(art.extraPhysPenetration) +
    counters.bengJieLayer * 5 +
    counters.yiShuiLayer * 2 +
    (ctx.hasSixHenZhi ? 10 : 0)
  const AH = penFrac(physPenTotal, physPenRes)

  const AI = ctx.physDmgBoostPanel + (usesGyrationUmbrella ? 0.15 : 0)

  const AJ = 1

  const AK = AE * N * AJ * (1 + AI) * (1 + AH)
  const AL = (1 - U) * (1 - W)
  const AM = AF * N * (1 + AI) * (1 + AH) * AJ * (1 + X)
  let AN = V + W <= 1 ? U * V : U * (1 - W)
  const AO = AG * N * AJ * (1 + Y) * (1 + AH) * (1 + AI)
  const AP = W
  const AQ = AF * N * (1 + AH) * (1 + AI) * AJ
  if (!guaranteedCrit && art.conditionalFinalCrit) {
    if (AN >= art.conditionalFinalCrit.threshold) guaranteedCrit = true
    else AN = Math.min(AN + art.conditionalFinalCrit.bonusBelowThreshold, Math.max(1 - AL - AP, 0))
  }
  const AR = Math.max(1 - AL - AN - AP, 0)

  const P_eff = dotRules ? 0 : P
  const AS = P_eff
  const AU = P_eff
  const AT = (AS + AU) / 2
  const AV = AH
  const AW = AI
  const AX = 1
  const BA = AT * (1 + AW) * (1 + X) * AX * (1 + AV)
  const AY = AS * AX * (1 + AW) * (1 + AV)
  const BC = AU * AX * (1 + Y) * (1 + AV) * (1 + AW)
  const BE = AT * (1 + AV) * (1 + AW) * AX

  const Q_eff = dotRules ? 0 : Q
  const BG = Q_eff
  const BI = Q_eff
  const BH = (BG + BI) / 2
  const attrPen =
    ctx.primaryAttribute === "Bellstrike"
      ? ctx.bellstrike.pen
      : ctx.primaryAttribute === "Stonesplit"
        ? ctx.stonesplit.pen
        : ctx.primaryAttribute === "Silkbind"
          ? ctx.silkbind.pen
          : ctx.bamboocut.pen
  const BJ = attrPen
  const BK = ctx.attributeDmgBoostPanel
  const BL = 1
  const BJpen = penFrac(BJ, attrPenRes)
  const BM = BG * (1 + BJpen) * (1 + BK) * BL
  const BO = BH * (1 + X) * (1 + BJpen) * (1 + BK) * BL
  const BQ = BI * (1 + BJpen) * (1 + BK) * (1 + Y) * BL
  const BS = BH * (1 + BJpen) * (1 + BK) * BL

  const BU: Attribute | "" = isWeapon
    ? ((art.attributeAttack as Attribute | undefined) ?? "")
    : ctx.primaryAttribute

  function attrBlock(attribute: Attribute, block: AttackBlock, pen: number, extraSkillPen: number) {
    const matches = BU === attribute && isWeapon
    const small = block.min + (matches ? ctx.attributePrimaryBonus : 0)
    const large = Math.max(block.max + (matches ? ctx.attributePrimaryBonus : 0), small)
    const avg = (small + large) / 2
    const penBoost = pen + extraSkillPen
    // The Swallowcall low-qi bonus is read twice — see `data/sets/swallowcall.ts`.
    const dmgBoost =
      (BU === attribute ? ctx.attributeDmgBoostPanel : 0) +
      (isLowQi ? setFormulaBonus(ctx.set, "lowQiBambooDamage") : 0)
    const mult = BU === attribute && !dotRules ? O : N
    const setLowQiBonus = isLowQi ? setFormulaBonus(ctx.set, "lowQiBambooDamage") : 0
    const setMul = 1 + setLowQiBonus
    const penMul = 1 + penFrac(penBoost, attrPenRes)
    const graze = small * mult * penMul * (1 + dmgBoost) * setMul
    const crit = avg * mult * penMul * (1 + dmgBoost) * (1 + X) * setMul
    const aff = large * mult * penMul * (1 + dmgBoost) * (1 + Y) * setMul
    const norm = avg * mult * (1 + dmgBoost) * penMul * setMul
    const critMin = small * mult * penMul * (1 + dmgBoost) * (1 + X) * setMul
    const critMax = large * mult * penMul * (1 + dmgBoost) * (1 + X) * setMul
    const normMax = large * mult * (1 + dmgBoost) * penMul * setMul
    return { graze, crit, aff, norm, critMin, critMax, normMax }
  }

  const bell = attrBlock("Bellstrike", ctx.bellstrike, ctx.bellstrike.pen, 0)
  const stone = attrBlock(
    "Stonesplit",
    ctx.stonesplit,
    ctx.stonesplit.pen,
    num(art.extraStonesplitPenetration),
  )
  const silk = attrBlock("Silkbind", ctx.silkbind, ctx.silkbind.pen, 0)
  const bamboo = attrBlock("Bamboocut", ctx.bamboocut, ctx.bamboocut.pen, 0)

  const DZ = AK + AY + BM + bell.graze + stone.graze + silk.graze + bamboo.graze
  const EB = AM + BA + BO + bell.crit + stone.crit + silk.crit + bamboo.crit
  const ED = AO + BC + BQ + bell.aff + stone.aff + silk.aff + bamboo.aff
  const EF = AQ + BE + BS + bell.norm + stone.norm + silk.norm + bamboo.norm
  const EH = DZ * AL + EB * AN + ED * AP + EF * AR

  const AM_min = AE * N * (1 + AI) * (1 + AH) * AJ * (1 + X)
  const AM_max = AG * N * (1 + AI) * (1 + AH) * AJ * (1 + X)
  const AQ_max = AG * N * (1 + AH) * (1 + AI) * AJ
  const normalMin = DZ
  const normalMax = AQ_max + BE + BS + bell.normMax + stone.normMax + silk.normMax + bamboo.normMax
  const critMin = AM_min + BA + BO + bell.critMin + stone.critMin + silk.critMin + bamboo.critMin
  const critMax = AM_max + BA + BO + bell.critMax + stone.critMax + silk.critMax + bamboo.critMax

  const sCol = art.weaponOrAttribute ?? ""
  const weaponBoostMap = ctx.weaponBoosts ?? {}
  const weaponVal = weaponBoostMap[sCol]
  const mysticCategory = art.mysticCategory
  const T =
    (weaponVal !== undefined ? weaponVal + (ctx.allMartialBoost ?? 0) : 0) +
    (mysticCategory ? (ctx.mysticTypeBoosts?.[mysticCategory] ?? 0) : 0)
  const dotMult = isPersistent ? (ctx.dotDamageMultiplier ?? 1) : 1
  const H_total =
    ctx.generalDamageBoost +
    (ctx.allDamageBoost ?? 0) +
    T +
    counters.yiShuiLayer * 0.01 +
    counters.qiExhausted * ctx.fatigueDamageTaken +
    (usesChargeBoost ? ctx.chargeBonus : 0) +
    num(art.extraDamageBoost) +
    (isPersistent
      ? ctx.sustainDmgBoostPanel +
        (ctx.dotDamageMultiplier === undefined ? (ctx.dotDamageBoost ?? 0) : 0)
      : 0)

  // A scoped stat, in the same family as `weaponBoosts` / `mysticTypeBoosts`
  // (folded into `T` above) — but multiplicative here rather than additive
  // inside `H_total`. Do not merge the two: they are different numbers.
  const E_dingYin = art.attuneTag ? (ctx.attuneBoostByTag?.[art.attuneTag] ?? 0) : 0

  const I_corr = num(art.correction) || 1

  // Fixed-damage skills (e.g. Dragon Head) can trigger neither crit, affinity
  // nor abrasion — they always deal the normal row.
  const F_base = guaranteedNormal ? EF : guaranteedCrit ? EB : EH
  const F = F_base * (1 + H_total) * count * I_corr * (1 + E_dingYin) * dotMult

  return {
    expectedDamage: F,
    cells: {
      X,
      Y,
      U,
      V,
      W,
      AE,
      AF,
      AG,
      AH,
      AI,
      AJ,
      AK,
      AL,
      AM,
      AN,
      AO,
      AP,
      AQ,
      AR,
      AS,
      AT,
      AU,
      AV,
      AW,
      AX,
      AY,
      BA,
      BC,
      BE,
      BG,
      BH,
      BI,
      BJ,
      BK,
      BL,
      BM,
      BO,
      BQ,
      BS,
      DZ,
      EB,
      ED,
      EF,
      EH,
      H: H_total,
      E: E_dingYin,
      I: I_corr,
      F,
      normalMin,
      normalMax,
      critMin,
      critMax,
    },
  }
}
