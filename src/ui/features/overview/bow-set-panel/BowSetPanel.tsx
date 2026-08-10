import type { BowSet, Inputs } from "../../../../engine/types"
import { ARMOR_SET_OPTIONS, BOW_SET_BONUS } from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import setTiles from "../shared/setTiles.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
  armorDpsByKey?: Record<string, number>
  bowDpsByChoice?: { affinity: number; crit: number; precision: number; none: number }
  isPending?: boolean
}

interface BowTile {
  choice: BowSet
  label: string
  bonusValue: number
}

const BOW_TILES: BowTile[] = [
  { choice: "affinity", label: "Affinity", bonusValue: BOW_SET_BONUS.affinity },
  { choice: "crit", label: "Crit", bonusValue: BOW_SET_BONUS.crit },
  { choice: "precision", label: "Precision", bonusValue: BOW_SET_BONUS.precision },
  { choice: null, label: "(unselected)", bonusValue: 0 },
]

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

const STAT_TO_I18N_KEY: Readonly<Record<string, string>> = {
  affinityRate: "Affinity",
  critRate: "Crit",
  precisionRate: "Precision",
  maxPhys: "Max Phys",
}

const fmtDelta = (delta: number) => {
  if (!Number.isFinite(delta)) return "—"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function BowSetPanel({ inputs, onChange, armorDpsByKey, bowDpsByChoice, isPending }: Props) {
  const { t } = useI18n()

  const currentArmorDps =
    inputs.set && armorDpsByKey?.[inputs.set] !== undefined
      ? armorDpsByKey[inputs.set]
      : (armorDpsByKey?.__none ?? Number.NaN)

  const currentBowDps = bowDpsKey(inputs.bowSet, bowDpsByChoice)

  const armorSelectedKey = ARMOR_SET_OPTIONS.some((opt) => opt.setKey === inputs.set)
    ? inputs.set
    : null

  return (
    <div style={{ opacity: isPending ? 0.6 : 1 }}>
      <div className="section-label">{t("Armor Set")}</div>
      <div className={`${setTiles.tileGrid} ${setTiles.cols2}`}>
        {ARMOR_SET_OPTIONS.map((opt) => {
          const statKey = STAT_TO_I18N_KEY[opt.stat] ?? opt.stat
          const isFlat = opt.stat === "maxPhys"
          return (
            <SetTile
              key={opt.setKey}
              label={t(opt.name)}
              bonusLabel={bonusWithStatLabel(t, statKey, opt.value, isFlat)}
              dps={armorDpsByKey?.[opt.setKey] ?? Number.NaN}
              currentDps={currentArmorDps}
              selected={armorSelectedKey === opt.setKey}
              onClick={() => onChange({ ...inputs, set: opt.setKey })}
              currentLabel={t("Active")}
            />
          )
        })}
        <SetTile
          label={t("(unselected)")}
          bonusLabel=""
          dps={armorDpsByKey?.__none ?? Number.NaN}
          currentDps={currentArmorDps}
          selected={armorSelectedKey === null}
          onClick={() => onChange({ ...inputs, set: null })}
          currentLabel={t("Active")}
        />
      </div>

      <div className="section-label">{t("Bow Set")}</div>
      <div className={`${setTiles.tileGrid} ${setTiles.cols4}`}>
        {BOW_TILES.map((tile) => (
          <SetTile
            key={tile.choice ?? "none"}
            label={t(tile.label)}
            bonusLabel={bonusValueLabel(tile.bonusValue, false)}
            dps={bowDpsKey(tile.choice, bowDpsByChoice)}
            currentDps={currentBowDps}
            selected={inputs.bowSet === tile.choice}
            onClick={() => onChange({ ...inputs, bowSet: tile.choice })}
            currentLabel={t("Active")}
          />
        ))}
      </div>
    </div>
  )
}

interface SetTileProps {
  label: string
  bonusLabel: string
  dps: number
  currentDps: number
  selected: boolean
  onClick: () => void
  currentLabel: string
}

function SetTile({
  label,
  bonusLabel,
  dps,
  currentDps,
  selected,
  onClick,
  currentLabel,
}: SetTileProps) {
  const delta = dps - currentDps
  const tileClassName =
    setTiles.tile +
    (selected ? ` ${setTiles.isSelected}` : "") +
    (!selected && delta > 0 ? ` ${setTiles.isPositive}` : "") +
    (!selected && delta < 0 ? ` ${setTiles.isNegative}` : "")
  return (
    <button type="button" className={tileClassName} onClick={onClick}>
      <div className={setTiles.tileHead}>
        <span className={setTiles.tileLabel}>{label}</span>
        {bonusLabel && <span className={setTiles.tileBonus}>{bonusLabel}</span>}
      </div>
      {!selected && <div className={setTiles.tileDelta}>{fmtDelta(delta)}</div>}
      {selected && (
        <div className={`${setTiles.tileDelta} ${setTiles.isCurrent}`}>{currentLabel}</div>
      )}
    </button>
  )
}

function bowDpsKey(
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
