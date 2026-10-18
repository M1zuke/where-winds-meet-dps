import type { BowPiece, BowSlot, GearPiece, GearSlot, Inputs } from "../../../../engine/types"
import { isWeaponSlot } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { setKey } from "../../../../i18n/contentKeys"
import { heirloomMatch, type HeirloomProfile } from "../../../../engine/heirloom"
import { resolveActiveSets, setPieceCount } from "../../../../engine/setBonuses"
import { BOW_SET_DEFS } from "../../../../data/sets/bowSets"
import { GEAR_SET_DEFS, SET_BY_ID } from "../../../../definitions/sets/registry"
import { HeirloomShine } from "../../../components/heirloom-shine/HeirloomShine"
import type { DpsDeltaMap } from "../../../hooks/useDpsDeltas"
import { HelpHint } from "../../../components/help-hint/HelpHint"
import { DELTA_HINT_KEYS } from "../help-hint/deltaHintKeys"
import { BOW_SET_NAME_KEYS } from "../shared/buildSetKeys"
import { bowSlotLabelKey, gearSlotLabelKey } from "../shared/gearSlotKeys"
import { formatSetBonusValue, setBonusStatKey } from "../shared/setBonusText"
import { targetLevelLabel } from "../shared/targetLevelLabel"
import styles from "./GearSlotTiles.module.scss"

interface Props {
  inputs: Inputs
  inventory: GearPiece[]
  profile: HeirloomProfile
  equipped: Record<GearSlot, string | null>
  selectedPieceId: string | null
  selectedSlot: GearSlot | null
  selectedBowSlot: BowSlot | null
  onSelectSlot(slot: GearSlot, pieceId: string | null): void
  onSelectBowSlot(slot: BowSlot): void
  dpsDeltas: DpsDeltaMap
  dpsDeltasPending: boolean
}

type TileSlot = { kind: "gear"; slot: GearSlot } | { kind: "bow"; slot: BowSlot }

const TILE_LAYOUT: readonly TileSlot[] = [
  { kind: "gear", slot: "leftWeapon" },
  { kind: "gear", slot: "rightWeapon" },
  { kind: "gear", slot: "helm" },
  { kind: "gear", slot: "armor" },
  { kind: "bow", slot: "bow" },
  { kind: "gear", slot: "disc" },
  { kind: "gear", slot: "pendant" },
  { kind: "gear", slot: "greaves" },
  { kind: "gear", slot: "bracer" },
  { kind: "bow", slot: "thumbRing" },
]

