import type { Inputs } from "../../../engine/types"
import { withDerivedStats, equippedPiecesFor } from "../../../engine/derivedInputs"
import { totalPlayerAttributes } from "../../../definitions/baseStats"
import { FOOD_MIN_PHYS_BONUS, FOOD_MAX_PHYS_BONUS } from "../../../engine/formula"
import { getAttunement } from "../../../engine/attunements"
import { applyArmorSet, applyBowSet, effectiveRates, getSchool } from "../../../engine/panel"
import { useI18n } from "../../../i18n/i18nContext"
import { fmt, PATH_LABELS, PERCENT_PATHS, readPath } from "../../utils/statFormatting"
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

  const attrs = totalPlayerAttributes(inputs.breakthrough, equippedPiecesFor(inputs))
  const attributeRows: RowEntry[] = [
    row(t("Power"), attrs.power, false),
    row(t("Agility"), attrs.agility, false),
    row(t("Momentum"), attrs.momentum, false),
  ]

  const rateRows: RowEntry[] = [
    row(t(PATH_LABELS.precision), withSets.precision, true, eff.precision),
    row(t(PATH_LABELS.critRate), withSets.critRate, true, eff.critRate),
    row(t(PATH_LABELS.affinityRate), withSets.affinityRate, true, eff.affinityRate),
    row(t(PATH_LABELS.directCritRate), withSets.directCritRate, true),
    row(t(PATH_LABELS.directAffinityRate), withSets.directAffinityRate, true),
    row(t("Final Crit"), finalRates.critRate, true),
    row(t("Final Affinity"), finalRates.affinityRate, true),
  ]

  const physMin = readPath(withSets, "phys.min")
  const physMax = readPath(withSets, "phys.max")
  const attackRows: RowEntry[] = [
    row(
      t(PATH_LABELS["phys.min"]),
      physMin,
      false,
      withSets.food ? physMin + FOOD_MIN_PHYS_BONUS : undefined,
    ),
    row(
      t(PATH_LABELS["phys.max"]),
      physMax,
      false,
      withSets.food ? physMax + FOOD_MAX_PHYS_BONUS : undefined,
    ),
  ]
  const penetrationRows: RowEntry[] = [
    row(
      t(PATH_LABELS["phys.penetration"]),
      readPath(withSets, "phys.penetration"),
      false,
      undefined,
      true,
    ),
  ]
  for (const key of ATTRIBUTE_BLOCKS) {
    const min = readPath(withSets, `${key}.min`)
    const max = readPath(withSets, `${key}.max`)
    const pen = readPath(withSets, `${key}.penetration`)
    if (min !== 0 || max !== 0) {
      attackRows.push(
        row(t(PATH_LABELS[`${key}.min`]), min, false),
        row(t(PATH_LABELS[`${key}.max`]), max, false),
      )
    }
    if (pen !== 0) {
      penetrationRows.push(row(t(PATH_LABELS[`${key}.penetration`]), pen, false, undefined, true))
    }
  }

  const damageBoostRows: RowEntry[] = DAMAGE_BOOST_PATHS.map((path) =>
    row(t(PATH_LABELS[path] ?? path), readPath(withSets, path), PERCENT_PATHS.has(path)),
  )

  const martialBoostRows: RowEntry[] = MARTIAL_BOOST_PATHS.map((path) =>
    row(t(PATH_LABELS[path] ?? path), readPath(withSets, path), PERCENT_PATHS.has(path)),
  ).filter((entry) => entry.value !== 0)
  const targetBoostRows: RowEntry[] = TARGET_BOOST_PATHS.map((path) =>
    row(t(PATH_LABELS[path] ?? path), readPath(withSets, path), PERCENT_PATHS.has(path)),
  ).filter((entry) => entry.value !== 0)

  const classBuffRows: RowEntry[] = school.classSpecificAttunements.map((attunementId) =>
    row(
      t(getAttunement(attunementId)?.label ?? attunementId),
      withSets.classSpecificAttunement[attunementId] ?? 0,
      true,
    ),
  )

  return (
    <div className={styles.statsOverview}>
      <Section title={t("Attributes")} rows={attributeRows} />
      <Section title={t("Three Rates")} rows={rateRows} />
      <Section title={t("Attack & Penetration")} rows={[...attackRows, ...penetrationRows]} />
      <Section
        title={t("Damage Boosts")}
        rows={[...damageBoostRows, ...martialBoostRows, ...targetBoostRows]}
      />
      {classBuffRows.length > 0 && <Section title={t("Class Buffs")} rows={classBuffRows} />}
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
