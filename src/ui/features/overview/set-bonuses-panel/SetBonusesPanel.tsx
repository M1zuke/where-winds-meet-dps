import type { Arsenal, BowSet, Inputs } from "../../../../engine/types"
import {
  ARMOR_SET_OPTIONS,
  ARSENAL_BONUS,
  BOW_SET_BONUS,
  defaultArsenalForClass,
  swapArsenal,
} from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import { deltaTone, type OptionTileTone } from "../../../components/option-tile/optionTileTone"
import styles from "./SetBonusesPanel.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
  armorDpsByKey?: Record<string, number>
  bowDpsByChoice?: { affinity: number; crit: number; precision: number; none: number }
  arsenalDpsByChoice?: Record<string, number>
  isPending?: boolean
}

interface OptionRow {
  key: string
  label: string
  bonus: string
  delta: number
  selected: boolean
  onSelect: () => void
}

const STAT_TO_I18N_KEY: Readonly<Record<string, string>> = {
  affinityRate: "Affinity",
  critRate: "Crit",
  precisionRate: "Precision",
  maxPhys: "Max Phys",
  minPhys: "Min Phys",
}

const BOW_TILES: { choice: BowSet; label: string; bonusValue: number }[] = [
  { choice: "affinity", label: "Affinity", bonusValue: BOW_SET_BONUS.affinity },
  { choice: "crit", label: "Crit", bonusValue: BOW_SET_BONUS.crit },
  { choice: "precision", label: "Precision", bonusValue: BOW_SET_BONUS.precision },
  { choice: null, label: "(unselected)", bonusValue: 0 },
]

const ARSENAL_TILES: { choice: Arsenal; label: string; statKey: string }[] = [
  { choice: "general", label: "General Arsenal", statKey: "Phys" },
  { choice: "bellstrike", label: "Bellstrike Arsenal", statKey: "Bellstrike" },
  { choice: "stonesplit", label: "Stonesplit Arsenal", statKey: "Stonesplit" },
  { choice: "silkbind", label: "Silkbind Arsenal", statKey: "Silkbind" },
  { choice: "bamboocut", label: "Bamboocut Arsenal", statKey: "Bamboocut" },
]

const TONE_CLASS: Record<OptionTileTone, string> = {
  neutral: "",
  positive: styles.deltaPositive,
  negative: styles.deltaNegative,
  current: styles.deltaActive,
}

