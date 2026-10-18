import type { Arsenal, Inputs } from "../../../../engine/types"
import { arsenalAttack, defaultArsenalForClass, swapArsenal } from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import { deltaTone, type OptionTileTone } from "../../../components/option-tile/optionTileTone"
import { useArsenalTileDps } from "../../../hooks/useArsenalTileDps"
import styles from "./ArsenalChoicePanel.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

interface OptionRow {
  key: string
  label: string
  bonus: string
  delta: number
  selected: boolean
  onSelect: () => void
}

const ARSENAL_TILES: { choice: Arsenal; labelKey: string }[] = [
  { choice: "general", labelKey: "common.generalArsenal" },
  { choice: "bellstrike", labelKey: "common.bellstrikeArsenal" },
  { choice: "stonesplit", labelKey: "common.stonesplitArsenal" },
  { choice: "silkbind", labelKey: "common.silkbindArsenal" },
  { choice: "bamboocut", labelKey: "common.bamboocutArsenal" },
]

const ARSENAL_STAT_KEYS: Readonly<Record<Arsenal, string>> = {
  general: "common.phys",
  bellstrike: "content.attributeAttack.Bellstrike",
  stonesplit: "content.attributeAttack.Stonesplit",
  silkbind: "content.attributeAttack.Silkbind",
  bamboocut: "content.attributeAttack.Bamboocut",
}

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

function sortByDeltaDesc(rows: OptionRow[]): OptionRow[] {
  const finite = rows.filter((row) => Number.isFinite(row.delta))
  const nonFinite = rows.filter((row) => !Number.isFinite(row.delta))
  finite.sort((left, right) => right.delta - left.delta)
  return [...finite, ...nonFinite]
}

function buildArsenalRows(
  inputs: Inputs,
  arsenalDpsByChoice: Record<string, number> | undefined,
  onChange: (next: Inputs) => void,
  t: (key: string, fallback?: string) => string,
): OptionRow[] {
  const currentDps = arsenalDpsByChoice?.[inputs.arsenal] ?? Number.NaN
  const visibleChoices = new Set<Arsenal>([
    "general",
    defaultArsenalForClass(inputs.classId),
    inputs.arsenal,
  ])
  const attack = arsenalAttack(inputs.breakthrough, inputs.arsenalScores)
  return ARSENAL_TILES.filter((tile) => visibleChoices.has(tile.choice)).map((tile) => {
    const dps = arsenalDpsByChoice?.[tile.choice] ?? Number.NaN
    return {
      key: tile.choice,
      label: t(tile.labelKey),
      bonus: `+${attack.min} / +${attack.max} ${t(ARSENAL_STAT_KEYS[tile.choice])}`,
      delta: dps - currentDps,
      selected: inputs.arsenal === tile.choice,
      onSelect: () => onChange(swapArsenal(inputs, tile.choice)),
    }
  })
}

export function ArsenalChoicePanel({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const { data, isPending } = useArsenalTileDps(inputs)

  const arsenalRows = sortByDeltaDesc(
    buildArsenalRows(inputs, data?.arsenalDpsByChoice, onChange, t),
  )

  return (
    <div style={{ opacity: isPending ? 0.6 : 1 }}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("talents.arsenal.choice.option")}</th>
            <th>{t("talents.arsenal.choice.bonus")}</th>
            <th>{t("common.dpsDelta")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} className={styles.groupHeader}>
              {t("common.arsenal")}
            </td>
          </tr>
          {arsenalRows.map((row) => (
            <OptionRowView key={row.key} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OptionRowView({ row }: { row: OptionRow }) {
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
            name="arsenalChoice"
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
        {row.selected ? t("common.active") : fmtDelta(row.delta)}
      </td>
    </tr>
  )
}
