import type { GearPiece, GearSlot } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import type { DpsDelta } from "../../../../engine/dpsWorker"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { sortInventoryRowsByDps, type InventoryRow } from "./inventoryRows"
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
  activeProfileId: string
  selectedPieceId: string | null
  showGlobal: boolean
  onToggleGlobal(): void
  onSelect(row: InventoryRow): void
  onCreate(): void
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
  activeProfileId,
  selectedPieceId,
  showGlobal,
  onToggleGlobal,
  onSelect,
  onCreate,
  slotFilter,
  onClearSlotFilter,
  dpsDeltas,
  dpsDeltasPending,
}: Props) {
  const { t } = useI18n()

  const unequippedRows = rows.filter(
    (row) => !(row.isEquipped && row.ownerProfileId === activeProfileId),
  )
  const filteredRows =
    slotFilter == null
      ? unequippedRows
      : unequippedRows.filter((row) => row.piece.slot === slotFilter)
  const visibleRows = sortInventoryRowsByDps(filteredRows, dpsDeltas)

  function renderTile(row: InventoryRow) {
    const { piece } = row
    const isSelected = piece.id === selectedPieceId
    const isForeign = row.ownerProfileId !== activeProfileId
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
          (isSelected ? ` ${styles.isSelected}` : "") +
          (isForeign ? ` ${styles.isForeign}` : "")
        }
        onClick={() => onSelect(row)}
        title={`${slotLabel} lv${piece.level}`}
      >
        {piece.isNew && !isForeign && <span className={styles.gearInvTileNew}>{t("New")}</span>}

        <div className={styles.gearInvTileHead}>
          <span className={styles.gearInvTileSlot}>{slotLabel}</span>
          <span className={styles.gearInvTileMeta}>
            lv{piece.level} · {rarityLabel}
          </span>
        </div>

        <div className={styles.gearInvTileStats}>
          <Stat label={t("Now")} delta={delta?.current} pending={dpsDeltasPending} />
          <Stat label={t("Max (94%)")} delta={delta?.upgraded} pending={dpsDeltasPending} />
          <Stat label="FP" delta={delta?.fullPotential} pending={dpsDeltasPending} />
          <Stat label="FP(E)" delta={delta?.fullPotentialE} pending={dpsDeltasPending} />
        </div>

        {isForeign && <div className={styles.gearInvTileOwner}>{row.ownerProfileName}</div>}
      </button>
    )
  }

  return (
    <div className={styles.gearInventory}>
      <div className="toolbar">
        <button type="button" className="btn primary" onClick={onCreate}>
          + {t("New piece")}
        </button>
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
        <div className="spacer" />
        <label className={styles.gearToggle}>
          <input type="checkbox" checked={showGlobal} onChange={onToggleGlobal} />
          {t("Show global")}
        </label>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-tab">
          {slotFilter != null
            ? t("No pieces of this type — click 'New piece' to add one")
            : rows.length === 0
              ? t("No gear yet — click 'New piece' to add one")
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
  delta,
  pending,
}: {
  label: string
  delta: number | undefined
  pending: boolean
}) {
  const sign = delta === undefined ? "is-pending" : signClass(delta)
  const value = delta === undefined ? (pending ? "…" : "—") : `${fmtDelta(delta)}`
  return (
    <div className={`${styles.gearInvTileStat} ${sign}`}>
      <span className={styles.gearInvTileStatLabel}>{label}</span>
      <span className={styles.gearInvTileStatValue}>{value}</span>
    </div>
  )
}
