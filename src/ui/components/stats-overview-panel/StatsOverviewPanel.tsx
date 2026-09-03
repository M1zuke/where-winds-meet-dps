import type { Inputs } from "../../../engine/types"
import { withDerivedStats, equippedPiecesFor } from "../../../engine/derivedInputs"
import { totalFormlessAttack, totalPlayerAttributes } from "../../../definitions/baseStats"
import { FOOD_MIN_PHYS_BONUS, FOOD_MAX_PHYS_BONUS } from "../../../engine/formula"
import { attunementLabel, attunementLabelKey, getAttunement } from "../../../engine/attunements"
import { applyArmorSet, applyBowSet, effectiveRates, getSchool } from "../../../engine/panel"
import { resolveEnginePath } from "../../../engine/statPaths"
import { useI18n } from "../../../i18n/i18nContext"
import { fmt, PERCENT_PATHS, readPath, statPathLabel } from "../../utils/statFormatting"
import { finalCritAffinityRates } from "./finalCritAffinityRates"
import styles from "./StatsOverviewPanel.module.scss"

interface Props {
  inputs: Inputs
}

const ATTRIBUTE_BLOCKS: ("bellstrike" | "stonesplit" | "silkbind" | "bamboocut")[] = [
  "bellstrike",
  "stonesplit",
  "silkbind",
  "bamboocut",
]

const DAMAGE_BOOST_PATHS = [
  "physBoost",
  "critDamageBoost",
  "affinityDamageBoost",
  "attributeDamageBoost",
  "sustainDamageBoost",
]

const MARTIAL_BOOST_PATHS = [
  "allMartialBoost",
  "swordBoost",
  "spearBoost",
  "fanBoost",
  "umbrellaBoost",
  "modaoBoost",
  "dualKnivesBoost",
  "ropeDartBoost",
  "hengDaoBoost",
]

const TARGET_BOOST_PATHS = ["bossBoost", "singleMysticBoost", "areaMysticBoost"]

interface RowEntry {
  label: string
  value: number
  effective?: number
  isPercent: boolean
  isPenetration?: boolean
}

function row(
  label: string,
  value: number,
  isPercent: boolean,
  effective?: number,
  isPenetration?: boolean,
): RowEntry {
  return { label, value, isPercent, effective, isPenetration }
}

