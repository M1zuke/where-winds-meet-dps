import { useId } from "react"
import type { GearPiece, GearWordId, Inputs } from "../../../../engine/types"
import { attributeForClass } from "../../../../definitions/classes/registry"
import { retuneWeightPool } from "../../../../data/stats/gearRetuneWeights"
import {
  retuneAttemptBudget,
  retunePoolChoices,
  retunedOutWordsOf,
  type RetuneChoice,
} from "../../../../engine/retunement"
import { GEAR_WORD_UNIT, statLineLabel } from "../../../../data/stats/statLines"
import { useI18n } from "../../../../i18n/i18nContext"
import { statLineKey } from "../../../../i18n/contentKeys"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import dialogChrome from "../shared/gearDialog.module.scss"
import styles from "./RetuneOptionsDialog.module.scss"

interface Props {
  piece: GearPiece
  slotIndex: number
  inputs: Inputs
  onChange(piece: GearPiece): void
  onClose(): void
}

function formatValue(value: number, unit: "raw" | "percent"): string {
  return unit === "percent" ? `${(value * 100).toFixed(2)}%` : value.toFixed(2)
}

export function RetuneOptionsDialog({ piece, slotIndex, inputs, onChange, onClose }: Props) {
  const { t } = useI18n()
  const titleId = useId()

  const attribute = attributeForClass(inputs.classId)
  const pool = attribute ? retuneWeightPool(attribute, piece.level, piece.slot) : null
  const choices = pool ? retunePoolChoices(piece, pool) : []
  const budget = retuneAttemptBudget(piece.level)
  const currentWord = piece.words[slotIndex]?.word || null

  function toggleDeselected(word: GearWordId): void {
    const deselected = new Set(retunedOutWordsOf(piece))
    if (deselected.has(word)) deselected.delete(word)
    else deselected.add(word)
    onChange({ ...piece, retunedOutWords: [...deselected] })
  }

  return (
    <Dialog labelledBy={titleId} onClose={onClose} surfaceClassName={dialogChrome.wide}>
      <DialogHeader>
        <h2 id={titleId}>{t("gear.retuneOptionsDialog.title")}</h2>
        <span>
          {t(GEAR_SLOT_KEYS[piece.slot])}
          {currentWord ? ` — ${t(statLineKey(currentWord), statLineLabel(currentWord))}` : ""}
        </span>
      </DialogHeader>
      <DialogBody>
        {pool ? (
          <div className={styles.grid}>
            {choices.map((choice) => (
              <RetuneChoiceTile key={choice.word} choice={choice} onToggle={toggleDeselected} />
            ))}
          </div>
        ) : (
          <p className="hint">{t("gear.retuneOptionsDialog.noProbabilityData")}</p>
        )}
      </DialogBody>
      <DialogFooter>
        <span className={styles.budget}>
          {budget === "single" ? t("gear.retuneBudget.single") : t("gear.retuneBudget.repeatable")}
        </span>
        <button type="button" className="btn" onClick={onClose}>
          {t("common.close")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}

function RetuneChoiceTile({
  choice,
  onToggle,
}: {
  choice: RetuneChoice
  onToggle: (word: GearWordId) => void
}) {
  const { t } = useI18n()
  const unit = GEAR_WORD_UNIT[choice.word]
  return (
    <div
      className={
        styles.tile +
        (choice.deselected ? ` ${styles.deselected}` : "") +
        (choice.onRerollableLine ? ` ${styles.onRerollableLine}` : "")
      }
    >
      <span className={styles.tileName}>
        {t(statLineKey(choice.word), statLineLabel(choice.word))}
      </span>
      <span className={styles.tileRange}>
        {formatValue(choice.min, unit)} – {formatValue(choice.max, unit)}
      </span>
      {choice.onRerollableLine ? (
        <span className={styles.tileMarker}>
          {t("gear.retuneOptionsDialog.onRerollableLineMarker")}
        </span>
      ) : choice.deselected ? (
        <span className={styles.tileMarker}>{t("gear.retuneOptionsDialog.retunedOutMarker")}</span>
      ) : (
        <span className={styles.tileChance}>
          <b>{(choice.pDraw * 100).toFixed(1)}%</b>
          <em>{t("gear.retuneOptionsDialog.chanceCaption")}</em>
        </span>
      )}
      <button
        type="button"
        className="btn"
        disabled={choice.onRerollableLine}
        onClick={() => onToggle(choice.word)}
      >
        {choice.deselected
          ? t("gear.retuneOptionsDialog.undoDeselect")
          : t("gear.retuneOptionsDialog.markDeselected")}
      </button>
    </div>
  )
}
