import type { GearPiece, GearSlot } from "../../../../engine/types"
import { GEAR_SLOTS } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { HelpHint } from "../help-hint/HelpHint"
import { DELTA_HINTS } from "../help-hint/deltaHints"
import styles from "./GearSlotTiles.module.scss"

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
            <div className={styles.gearTileSlot}>{t(SLOT_LABEL_KEYS[slot])}</div>
            <div className={styles.gearTilePiece}>
              {piece
                ? `lv${piece.level} · ${t(piece.rarity === "legendary" ? "Legendary" : "Epic")}`
                : t("Empty")}
            </div>
            {piece && (
              <div className={styles.gearTileStats} style={{ opacity: dpsDeltasPending ? 0.6 : 1 }}>
                <SlotStat
                  label={t("Max (94%)")}
                  hint={t(DELTA_HINTS.upgraded)}
                  delta={delta?.upgraded}
                  pending={dpsDeltasPending}
                />
                <SlotStat
                  label="FP"
                  hint={t(DELTA_HINTS.fullPotential)}
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