export function StatsOverviewPanel({ inputs }: Props) {
  const { t } = useI18n()
  const school = getSchool(inputs.classId)

  const derived = withDerivedStats(inputs)
  const withSets = applyBowSet(applyArmorSet(derived))

  const eff = effectiveRates(withSets)
  const finalRates = finalCritAffinityRates({
    precision: eff.precision,
    critRate: eff.critRate,
    directCritRate: withSets.directCritRate,
    affinityRate: eff.affinityRate,
    directAffinityRate: withSets.directAffinityRate,
  })

  const equippedPieces = equippedPiecesFor(inputs)
  const attrs = totalPlayerAttributes(inputs.breakthrough, equippedPieces)
  const attributeRows: RowEntry[] = [
    row(t("content.statLine.power"), attrs.power, false),
    row(t("content.statLine.agility"), attrs.agility, false),
    row(t("content.statLine.momentum"), attrs.momentum, false),
  ]

  const rateRows: RowEntry[] = [
    row(statPathLabel("precision", t), withSets.precision, true, eff.precision),
    row(statPathLabel("critRate", t), withSets.critRate, true, eff.critRate),
    row(statPathLabel("affinityRate", t), withSets.affinityRate, true, eff.affinityRate),
    row(statPathLabel("directCritRate", t), withSets.directCritRate, true),
    row(statPathLabel("directAffinityRate", t), withSets.directAffinityRate, true),
    row(t("components.statsOverviewPanel.finalCrit"), finalRates.critRate, true),
    row(t("components.statsOverviewPanel.finalAffinity"), finalRates.affinityRate, true),
  ]

  const physMin = readPath(withSets, "phys.min")
  const physMax = readPath(withSets, "phys.max")
  const attackRows: RowEntry[] = [
    row(
      statPathLabel("phys.min", t),
      physMin,
      false,
      withSets.food ? physMin + FOOD_MIN_PHYS_BONUS : undefined,
    ),
    row(
      statPathLabel("phys.max", t),
      physMax,
      false,
      withSets.food ? physMax + FOOD_MAX_PHYS_BONUS : undefined,
    ),
  ]
  const penetrationRows: RowEntry[] = [
    row(
      statPathLabel("phys.penetration", t),
      readPath(withSets, "phys.penetration"),
      false,
      undefined,
      true,
    ),
  ]
  const formless = totalFormlessAttack(inputs, equippedPieces)
  const primaryMinPath = resolveEnginePath("primaryAttr.min", inputs)
  const primaryMaxPath = resolveEnginePath("primaryAttr.max", inputs)
  for (const key of ATTRIBUTE_BLOCKS) {
    const ownMin =
      readPath(withSets, `${key}.min`) - (`${key}.min` === primaryMinPath ? formless.min : 0)
    const ownMax =
      readPath(withSets, `${key}.max`) - (`${key}.max` === primaryMaxPath ? formless.max : 0)
    const pen = readPath(withSets, `${key}.penetration`)
    if (ownMin !== 0 || ownMax !== 0) {
      attackRows.push(
        row(statPathLabel(`${key}.min`, t), ownMin, false),
        row(statPathLabel(`${key}.max`, t), ownMax, false),
      )
    }
    if (pen !== 0) {
      penetrationRows.push(row(statPathLabel(`${key}.penetration`, t), pen, false, undefined, true))
    }
  }
  attackRows.push(
    row(t("content.statLine.minFormless"), formless.min, false),
    row(t("content.statLine.maxFormless"), formless.max, false),
  )

  const damageBoostRows: RowEntry[] = DAMAGE_BOOST_PATHS.map((path) =>
    row(statPathLabel(path, t), readPath(withSets, path), PERCENT_PATHS.has(path)),
  )

  const martialBoostRows: RowEntry[] = MARTIAL_BOOST_PATHS.map((path) =>
    row(statPathLabel(path, t), readPath(withSets, path), PERCENT_PATHS.has(path)),
  ).filter((entry) => entry.value !== 0)
  const targetBoostRows: RowEntry[] = TARGET_BOOST_PATHS.map((path) =>
    row(statPathLabel(path, t), readPath(withSets, path), PERCENT_PATHS.has(path)),
  ).filter((entry) => entry.value !== 0)

  const classBuffRows: RowEntry[] = school.classSpecificAttunements.map((attunementId) => {
    const option = getAttunement(attunementId)
    return row(
      option ? t(attunementLabelKey(option, null), attunementLabel(option, null)) : attunementId,
      withSets.classSpecificAttunement[attunementId] ?? 0,
      true,
    )
  })

  return (
    <div className={styles.statsOverview}>
      <Section title={t("components.statsOverviewPanel.attributes")} rows={attributeRows} />
      <Section title={t("components.statsOverviewPanel.threeRates")} rows={rateRows} />
      <Section
        title={t("components.statsOverviewPanel.attackPenetration")}
        rows={[...attackRows, ...penetrationRows]}
      />
      <Section
        title={t("components.statsOverviewPanel.damageBoosts")}
        rows={[...damageBoostRows, ...martialBoostRows, ...targetBoostRows]}
      />
      {classBuffRows.length > 0 && <Section title={t("common.classBuffs")} rows={classBuffRows} />}
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: RowEntry[] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className={styles.statsOverviewSectionHead}>{title}</div>
      <div className={styles.statsOverviewGrid}>
        {rows.map((entry, index) => (
          <div key={index} className={styles.statsOverviewRow}>
            <div className={styles.statsOverviewLabel} title={entry.label}>
              {entry.label}
            </div>
            <div className={styles.statsOverviewValue}>
              {fmt(entry.value, entry.isPercent, entry.isPenetration)}
              {entry.effective !== undefined && (
                <span className={styles.statsOverviewEff}>
                  {" → "}
                  {fmt(entry.effective, entry.isPercent, entry.isPenetration)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
