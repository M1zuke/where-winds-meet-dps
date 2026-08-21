import type { GearPiece, GearSlot } from "../../../../engine/types"
import { GEAR_SLOTS } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { rarityKey } from "../../../../i18n/contentKeys"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { HelpHint } from "../../../components/help-hint/HelpHint"
import { DELTA_HINT_KEYS } from "../help-hint/deltaHintKeys"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import styles from "./GearSlotTiles.module.scss"

interface Props {
  inventory: GearPiece[]
  equipped: Record<GearSlot, string | null>
  selectedPieceId: string | null
  selectedSlot: GearSlot | null
  onSelectSlot(slot: GearSlot, pieceId: string | null): void
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

export function GearSlotTiles({
  inventory,
  equipped,
  selectedPieceId,
  selectedSlot,
  onSelectSlot,
  dpsDeltas,
  dpsDeltasPending,
}: Props) {
  const { t } = useI18n()
  return (
    <div className={styles.gearTiles}>
      {GEAR_SLOTS.map((slot) => {
        const pieceId = equipped[slot]
        const piece = pieceId
          ? (inventory.find((candidate) => candidate.id === pieceId) ?? null)
          : null
        const isSelected =
          slot === selectedSlot ||
          (selectedPieceId !== null && piece !== null && piece.id === selectedPieceId)
        const delta = piece ? dpsDeltas[piece.id] : undefined
        return (
          <button
            type="button"
            key={slot}
            className={
              styles.gearTile +
              (piece ? ` ${RARITY[piece.rarity]}` : ` ${styles.empty}`) +
              (isSelected ? ` ${styles.isSelected}` : "")
            }
            onClick={() => onSelectSlot(slot, piece?.id ?? null)}
          >
            <div className={styles.gearTileSlot}>{t(GEAR_SLOT_KEYS[slot])}</div>
            <div className={styles.gearTilePiece}>
              {piece
                ? `lv${piece.level} · ${t(rarityKey(piece.rarity), piece.rarity)}`
                : t("gear.slotTiles.empty")}
            </div>
            {piece && (
              <div className={styles.gearTileStats} style={{ opacity: dpsDeltasPending ? 0.6 : 1 }}>
                <SlotStat
                  label={t("gear.slotTiles.max94")}
                  hint={t(DELTA_HINT_KEYS.upgraded)}
                  delta={delta?.upgraded}
                  pending={dpsDeltasPending}
                />
                <SlotStat
                  label="FP"
                  hint={t(DELTA_HINT_KEYS.fullPotential)}
                  delta={delta?.fullPotential}
                  pending={dpsDeltasPending}
                />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function SlotStat({
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
  const value = delta === undefined ? (pending ? "…" : "—") : fmtDelta(delta)
  return (
    <div className={`${styles.gearTileStat} ${sign}`}>
      <span className={styles.gearTileStatLabel}>
        {label}
        <HelpHint text={hint} />
      </span>
      <span className={styles.gearTileStatValue}>{value}</span>
    </div>
  )
}
