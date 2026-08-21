import type { GearPiece, GearSlot } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { rarityKey } from "../../../../i18n/contentKeys"
import type { DpsDelta } from "../../../../engine/dpsWorker"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { sortInventoryRowsByDps, type InventoryRow } from "./inventoryRows"
import { HelpHint } from "../../../components/help-hint/HelpHint"
import { DELTA_HINT_KEYS } from "../help-hint/deltaHintKeys"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import styles from "./GearInventoryPanel.module.scss"

interface Props {
  rows: InventoryRow[]
  selectedPieceId: string | null
  onSelect(row: InventoryRow): void
  slotFilter: GearSlot | null
  onClearSlotFilter(): void
  dpsDeltas: DpsDeltaMap
  dpsDeltasPending: boolean
}

const RARITY: Record<GearPiece["rarity"], string> = {
  legendary: styles.rarityLegendary,
  epic: styles.rarityEpic,
}

function fmtDelta(delta: number): string {
  const rounded = Math.round(delta)
  if (rounded > 0) return `+${rounded.toLocaleString()}`
  if (rounded < 0) return `${rounded.toLocaleString()}`
  return "+0"
}

function signClass(delta: number): string {
  const rounded = Math.round(delta)
  if (rounded > 0) return "is-positive"
  if (rounded < 0) return "is-negative"
  return "is-zero"
}

export function GearInventoryPanel({
  rows,
  selectedPieceId,
  onSelect,
  slotFilter,
  onClearSlotFilter,
  dpsDeltas,
  dpsDeltasPending,
}: Props) {
  const { t } = useI18n()

  const unequippedRows = rows.filter((row) => !row.isEquipped)
  const filteredRows =
    slotFilter == null
      ? unequippedRows
      : unequippedRows.filter((row) => row.piece.slot === slotFilter)
  const visibleRows = sortInventoryRowsByDps(filteredRows, dpsDeltas)

  function renderTile(row: InventoryRow) {
    const { piece } = row
    const isSelected = piece.id === selectedPieceId
    const delta: DpsDelta | undefined = dpsDeltas[piece.id]
    const slotLabel = t(GEAR_SLOT_KEYS[piece.slot])
    const rarityLabel = t(rarityKey(piece.rarity), piece.rarity)
    return (
      <button
        type="button"
        key={piece.id}
        className={
          styles.gearInvTile +
          ` ${RARITY[piece.rarity]}` +
          (isSelected ? ` ${styles.isSelected}` : "")
        }
        onClick={() => onSelect(row)}
      >
        {piece.isNew && <span className={styles.gearInvTileNew}>{t("common.new")}</span>}

        <div className={styles.gearInvTileHead}>
          <span className={styles.gearInvTileSlot}>{slotLabel}</span>
          <span className={styles.gearInvTileMeta}>
            lv{piece.level} · {rarityLabel}
          </span>
        </div>

        <div className={styles.gearInvTileStats} style={{ opacity: dpsDeltasPending ? 0.6 : 1 }}>
          <Stat
            label={t("gear.inventory.now")}
            hint={t(DELTA_HINT_KEYS.current)}
            delta={delta?.current}
            pending={dpsDeltasPending}
          />
          <Stat
            label={t("gear.inventory.max94")}
            hint={t(DELTA_HINT_KEYS.upgraded)}
            delta={delta?.upgraded}
            pending={dpsDeltasPending}
          />
          <Stat
            label="FP"
            hint={t(DELTA_HINT_KEYS.fullPotential)}
            delta={delta?.fullPotential}
            pending={dpsDeltasPending}
          />
          <Stat
            label="FP(E)"
            hint={t(DELTA_HINT_KEYS.fullPotentialE)}
            delta={delta?.fullPotentialE}
            pending={dpsDeltasPending}
          />
        </div>
      </button>
    )
  }

  return (
    <div className={styles.gearInventory}>
      <div className="toolbar">
        {slotFilter != null && (
          <span className={styles.gearInvFilter}>
            {t(GEAR_SLOT_KEYS[slotFilter])}
            <button
              type="button"
              className={styles.gearInvFilterClear}
              onClick={onClearSlotFilter}
              title={t("gear.inventory.showAllSlots")}
              aria-label={t("gear.inventory.showAllSlots")}
            >
              ×
            </button>
          </span>
        )}
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-tab">
          {slotFilter != null
            ? t("gear.inventory.noPiecesOfThisType")
            : rows.length === 0
              ? t("gear.inventory.noGearYetClickCreate")
              : t("gear.inventory.equippedPiecesAreShownAbove")}
        </div>
      ) : (
        <div className={styles.gearInvGrid}>{visibleRows.map(renderTile)}</div>
      )}
    </div>
  )
}

function Stat({
  label,
  hint,
  delta,
  pending,
}: {
  label: string
  hint: string
  delta: number | undefined
  pending: boolean
}) {
  const sign = delta === undefined ? "is-pending" : signClass(delta)
  const value = delta === undefined ? (pending ? "…" : "—") : `${fmtDelta(delta)}`
  return (
    <div className={`${styles.gearInvTileStat} ${sign}`}>
      <span className={styles.gearInvTileStatLabel}>
        {label}
        <HelpHint text={hint} />
      </span>
      <span className={styles.gearInvTileStatValue}>{value}</span>
    </div>
  )
}