const GEAR_SET_PIECES = 4
const BOW_SET_PIECES = 2

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
  inputs,
  inventory,
  profile,
  equipped,
  selectedPieceId,
  selectedSlot,
  selectedBowSlot,
  onSelectSlot,
  onSelectBowSlot,
  dpsDeltas,
  dpsDeltasPending,
}: Props) {
  const { t } = useI18n()
  const activeBow = resolveActiveSets(inputs).bow

  function levelText(level: number): string {
    return t("common.levelShort").replace("{n}", String(level))
  }

  function pipsLabel(filled: number, total: number): string {
    return t("gear.slotTiles.piecesOwned")
      .replace("{n}", String(filled))
      .replace("{total}", String(total))
  }

  function gearSetLabel(piece: GearPiece) {
    if (!piece.set) return <span className={styles.noSet}>{t("gear.slotTiles.noSet")}</span>
    return t(setKey(piece.set), SET_BY_ID[piece.set]?.name ?? piece.set)
  }

  function renderGearTile(slot: GearSlot) {
    const pieceId = equipped[slot]
    const piece = pieceId ? (inventory.find((candidate) => candidate.id === pieceId) ?? null) : null
    const isSelected =
      slot === selectedSlot ||
      (selectedPieceId !== null && piece !== null && piece.id === selectedPieceId)
    const delta = piece ? dpsDeltas[piece.id] : undefined
    const heirloom = piece ? heirloomMatch(piece, profile) : null
    const isHeirloom = heirloom?.followed ?? false
    const hasKnownSet =
      isWeaponSlot(slot) && piece && GEAR_SET_DEFS.some((set) => set.id === piece.set)
    const ownedCount = piece?.set ? setPieceCount(inputs, piece.set) : 0
    return (
      <button
        type="button"
        key={slot}
        className={
          styles.gearTile +
          (piece ? ` ${RARITY[piece.rarity]}` : ` ${styles.empty}`) +
          (isSelected ? ` ${styles.isSelected}` : "") +
          (isHeirloom ? ` ${styles.isHeirloom}` : "")
        }
        onClick={() => onSelectSlot(slot, piece?.id ?? null)}
      >
        {piece && isHeirloom && <HeirloomShine rarity={piece.rarity} />}
        {heirloom?.swap && (
          <span className={styles.gearTileHeirloomReady}>{t("common.oneRetuneAway")}</span>
        )}
        {piece?.note && <NoteMarker />}
        <div className={styles.gearTileSlot}>
          <span>{t(gearSlotLabelKey(slot, profile.classId))}</span>
          {hasKnownSet && (
            <Pips
              filled={ownedCount}
              total={GEAR_SET_PIECES}
              label={pipsLabel(ownedCount, GEAR_SET_PIECES)}
            />
          )}
        </div>
        {piece?.label && <div className={styles.gearTileLabel}>{piece.label}</div>}
        <div className={styles.gearTilePiece}>
          {piece ? (
            <>
              {levelText(piece.level)}
              {isWeaponSlot(slot) && <> · {gearSetLabel(piece)}</>}
            </>
          ) : (
            t("gear.slotTiles.empty")
          )}
        </div>
        {piece && (
          <div className={styles.gearTileStats} style={{ opacity: dpsDeltasPending ? 0.6 : 1 }}>
            <SlotStat
              label={targetLevelLabel(t("gear.slotTiles.max94"), piece.level, delta?.upgradedLevel)}
              hint={t(DELTA_HINT_KEYS.upgraded)}
              delta={delta?.upgraded}
              pending={dpsDeltasPending}
            />
            <SlotStat
              label={targetLevelLabel("FP", piece.level, delta?.fullPotentialLevel)}
              hint={t(DELTA_HINT_KEYS.fullPotential)}
              delta={delta?.fullPotential}
              pending={dpsDeltasPending}
            />
          </div>
        )}
      </button>
    )
  }

  function renderBowTile(slot: BowSlot) {
    const piece: BowPiece | null = inputs.bowGear[slot]
    const isPaired = piece !== null && activeBow !== null && activeBow.set === piece.set
    const bowDefinition = activeBow ? BOW_SET_DEFS[activeBow.set] : null
    const filled = isPaired ? BOW_SET_PIECES : 1
    return (
      <button
        type="button"
        key={slot}
        className={
          styles.gearTile +
          (piece ? ` ${RARITY[piece.rarity]}` : ` ${styles.empty}`) +
          (slot === selectedBowSlot ? ` ${styles.isSelected}` : "")
        }
        onClick={() => onSelectBowSlot(slot)}
      >
        {piece?.note && <NoteMarker />}
        <div className={styles.gearTileSlot}>
          <span>{t(bowSlotLabelKey(slot))}</span>
          {piece?.set && (
            <Pips
              filled={filled}
              total={BOW_SET_PIECES}
              label={pipsLabel(filled, BOW_SET_PIECES)}
            />
          )}
        </div>
        {piece?.label && <div className={styles.gearTileLabel}>{piece.label}</div>}
        <div className={styles.gearTilePiece}>
          {piece ? (
            <>
              {levelText(piece.level)} ·{" "}
              {piece.set ? (
                BOW_SET_NAME_KEYS[piece.set] ? (
                  t(BOW_SET_NAME_KEYS[piece.set])
                ) : (
                  piece.set
                )
              ) : (
                <span className={styles.noSet}>{t("gear.slotTiles.noSet")}</span>
              )}
            </>
          ) : (
            t("gear.slotTiles.empty")
          )}
        </div>
        {piece && (
          <div className={styles.gearTileBowInfo}>
            {isPaired && activeBow && bowDefinition ? (
              <>
                {t("gear.slotTiles.pair")} ·{" "}
                <b>
                  {formatSetBonusValue(
                    bowDefinition.stat,
                    bowDefinition.value[activeBow.level] ?? 0,
                  )}
                </b>{" "}
                {t(setBonusStatKey(bowDefinition.stat))}
              </>
            ) : (
              t("gear.slotTiles.unpaired")
            )}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={styles.gearTiles}>
      {TILE_LAYOUT.map((tile) =>
        tile.kind === "gear" ? renderGearTile(tile.slot) : renderBowTile(tile.slot),
      )}
    </div>
  )
}

function NoteMarker() {
  const { t } = useI18n()
  return (
    <span
      className={styles.gearTileNoteMarker}
      title={t("common.hasNote")}
      aria-label={t("common.hasNote")}
    >
      ✎
    </span>
  )
}

function Pips({ filled, total, label }: { filled: number; total: number; label: string }) {
  return (
    <span className={styles.pips} role="img" aria-label={label} title={label}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={styles.pip + (index < filled ? ` ${styles.pipOn}` : "")} />
      ))}
    </span>
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
