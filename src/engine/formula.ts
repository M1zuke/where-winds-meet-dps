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
  classSpecificAttunement: Record<string, number>
  // The scoped view of `classSpecificAttunement`, keyed by the `attune:` tag an
  // entity declares rather than by the stat's display name.
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
  lowQi: number
}

export function computeSkillDamage(
  art: ArtRow,
  ctx: FormulaContext,
  count: number,
  counters: RotationCounters = { lowQi: 0 },
): SkillResult {
  const numberOrZero = (value: number | undefined) => value ?? 0
  const physCoefficient = numberOrZero(art.physMultiplier)
  const attributeCoefficient = numberOrZero(art.attributeMultiplier)
  const physFlat = numberOrZero(art.physFixed)
  const attributeFlat = numberOrZero(art.attributeFixed)
  const skillType = art.skillType ?? ""
  const isWeapon = skillType === "weapon"
  const isTianGong = skillType === "Heavenwork"
  let guaranteedCrit = art.guaranteedCrit === 1
  const guaranteedPrecision = art.guaranteedPrecision === 1
  const guaranteedNormal = art.guaranteedNormal === 1
  const isPersistent = art.specialTag === "sustain"
  const usesChargeBoost = art.usesChargeBoost === 1
  const usesGyrationUmbrella = art.specialTag === "Spinning Umbrella"

  const physPenResistance = ctx.physPenResistance ?? 0
  const attributePenResistance = ctx.attrPenResistance ?? 0
  // Deliberately INVERTS Midasione PDF §7 (net>0 → ÷200, not ÷100) — see
  // docs/CALCULATION.md § "Calculation rules" rule 2.
  const penetrationFraction = (penetration: number, resistancePercent: number) => {
    const net = penetration - resistancePercent
    return net <= 0 ? net / 100 : net / 200
  }
  // DoT rows lose flat damage and elevated matching-path scaling (PDF §1); a
  // sustain-tagged burst detonation (elevatedAttributeMultiplier defaults
  // true) is NOT demoted — see docs/CALCULATION.md § "Calculation rules" rule 3.
  const getsElevatedMultiplier = art.elevatedAttributeMultiplier ?? true
  const usesDotRules = !getsElevatedMultiplier

  const skillCritDamage = numberOrZero(art.extraCritDamage)
  const critDamageBoost =
    ctx.critDmgBoostPanel + skillCritDamage + setFormulaBonus(ctx.set, "critDamage")

  const skillAffinityDamage = numberOrZero(art.extraAffinityDamage)
  const affinityDamageBoost =
    ctx.affinityDmgBoostPanel + skillAffinityDamage + setFormulaBonus(ctx.set, "affinityDamage")

  const precisionRate = isTianGong || guaranteedPrecision ? 1 : Math.min(ctx.precisionPanel, 1)

  // `ctx.critPanel`/`ctx.affinityPanel` arrive already resisted from
  // `panel.ts`'s white→yellow conversion, so they are never divided here.
  // `art.extraAffinityRate` is the one raw (unconverted) rate source the
  // formula still receives, per PDF §11 divided by (1 + resistance) before
  // the 40 % cap. Exception: Thundercry Blade's (Modao) charged-attack crit
  // rate (`art.extraCritRate`) is a flat, unresisted addition after the cap.
  const rateResistance = ctx.rateResistance ?? 0
  const critRate = isTianGong
    ? 0
    : Math.min(ctx.critPanel, 0.8) +
      ctx.directCritPanel +
      setFormulaBonus(ctx.set, "directCrit") +
      numberOrZero(art.extraCritRate)

  const isLowQi = counters.lowQi === 1
  const affinityRate = isTianGong
    ? 0
    : Math.min(
        ctx.affinityPanel + numberOrZero(art.extraAffinityRate) / (1 + rateResistance),
        0.4,
      ) +
      ctx.directAffinityPanel +
      (isLowQi ? setFormulaBonus(ctx.set, "lowQiDirectAffinityRate") : 0)

  const setPhysBoost = ctx.hawkwingPhysBonus ?? setFormulaBonus(ctx.set, "physBoost")
  const effectivePhys = effectivePhysRange(ctx.smallPhys, ctx.largePhys, ctx.food)
  const physMin =
    (effectivePhys.min + numberOrZero(art.minPhysFlatBonus)) *
      (1 + numberOrZero(art.minPhysPctBonus)) *
      (1 + setPhysBoost) -
    ctx.effectiveDefense

  const physMaxRaw =
    (effectivePhys.max + numberOrZero(art.maxPhysFlatBonus)) *
      (1 + numberOrZero(art.maxPhysPctBonus)) *
      (1 + setPhysBoost) -
    ctx.effectiveDefense
  const physMax = Math.max(physMaxRaw, physMin)

  const physAvg = (physMin + physMax) / 2

  const physPenTotal =
    ctx.outerPen + numberOrZero(art.extraPhysPenetration) + (ctx.hasSixHenZhi ? 10 : 0)
  const physPenFraction = penetrationFraction(physPenTotal, physPenResistance)

  const physDamageBoost = ctx.physDmgBoostPanel + (usesGyrationUmbrella ? 0.15 : 0)

  const physRowScale = 1

  const physGrazeRow =
    physMin * physCoefficient * physRowScale * (1 + physDamageBoost) * (1 + physPenFraction)
  const grazeChance = (1 - precisionRate) * (1 - affinityRate)
  const physCritRow =
    physAvg *
    physCoefficient *
    (1 + physDamageBoost) *
    (1 + physPenFraction) *
    physRowScale *
    (1 + critDamageBoost)
  let critChance =
    critRate + affinityRate <= 1 ? precisionRate * critRate : precisionRate * (1 - affinityRate)
  const physAffinityRow =
    physMax *
    physCoefficient *
    physRowScale *
    (1 + affinityDamageBoost) *
    (1 + physPenFraction) *
    (1 + physDamageBoost)
  const affinityChance = affinityRate
  const physNormalRow =
    physAvg * physCoefficient * (1 + physPenFraction) * (1 + physDamageBoost) * physRowScale
  if (!guaranteedCrit && art.conditionalFinalCrit) {
    if (critChance >= art.conditionalFinalCrit.threshold) guaranteedCrit = true
    else
      critChance = Math.min(
        critChance + art.conditionalFinalCrit.bonusBelowThreshold,
        Math.max(1 - grazeChance - affinityChance, 0),
      )
  }
  const normalChance = Math.max(1 - grazeChance - critChance - affinityChance, 0)

  const physFlatEffective = usesDotRules ? 0 : physFlat
  const physFlatMin = physFlatEffective
  const physFlatMax = physFlatEffective
  const physFlatAvg = (physFlatMin + physFlatMax) / 2
  const physFlatPenFraction = physPenFraction
  const physFlatDamageBoost = physDamageBoost
  const physFlatRowScale = 1
  const physFlatCritRow =
    physFlatAvg *
    (1 + physFlatDamageBoost) *
    (1 + critDamageBoost) *
    physFlatRowScale *
    (1 + physFlatPenFraction)
  const physFlatGrazeRow =
    physFlatMin * physFlatRowScale * (1 + physFlatDamageBoost) * (1 + physFlatPenFraction)
  const physFlatAffinityRow =
    physFlatMax *
    physFlatRowScale *
    (1 + affinityDamageBoost) *
    (1 + physFlatPenFraction) *
    (1 + physFlatDamageBoost)
  const physFlatNormalRow =
    physFlatAvg * (1 + physFlatPenFraction) * (1 + physFlatDamageBoost) * physFlatRowScale

  const attributeFlatEffective = usesDotRules ? 0 : attributeFlat
  const attributeFlatMin = attributeFlatEffective
  const attributeFlatMax = attributeFlatEffective
  const attributeFlatAvg = (attributeFlatMin + attributeFlatMax) / 2
  const primaryAttributePenetration =
    ctx.primaryAttribute === "Bellstrike"
      ? ctx.bellstrike.pen
      : ctx.primaryAttribute === "Stonesplit"
        ? ctx.stonesplit.pen
        : ctx.primaryAttribute === "Silkbind"
          ? ctx.silkbind.pen
          : ctx.bamboocut.pen
  const attributeFlatPenetration = primaryAttributePenetration
  const attributeDamageBoost = ctx.attributeDmgBoostPanel
  const attributeFlatRowScale = 1
  const attributeFlatPenFraction = penetrationFraction(
    attributeFlatPenetration,
    attributePenResistance,
  )
  const attributeFlatGrazeRow =
    attributeFlatMin *
    (1 + attributeFlatPenFraction) *
    (1 + attributeDamageBoost) *
    attributeFlatRowScale
  const attributeFlatCritRow =
    attributeFlatAvg *
    (1 + critDamageBoost) *
    (1 + attributeFlatPenFraction) *
    (1 + attributeDamageBoost) *
    attributeFlatRowScale
  const attributeFlatAffinityRow =
    attributeFlatMax *
    (1 + attributeFlatPenFraction) *
    (1 + attributeDamageBoost) *
    (1 + affinityDamageBoost) *
    attributeFlatRowScale
  const attributeFlatNormalRow =
    attributeFlatAvg *
    (1 + attributeFlatPenFraction) *
    (1 + attributeDamageBoost) *
    attributeFlatRowScale

  const scalingAttribute: Attribute | "" = isWeapon
    ? ((art.attributeAttack as Attribute | undefined) ?? "")
    : ctx.primaryAttribute

  function attributeRows(
    attribute: Attribute,
    block: AttackBlock,
    penetration: number,
    extraSkillPenetration: number,
  ) {
    const isScalingAttribute = scalingAttribute === attribute && isWeapon
    const minAttack = block.min + (isScalingAttribute ? ctx.attributePrimaryBonus : 0)
    const maxAttack = Math.max(
      block.max + (isScalingAttribute ? ctx.attributePrimaryBonus : 0),
      minAttack,
    )
    const avgAttack = (minAttack + maxAttack) / 2
    const penetrationTotal = penetration + extraSkillPenetration
    // The Swallowcall low-qi bonus is read twice — see `data/sets/swallowcall.ts`.
    const damageBoost =
      (scalingAttribute === attribute ? ctx.attributeDmgBoostPanel : 0) +
      (isLowQi ? setFormulaBonus(ctx.set, "lowQiBambooDamage") : 0)
    const coefficient =
      scalingAttribute === attribute && !usesDotRules ? attributeCoefficient : physCoefficient
    const setLowQiBonus = isLowQi ? setFormulaBonus(ctx.set, "lowQiBambooDamage") : 0
    const setMultiplier = 1 + setLowQiBonus
    const penetrationMultiplier = 1 + penetrationFraction(penetrationTotal, attributePenResistance)
    const grazeRow =
      minAttack * coefficient * penetrationMultiplier * (1 + damageBoost) * setMultiplier
    const critRow =
      avgAttack *
      coefficient *
      penetrationMultiplier *
      (1 + damageBoost) *
      (1 + critDamageBoost) *
      setMultiplier
    const affinityRow =
      maxAttack *
      coefficient *
      penetrationMultiplier *
      (1 + damageBoost) *
      (1 + affinityDamageBoost) *
      setMultiplier
    const normalRow =
      avgAttack * coefficient * (1 + damageBoost) * penetrationMultiplier * setMultiplier
    const critRowMin =
      minAttack *
      coefficient *
      penetrationMultiplier *
      (1 + damageBoost) *
      (1 + critDamageBoost) *
      setMultiplier
    const critRowMax =
      maxAttack *
      coefficient *
      penetrationMultiplier *
      (1 + damageBoost) *
      (1 + critDamageBoost) *
      setMultiplier
    const normalRowMax =
      maxAttack * coefficient * (1 + damageBoost) * penetrationMultiplier * setMultiplier
    return { grazeRow, critRow, affinityRow, normalRow, critRowMin, critRowMax, normalRowMax }
  }

  const bellstrike = attributeRows("Bellstrike", ctx.bellstrike, ctx.bellstrike.pen, 0)
  const stonesplit = attributeRows(
    "Stonesplit",
    ctx.stonesplit,
    ctx.stonesplit.pen,
    numberOrZero(art.extraStonesplitPenetration),
  )
  const silkbind = attributeRows("Silkbind", ctx.silkbind, ctx.silkbind.pen, 0)
  const bamboocut = attributeRows("Bamboocut", ctx.bamboocut, ctx.bamboocut.pen, 0)

  const grazeTotal =
    physGrazeRow +
    physFlatGrazeRow +
    attributeFlatGrazeRow +
    bellstrike.grazeRow +
    stonesplit.grazeRow +
    silkbind.grazeRow +
    bamboocut.grazeRow
  const critTotal =
    physCritRow +
    physFlatCritRow +
    attributeFlatCritRow +
    bellstrike.critRow +
    stonesplit.critRow +
    silkbind.critRow +
    bamboocut.critRow
  const affinityTotal =
    physAffinityRow +
    physFlatAffinityRow +
    attributeFlatAffinityRow +
    bellstrike.affinityRow +
    stonesplit.affinityRow +
    silkbind.affinityRow +
    bamboocut.affinityRow
  const normalTotal =
    physNormalRow +
    physFlatNormalRow +
    attributeFlatNormalRow +
    bellstrike.normalRow +
    stonesplit.normalRow +
    silkbind.normalRow +
    bamboocut.normalRow
  const expectedTotal =
    grazeTotal * grazeChance +
    critTotal * critChance +
    affinityTotal * affinityChance +
    normalTotal * normalChance

  const physCritRowMin =
    physMin *
    physCoefficient *
    (1 + physDamageBoost) *
    (1 + physPenFraction) *
    physRowScale *
    (1 + critDamageBoost)
  const physCritRowMax =
    physMax *
    physCoefficient *
    (1 + physDamageBoost) *
    (1 + physPenFraction) *
    physRowScale *
    (1 + critDamageBoost)
  const physNormalRowMax =
    physMax * physCoefficient * (1 + physPenFraction) * (1 + physDamageBoost) * physRowScale
  const normalMin = grazeTotal
  const normalMax =
    physNormalRowMax +
    physFlatNormalRow +
    attributeFlatNormalRow +
    bellstrike.normalRowMax +
    stonesplit.normalRowMax +
    silkbind.normalRowMax +
    bamboocut.normalRowMax
  const critMin =
    physCritRowMin +
    physFlatCritRow +
    attributeFlatCritRow +
    bellstrike.critRowMin +
    stonesplit.critRowMin +
    silkbind.critRowMin +
    bamboocut.critRowMin
  const critMax =
    physCritRowMax +
    physFlatCritRow +
    attributeFlatCritRow +
    bellstrike.critRowMax +
    stonesplit.critRowMax +
    silkbind.critRowMax +
    bamboocut.critRowMax

  const weaponOrAttributeKey = art.weaponOrAttribute ?? ""
  const weaponBoostMap = ctx.weaponBoosts ?? {}
  const weaponBoost = weaponBoostMap[weaponOrAttributeKey]
  const mysticCategory = art.mysticCategory
  const scopedDamageBoost =
    (weaponBoost !== undefined ? weaponBoost + (ctx.allMartialBoost ?? 0) : 0) +
    (mysticCategory ? (ctx.mysticTypeBoosts?.[mysticCategory] ?? 0) : 0)
  const dotMultiplier = isPersistent ? (ctx.dotDamageMultiplier ?? 1) : 1
  const damageBoostTotal =
    ctx.generalDamageBoost +
    (ctx.allDamageBoost ?? 0) +
    scopedDamageBoost +
    (usesChargeBoost ? ctx.chargeBonus : 0) +
    numberOrZero(art.extraDamageBoost) +
    (isPersistent
      ? ctx.sustainDmgBoostPanel +
        (ctx.dotDamageMultiplier === undefined ? (ctx.dotDamageBoost ?? 0) : 0)
      : 0)

  // A scoped stat, in the same family as `weaponBoosts` / `mysticTypeBoosts`
  // (folded into `scopedDamageBoost` above) — but multiplicative here rather
  // than additive inside `damageBoostTotal`. Do not merge the two: they are
  // different numbers.
  const attuneBoost = art.attuneTag ? (ctx.attuneBoostByTag?.[art.attuneTag] ?? 0) : 0

  const correction = numberOrZero(art.correction) || 1

  // Fixed-damage skills (e.g. Dragon Head) can trigger neither crit, affinity
  // nor abrasion — they always deal the normal row.
  const selectedRowTotal = guaranteedNormal
    ? normalTotal
    : guaranteedCrit
      ? critTotal
      : expectedTotal
  const expectedDamage =
    selectedRowTotal *
    (1 + damageBoostTotal) *
    count *
    correction *
    (1 + attuneBoost) *
    dotMultiplier

  // Keys are the source workbook's cell coordinates — a breakdown row stays
  // cross-checkable against the spreadsheet this was ported from.
  return {
    expectedDamage,
    cells: {
      X: critDamageBoost,
      Y: affinityDamageBoost,
      U: precisionRate,
      V: critRate,
      W: affinityRate,
      AE: physMin,
      AF: physAvg,
      AG: physMax,
      AH: physPenFraction,
      AI: physDamageBoost,
      AJ: physRowScale,
      AK: physGrazeRow,
      AL: grazeChance,
      AM: physCritRow,
      AN: critChance,
      AO: physAffinityRow,
      AP: affinityChance,
      AQ: physNormalRow,
      AR: normalChance,
      AS: physFlatMin,
      AT: physFlatAvg,
      AU: physFlatMax,
      AV: physFlatPenFraction,
      AW: physFlatDamageBoost,
      AX: physFlatRowScale,
      AY: physFlatGrazeRow,
      BA: physFlatCritRow,
      BC: physFlatAffinityRow,
      BE: physFlatNormalRow,
      BG: attributeFlatMin,
      BH: attributeFlatAvg,
      BI: attributeFlatMax,
      BJ: attributeFlatPenetration,
      BK: attributeDamageBoost,
      BL: attributeFlatRowScale,
      BM: attributeFlatGrazeRow,
      BO: attributeFlatCritRow,
      BQ: attributeFlatAffinityRow,
      BS: attributeFlatNormalRow,
      DZ: grazeTotal,
      EB: critTotal,
      ED: affinityTotal,
      EF: normalTotal,
      EH: expectedTotal,
      H: damageBoostTotal,
      E: attuneBoost,
      I: correction,
      F: expectedDamage,
      normalMin,
      normalMax,
      critMin,
      critMax,
    },
  }
}
