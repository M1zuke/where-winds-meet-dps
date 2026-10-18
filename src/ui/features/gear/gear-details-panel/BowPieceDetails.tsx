import { useMemo } from "react"
import type { BowGearLevel, BowPiece, BowSlot, GearRarity } from "../../../../engine/types"
import { BOW_GEAR_LEVELS } from "../../../../engine/types"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { rarityKey } from "../../../../i18n/contentKeys"
import { sanitizeGearPieceText } from "../../../../storage"
import { Select, type SelectOption } from "../../../components/select/Select"
import { BOW_SET_NAME_KEYS } from "../shared/buildSetKeys"
import { bowSlotLabelKey } from "../shared/gearSlotKeys"
import { PieceHeader, SetChip } from "./PieceHeader"
import { PieceNoteFold } from "./PieceNoteFold"
import { LABEL_MAX_LENGTH, NOTE_MAX_LENGTH, PIECE_CHIP_CLASSES } from "./pieceHeaderParts"
import styles from "./BowPieceDetails.module.scss"

const BOW_SET_PIECES = 2

interface Props {
  slot: BowSlot
  piece: BowPiece | null
  inputs: Inputs
  onChange(piece: BowPiece): void
  onAdd(): void
  onDelete(): void
  onBrowseSets(): void
}

export function BowPieceDetails({
  slot,
  piece,
  inputs,
  onChange,
  onAdd,
  onDelete,
  onBrowseSets,
}: Props) {
  const { t } = useI18n()

  const levelOptions: SelectOption<string>[] = useMemo(
    () =>
      BOW_GEAR_LEVELS.map((level) => ({
        value: String(level),
        label: t("common.levelShort").replace("{n}", String(level)),
      })),
    [t],
  )
  const rarityOptions: SelectOption<GearRarity>[] = useMemo(
    () => [
      { value: "legendary", label: t(rarityKey("legendary")) },
      { value: "epic", label: t(rarityKey("epic")) },
    ],
    [t],
  )

  if (!piece) {
    return (
      <div className="panel">
        <div className="toolbar">
          <span className="toolbar-label">{t("gear.details.gearDetails")}</span>
        </div>
        <div className="empty-tab">{t("gear.details.selectAGearPieceTo")}</div>
        <button type="button" className={`btn primary ${styles.addButton}`} onClick={onAdd}>
          {t("common.add")}
        </button>
      </div>
    )
  }

  const partner = inputs.bowGear[slot === "bow" ? "thumbRing" : "bow"]
  const setNameKey = piece.set ? BOW_SET_NAME_KEYS[piece.set] : undefined
  const setChipText = piece.set
    ? `${setNameKey ? t(setNameKey) : piece.set} · ${partner?.set === piece.set ? BOW_SET_PIECES : 1}/${BOW_SET_PIECES}`
    : t("common.noSet")

  function patchText(field: "label" | "note", raw: string, maxLength: number): void {
    if (!piece) return
    const value = sanitizeGearPieceText(raw, maxLength)
    const next = { ...piece }
    if (value) next[field] = value
    else delete next[field]
    onChange(next)
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <span className="toolbar-label">{t("gear.details.gearDetails")}</span>
        <div className="spacer" />
        <button type="button" className="btn danger" onClick={onDelete}>
          {t("common.delete")}
        </button>
      </div>

      <PieceHeader
        label={piece.label}
        rarity={piece.rarity}
        onLabelChange={(raw) => patchText("label", raw, LABEL_MAX_LENGTH)}
      >
        <span className={PIECE_CHIP_CLASSES.staticSlot}>{t(bowSlotLabelKey(slot))}</span>
        <Select
          ariaLabel={t("gear.pieceForm.level")}
          className={PIECE_CHIP_CLASSES.rarity}
          value={String(piece.level)}
          options={levelOptions}
          onChange={(level) => onChange({ ...piece, level: Number(level) as BowGearLevel })}
        />
        <Select
          ariaLabel={t("gear.pieceForm.rarity")}
          className={PIECE_CHIP_CLASSES.rarity}
          value={piece.rarity}
          options={rarityOptions}
          onChange={(rarity) => onChange({ ...piece, rarity })}
        />
        <SetChip ariaLabel={t("common.bowSet")} text={setChipText} onOpen={onBrowseSets} />
      </PieceHeader>

      <div className="hint">{t("gear.bowDetails.hint")}</div>

      <PieceNoteFold
        key={slot}
        note={piece.note}
        onNoteChange={(raw) => patchText("note", raw, NOTE_MAX_LENGTH)}
      />
    </div>
  )
}
