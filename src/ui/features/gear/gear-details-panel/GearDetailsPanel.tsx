import { useMemo } from "react"
import type { GearLevel, GearPiece, GearRarity, GearSlot } from "../../../../engine/types"
import type { Inputs } from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import type { WordMaxRow } from "../../../../engine/dpsWorker"
import { setPieceCountWith } from "../../../../engine/setBonuses"
import { SET_BY_ID } from "../../../../definitions/sets/registry"
import { useI18n } from "../../../../i18n/i18nContext"
import { graduationBuildKey, rarityKey, setKey } from "../../../../i18n/contentKeys"
import { heirloomMatch, type HeirloomProfile } from "../../../../engine/heirloom"
import { sanitizeGearPieceText } from "../../../../storage"
import { HeirloomShine } from "../../../components/heirloom-shine/HeirloomShine"
import { Select, type SelectOption } from "../../../components/select/Select"
import { GearPieceForm } from "../gear-piece-form/GearPieceForm"
import { gearSlotLabelKey } from "../shared/gearSlotKeys"
import { rebasePiece } from "../shared/rebasePiece"
import { selectableGearLevels } from "../shared/selectableGearLevels"
import { PieceHeader, SetChip } from "./PieceHeader"
import { PieceNoteFold } from "./PieceNoteFold"
import { LABEL_MAX_LENGTH, NOTE_MAX_LENGTH, PIECE_CHIP_CLASSES } from "./pieceHeaderParts"
import styles from "./GearDetailsPanel.module.scss"

const GEAR_SET_PIECES = 4

interface Props {
  piece: GearPiece | null
  isEquipped: boolean
  inputs: Inputs
  profile: HeirloomProfile
  onChange(piece: GearPiece): void
  onEquip(): void
  onUnequip(): void
  onDelete(): void
  onBrowseSets(): void
  wordMaxRows: WordMaxRow[]
  wordMaxPending: boolean
}

export function GearDetailsPanel({
  piece,
  isEquipped,
  inputs,
  profile,
  onChange,
  onEquip,
  onUnequip,
  onDelete,
  onBrowseSets,
  wordMaxRows,
  wordMaxPending,
}: Props) {
  const { t } = useI18n()

  const slotOptions: SelectOption<GearSlot>[] = useMemo(
    () =>
      GEAR_SLOTS.map((slot) => ({
        value: slot,
        label: t(gearSlotLabelKey(slot, inputs.classId)),
      })),
    [t, inputs.classId],
  )
  const levelOptions: SelectOption<string>[] = useMemo(
    () =>
      selectableGearLevels(inputs.breakthrough, piece?.level ?? 86).map((level) => ({
        value: String(level),
        label: t("common.levelShort").replace("{n}", String(level)),
      })),
    [t, inputs.breakthrough, piece?.level],
  )
  const rarityOptions: SelectOption<GearRarity>[] = useMemo(
    () => [
      { value: "legendary", label: t(rarityKey("legendary")) },
      { value: "epic", label: t(rarityKey("epic")) },
    ],
    [t],
  )

  function patchText(field: "label" | "note", raw: string, maxLength: number): void {
    if (!piece) return
    const value = sanitizeGearPieceText(raw, maxLength)
    const next = { ...piece }
    if (value) next[field] = value
    else delete next[field]
    onChange(next)
  }

  if (!piece) {
    return (
      <div className="panel">
        <div className="toolbar">
          <span className="toolbar-label">{t("gear.details.gearDetails")}</span>
        </div>
        <div className="empty-tab">{t("gear.details.selectAGearPieceTo")}</div>
      </div>
    )
  }

  const heirloom = heirloomMatch(piece, profile)
  const isHeirloom = heirloom.builds.length > 0
  const matchedBuilds = isHeirloom ? heirloom.builds : (heirloom.swap?.builds ?? [])
  const shines = isEquipped ? heirloom.followed : isHeirloom

  return (
    <div className={`panel ${styles.gearDetails}${shines ? ` ${styles.isHeirloom}` : ""}`}>
      {shines && <HeirloomShine rarity={piece.rarity} />}
      <div className="toolbar">
        <span className="toolbar-label">{t("gear.details.gearDetails")}</span>
        <div className="spacer" />
        {isEquipped ? (
          <button type="button" className="btn" onClick={onUnequip}>
            {t("gear.details.unequip")}
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onEquip}>
            {t("gear.details.equip")}
          </button>
        )}
        <button type="button" className="btn danger" onClick={onDelete}>
          {t("common.delete")}
        </button>
      </div>

      <PieceHeader
        label={piece.label}
        rarity={piece.rarity}
        onLabelChange={(raw) => patchText("label", raw, LABEL_MAX_LENGTH)}
      >
        <Select
          ariaLabel={t("common.type")}
          className={PIECE_CHIP_CLASSES.slot}
          value={piece.slot}
          options={slotOptions}
          onChange={(slot) => onChange(rebasePiece(piece, { slot }))}
        />
        <Select
          ariaLabel={t("gear.pieceForm.level")}
          className={PIECE_CHIP_CLASSES.rarity}
          value={String(piece.level)}
          options={levelOptions}
          onChange={(level) => onChange(rebasePiece(piece, { level: Number(level) as GearLevel }))}
        />
        <Select
          ariaLabel={t("gear.pieceForm.rarity")}
          className={PIECE_CHIP_CLASSES.rarity}
          value={piece.rarity}
          options={rarityOptions}
          onChange={(rarity) => onChange(rebasePiece(piece, { rarity }))}
        />
        {isWeaponSlot(piece.slot) && (
          <SetChip
            ariaLabel={t("common.armorSet")}
            text={
              piece.set
                ? `${t(setKey(piece.set), SET_BY_ID[piece.set]?.name ?? piece.set)} · ${setPieceCountWith(inputs, piece.id, piece.set)}/${GEAR_SET_PIECES}`
                : t("common.noSet")
            }
            onOpen={onBrowseSets}
          />
        )}
        {isEquipped && (
          <span className={PIECE_CHIP_CLASSES.equippedBadge}>{t("gear.details.equipped")}</span>
        )}
        {piece.relayed && (
          <span className={PIECE_CHIP_CLASSES.equippedBadge}>{t("gear.pieceForm.relayed")}</span>
        )}
      </PieceHeader>

      <GearPieceForm
        piece={piece}
        inputs={inputs}
        onChange={onChange}
        showIdentityFields={false}
        wordMaxRows={wordMaxRows}
        wordMaxPending={wordMaxPending}
        relayedRowLead={
          (isHeirloom || heirloom.swap) && (
            <span className={styles.heirloomLine}>
              <span className={isHeirloom ? styles.heirloomChip : styles.heirloomReadyChip}>
                {isHeirloom ? t("common.heirloom") : t("common.oneRetuneAway")}
              </span>
              {matchedBuilds.length > 0 && (
                <span className={styles.heirloomFor}>
                  {t("gear.details.matchingTheBuild")}{" "}
                  <b>
                    {matchedBuilds
                      .map((build) => t(graduationBuildKey(build.id), build.name))
                      .join(" · ")}
                  </b>
                </span>
              )}
              {isHeirloom && !heirloom.followed && (
                <span className={styles.heirloomUnfollowed}>
                  {t("gear.details.notTheBuildYouFollow")}
                </span>
              )}
            </span>
          )
        }
      />

      <PieceNoteFold
        key={piece.id}
        note={piece.note}
        onNoteChange={(raw) => patchText("note", raw, NOTE_MAX_LENGTH)}
      />
    </div>
  )
}
