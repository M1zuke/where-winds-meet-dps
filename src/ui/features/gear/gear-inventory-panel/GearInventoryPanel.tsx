import type { GearPiece, GearSlot } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import type { DpsDelta } from "../../../../engine/dpsWorker"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { sortInventoryRowsByDps, type InventoryRow } from "./inventoryRows"
import { HelpHint } from "../../../components/help-hint/HelpHint"
import { DELTA_HINTS } from "../help-hint/deltaHints"
import styles from "./GearInventoryPanel.module.scss"

const SLOT_LABEL_KEYS: Record<GearSlot, string> = {
  leftWeapon: "Left Weapon",
  rightWeapon: "Right Weapon",
  disc: "Disc",
  pendant: "Pendant",
  helm: "Helm",
  armor: "Armor",
  greaves: "Greaves",
  bracer: "Bracer",
}

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
    const slotLabel = t(SLOT_LABEL_KEYS[piece.slot])
    const rarityLabel = t(piece.rarity === "legendary" ? "Legendary" : "Epic")
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
        {piece.isNew && <span className={styles.gearInvTileNew}>{t("New")}</span>}

        <div className={styles.gearInvTileHead}>
          <span className={styles.gearInvTileSlot}>{slotLabel}</span>
          <span className={styles.gearInvTileMeta}>
            lv{piece.level} · {rarityLabel}
          </span>
        </div>

        <div className={styles.gearInvTileStats} style={{ opacity: dpsDeltasPending ? 0.6 : 1 }}>
          <Stat
            label={t("Now")}
            hint={t(DELTA_HINTS.current)}
            delta={delta?.current}
            pending={dpsDeltasPending}
          />
          <Stat
            label={t("Max (94%)")}
            hint={t(DELTA_HINTS.upgraded)}
            delta={delta?.upgraded}
            pending={dpsDeltasPending}
          />
          <Stat
            label="FP"
            hint={t(DELTA_HINTS.fullPotential)}
            delta={delta?.fullPotential}
            pending={dpsDeltasPending}
          />
          <Stat
            label="FP(E)"
            hint={t(DELTA_HINTS.fullPotentialE)}
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
            {t(SLOT_LABEL_KEYS[slotFilter])}
            <button
              type="button"
              className={styles.gearInvFilterClear}
              onClick={onClearSlotFilter}
              title={t("Show all slots")}
              aria-label={t("Show all slots")}
            >
              ×
            </button>
          </span>
        )}
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-tab">
          {slotFilter != null
            ? t("No pieces of this type — click 'Create Gear' to add one")
            : rows.length === 0
              ? t("No gear yet — click 'Create Gear' to add one")
              : t("Equipped pieces are shown above")}
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