function fmtDelta(delta: number): string {
  if (!Number.isFinite(delta)) return "—"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function bonusValueLabel(value: number, isFlat: boolean): string {
  if (value === 0) return ""
  return isFlat ? `+${value}` : `+${(value * 100).toFixed(1)}%`
}

function bonusWithStatLabel(
  t: (text: string) => string,
  statKey: string,
  value: number,
  isFlat: boolean,
): string {
  if (!statKey || value === 0) return ""
  return `${bonusValueLabel(value, isFlat)} ${t(statKey)}`
}

function sortByDeltaDesc(rows: OptionRow[]): OptionRow[] {
  const finite = rows.filter((row) => Number.isFinite(row.delta))
  const nonFinite = rows.filter((row) => !Number.isFinite(row.delta))
  finite.sort((a, b) => b.delta - a.delta)
  return [...finite, ...nonFinite]
}

function buildArmorRows(
  inputs: Inputs,
  armorDpsByKey: Record<string, number> | undefined,
  onChange: (next: Inputs) => void,
  t: (text: string) => string,
): OptionRow[] {
  const armorSelectedKey = ARMOR_SET_OPTIONS.some((opt) => opt.setKey === inputs.set)
    ? inputs.set
    : null
  const currentDps =
    inputs.set && armorDpsByKey?.[inputs.set] !== undefined
      ? armorDpsByKey[inputs.set]
      : (armorDpsByKey?.__none ?? Number.NaN)

  const rows: OptionRow[] = ARMOR_SET_OPTIONS.map((opt) => {
    const statKey = opt.stat ? (STAT_TO_I18N_KEY[opt.stat] ?? opt.stat) : ""
    const isFlat = opt.stat === "maxPhys" || opt.stat === "minPhys"
    const dps = armorDpsByKey?.[opt.setKey] ?? Number.NaN
    return {
      key: opt.setKey,
      label: t(opt.name),
      bonus: bonusWithStatLabel(t, statKey, opt.value ?? 0, isFlat),
      delta: dps - currentDps,
      selected: armorSelectedKey === opt.setKey,
      onSelect: () => onChange({ ...inputs, set: opt.setKey }),
    }
  })

  const noneDps = armorDpsByKey?.__none ?? Number.NaN
  rows.push({
    key: "__none",
    label: t("(unselected)"),
    bonus: "",
    delta: noneDps - currentDps,
    selected: armorSelectedKey === null,
    onSelect: () => onChange({ ...inputs, set: null }),
  })

  return rows
}

function bowDps(
  choice: BowSet,
  table: { affinity: number; crit: number; precision: number; none: number } | undefined,
): number {
  if (!table) return Number.NaN
  switch (choice) {
    case "affinity":
      return table.affinity
    case "crit":
      return table.crit
    case "precision":
      return table.precision
    default:
      return table.none
  }
}

function buildBowRows(
  inputs: Inputs,
  bowDpsByChoice: { affinity: number; crit: number; precision: number; none: number } | undefined,
  onChange: (next: Inputs) => void,
  t: (text: string) => string,
): OptionRow[] {
  const currentDps = bowDps(inputs.bowSet, bowDpsByChoice)
  return BOW_TILES.map((tile) => {
    const dps = bowDps(tile.choice, bowDpsByChoice)
    return {
      key: tile.choice ?? "none",
      label: t(tile.label),
      bonus: bonusValueLabel(tile.bonusValue, false),
      delta: dps - currentDps,
      selected: inputs.bowSet === tile.choice,
      onSelect: () => onChange({ ...inputs, bowSet: tile.choice }),
    }
  })
}

function buildArsenalRows(
  inputs: Inputs,
  arsenalDpsByChoice: Record<string, number> | undefined,
  onChange: (next: Inputs) => void,
  t: (text: string) => string,
): OptionRow[] {
  const currentDps = arsenalDpsByChoice?.[inputs.arsenal] ?? Number.NaN
  const visibleChoices = new Set<Arsenal>([
    "general",
    defaultArsenalForClass(inputs.classId),
    inputs.arsenal,
  ])
  return ARSENAL_TILES.filter((tile) => visibleChoices.has(tile.choice)).map((tile) => {
    const dps = arsenalDpsByChoice?.[tile.choice] ?? Number.NaN
    return {
      key: tile.choice,
      label: t(tile.label),
      bonus: `+${ARSENAL_BONUS.min} / +${ARSENAL_BONUS.max} ${tile.statKey}`,
      delta: dps - currentDps,
      selected: inputs.arsenal === tile.choice,
      onSelect: () => onChange(swapArsenal(inputs, tile.choice)),
    }
  })
}

export function SetBonusesPanel({
  inputs,
  onChange,
  armorDpsByKey,
  bowDpsByChoice,
  arsenalDpsByChoice,
  isPending,
}: Props) {
  const { t } = useI18n()

  const armorRows = sortByDeltaDesc(buildArmorRows(inputs, armorDpsByKey, onChange, t))
  const bowRows = sortByDeltaDesc(buildBowRows(inputs, bowDpsByChoice, onChange, t))
  const arsenalRows = sortByDeltaDesc(buildArsenalRows(inputs, arsenalDpsByChoice, onChange, t))

  return (
    <div style={{ opacity: isPending ? 0.6 : 1 }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("Option")}</th>
            <th>{t("Bonus")}</th>
            <th>{t("DPS Δ")}</th>
          </tr>
        </thead>
        <tbody>
          <OptionGroup title={t("Armor Set")} rows={armorRows} groupName="setBonusesArmor" />
          <OptionGroup title={t("Bow Set")} rows={bowRows} groupName="setBonusesBow" />
          <OptionGroup title={t("Arsenal")} rows={arsenalRows} groupName="setBonusesArsenal" />
        </tbody>
      </table>
    </div>
  )
}

function OptionGroup({
  title,
  rows,
  groupName,
}: {
  title: string
  rows: OptionRow[]
  groupName: string
}) {
  return (
    <>
      <tr>
        <td colSpan={3} className={styles.groupHeader}>
          {title}
        </td>
      </tr>
      {rows.map((row) => (
        <OptionRowView key={row.key} row={row} groupName={groupName} />
      ))}
    </>
  )
}

function OptionRowView({ row, groupName }: { row: OptionRow; groupName: string }) {
  const { t } = useI18n()
  const toneClass = TONE_CLASS[row.selected ? "current" : deltaTone(row.delta)]
  return (
    <tr
      className={styles.row + (row.selected ? ` ${styles.rowSelected}` : "")}
      onClick={row.onSelect}
    >
      <td>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name={groupName}
            className={styles.radioInput}
            checked={row.selected}
            onChange={row.onSelect}
          />
          <span className={styles.dot + (row.selected ? ` ${styles.dotSelected}` : "")} />
          <span className={row.selected ? styles.nameSelected : undefined}>{row.label}</span>
        </label>
      </td>
      <td className={styles.bonusCell}>{row.bonus}</td>
      <td className={`${styles.deltaCell} ${toneClass}`}>
        {row.selected ? t("Active") : fmtDelta(row.delta)}
      </td>
    </tr>
  )
}
