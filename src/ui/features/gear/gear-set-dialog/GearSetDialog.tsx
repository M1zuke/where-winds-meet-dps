import { useId, useMemo, useRef, useState } from "react"
import type { BowPiece, BowSlot, GearPiece, Inputs } from "../../../../engine/types"
import { setPieceCount, setPieceCountWith } from "../../../../engine/setBonuses"
import { NO_SET_CHOICE, withSetChoice, type SetChoiceTarget } from "../../../../engine/setChoice"
import { BOW_SET_DEFS } from "../../../../data/sets/bowSets"
import { GEAR_SET_DEFS } from "../../../../definitions/sets/registry"
import type { SetPanelBonus } from "../../../../definitions/sets/setDef"
import { SET_FOUR_PIECE_TEXTS, type SetFourPieceText } from "../../../../data/sets/fourPieceTexts"
import { setFourPieceFullKey, setFourPieceKey, setKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { useGearSetChoices } from "../../../hooks/useGearSetChoices"
import { formatNumber } from "../../../utils/numberFormatting"
import { BOW_SET_NAME_KEYS } from "../shared/buildSetKeys"
import { bowSlotLabelKey, gearSlotLabelKey } from "../shared/gearSlotKeys"
import { formatSetBonusValue, setBonusStatKey, setBonusValueAtLevel } from "../shared/setBonusText"
import styles from "./GearSetDialog.module.scss"

export type GearSetDialogTarget =
  | { kind: "piece"; piece: GearPiece; isEquipped: boolean }
  | { kind: "bow"; slot: BowSlot; piece: BowPiece }

interface Props {
  inputs: Inputs
  target: GearSetDialogTarget
  onApply(setId: string | null, applyToGroup: boolean): void
  onClose(): void
}

interface SetCard {
  id: string
  name: string
  stat: SetPanelBonus["stat"]
  value: number | null
}

const GEAR_SET_PIECES = 4
const BOW_SET_PIECES = 2
const BOW_SET_IDS = ["precision", "crit", "affinity"] as const

const DPS_DIGITS = 2
const fourPieceTexts: Readonly<Record<string, SetFourPieceText | undefined>> = SET_FOUR_PIECE_TEXTS

function roundedDps(delta: number): number {
  return Number(delta.toFixed(DPS_DIGITS))
}

function signedDps(delta: number): string {
  const rounded = roundedDps(delta)
  if (rounded > 0) return `+${formatNumber(rounded, DPS_DIGITS)}`
  if (rounded < 0) return formatNumber(rounded, DPS_DIGITS)
  return `+${formatNumber(0, DPS_DIGITS)}`
}

export function GearSetDialog({ inputs, target, onApply, onClose }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const filterRef = useRef<HTMLInputElement | null>(null)
  const isBow = target.kind === "bow"
  const currentSetId: string | null = target.piece.set ?? null
  const [pendingSetId, setPendingSetId] = useState<string | null>(currentSetId)
  const [query, setQuery] = useState("")
  const pieceId = target.kind === "piece" ? target.piece.id : null
  const bowSlot = target.kind === "bow" ? target.slot : null
  const isEquipped = target.kind === "piece" ? target.isEquipped : true
  const [onlyThisPiece, setOnlyThisPiece] = useState(!isEquipped)
  const applyToGroup = !onlyThisPiece
  const workerTarget = useMemo<SetChoiceTarget | null>(() => {
    if (pieceId !== null) return isEquipped ? { kind: "piece", pieceId } : null
    return bowSlot !== null ? { kind: "bow", slot: bowSlot } : null
  }, [pieceId, bowSlot, isEquipped])
  const groupApplies = applyToGroup && !isBow
  const choices = useGearSetChoices(inputs, workerTarget, groupApplies)

  const levelText = t("common.levelShort").replace("{n}", String(target.piece.level))
  const slotLabel =
    target.kind === "piece"
      ? t(gearSlotLabelKey(target.piece.slot, inputs.classId))
      : t(bowSlotLabelKey(target.slot))

  const cards: SetCard[] = isBow
    ? BOW_SET_IDS.map((id) => ({
        id,
        name: t(BOW_SET_NAME_KEYS[id]),
        stat: BOW_SET_DEFS[id].stat,
        value: setBonusValueAtLevel(BOW_SET_DEFS[id], target.piece.level),
      }))
    : GEAR_SET_DEFS.flatMap((definition) =>
        definition.panelBonus
          ? [
              {
                id: definition.id,
                name: t(setKey(definition.id), definition.name),
                stat: definition.panelBonus.stat,
                value: setBonusValueAtLevel(definition.panelBonus, target.piece.level),
              },
            ]
          : [],
      )

  const data = choices.data
  const dpsDeltaOf = (card: SetCard): number | null =>
    data ? (data.dpsByChoice[card.id] ?? 0) - data.currentDps : null
  const rankedCards = data
    ? [...cards].sort((left, right) => dpsDeltaOf(right)! - dpsDeltaOf(left)!)
    : cards
  const needle = query.trim().toLowerCase()
  const matchesFilter = (card: SetCard): boolean =>
    needle === "" || `${card.name} ${t(setBonusStatKey(card.stat))}`.toLowerCase().includes(needle)
  const visibleCards = rankedCards.filter(matchesFilter)
  const filteredOutCards = rankedCards.filter((card) => !matchesFilter(card))

  function countText(card: SetCard): { text: string; isHit: boolean } {
    if (target.kind === "bow") {
      const partnerSlot: BowSlot = target.slot === "bow" ? "thumbRing" : "bow"
      const isMatch = inputs.bowGear[partnerSlot]?.set === card.id
      return {
        text: isMatch
          ? t("gear.setDialog.pairsWith").replace("{slot}", t(bowSlotLabelKey(partnerSlot)))
          : t("gear.setDialog.unpaired"),
        isHit: isMatch,
      }
    }
    const before = setPieceCount(inputs, card.id)
    if (target.piece.set === card.id) {
      return {
        text: t("gear.setDialog.equippedCount")
          .replace("{n}", String(before))
          .replace("{total}", String(GEAR_SET_PIECES)),
        isHit: before >= 2,
      }
    }
    const after = groupApplies
      ? setPieceCount(
          withSetChoice(inputs, { kind: "piece", pieceId: target.piece.id }, true, card.id),
          card.id,
        )
      : setPieceCountWith(inputs, target.piece.id, card.id)
    return {
      text: t("gear.setDialog.countChange")
        .replace("{from}", String(before))
        .replace("{to}", String(after))
        .replace("{total}", String(GEAR_SET_PIECES)),
      isHit: after >= 2,
    }
  }

  function reachText(): string {
    if (pendingSetId === null) return t("gear.setDialog.noSetOnPiece")
    if (target.kind === "bow") {
      const partnerSlot: BowSlot = target.slot === "bow" ? "thumbRing" : "bow"
      const isPaired = inputs.bowGear[partnerSlot]?.set === pendingSetId
      return `${isPaired ? BOW_SET_PIECES : 1}/${BOW_SET_PIECES} · ${
        isPaired ? t("gear.setDialog.reachPair") : t("gear.setDialog.reachNone")
      }`
    }
    const count = groupApplies
      ? setPieceCount(
          withSetChoice(inputs, { kind: "piece", pieceId: target.piece.id }, true, pendingSetId),
          pendingSetId,
        )
      : setPieceCountWith(inputs, target.piece.id, pendingSetId)
    const reach =
      count >= GEAR_SET_PIECES
        ? t("gear.setDialog.reachBoth")
        : count >= 2
          ? t("gear.setDialog.reachTwoPiece")
          : t("gear.setDialog.reachNone")
    return `${count}/${GEAR_SET_PIECES} · ${reach}`
  }

  const hasDps = workerTarget !== null
  const placeholder = hasDps ? "…" : "—"
  const pendingDps = data ? (data.dpsByChoice[pendingSetId ?? NO_SET_CHOICE] ?? null) : null
  const diff = data && pendingDps !== null ? pendingDps - data.currentDps : null
  const pendingCard = cards.find((card) => card.id === pendingSetId)
  const pendingName =
    pendingSetId === null ? t("common.noSet") : (pendingCard?.name ?? pendingSetId)

  function deltaClass(delta: number): string {
    const rounded = roundedDps(delta)
    if (rounded > 0) return styles.positive
    if (rounded < 0) return styles.negative
    return styles.neutral
  }

  function cardBody(card: SetCard) {
    const count = countText(card)
    const delta = dpsDeltaOf(card)
    const fourPiece = isBow ? undefined : fourPieceTexts[card.id]
    return (
      <>
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{card.name}</span>
          <span className={styles.cardCount + (count.isHit ? ` ${styles.hit}` : "")}>
            {count.text}
          </span>
        </div>
        <div className={styles.tier}>
          <span className={styles.tierBadge}>{t("common.twoPiece")}</span>
          <span>
            {t(setBonusStatKey(card.stat))}{" "}
            {card.value !== null && (
              <span className={styles.tierValue}>{formatSetBonusValue(card.stat, card.value)}</span>
            )}
          </span>
        </div>
        {fourPiece && (
          <div className={styles.tier}>
            <span className={styles.tierBadge}>{t("common.fourPiece")}</span>
            <span>{t(setFourPieceKey(card.id), fourPiece.short)}</span>
          </div>
        )}
        <span className={`${styles.delta} ${delta !== null ? deltaClass(delta) : ""}`}>
          {delta !== null ? `${signedDps(delta)} ${t("common.dps")}` : placeholder}
        </span>
      </>
    )
  }

  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      surfaceClassName={styles.surface}
      initialFocusRef={filterRef}
    >
      <DialogHeader>
        <div className={styles.headerRow}>
          <div>
            <h2 id={titleId}>{isBow ? t("gear.setDialog.bowTitle") : t("common.gearSets")}</h2>
            <p className={styles.subtitle}>
              {t("gear.setDialog.subtitle")
                .replace("{slot}", slotLabel)
                .replace("{level}", levelText)}
            </p>
          </div>
          <button type="button" className="btn" aria-label={t("common.close")} onClick={onClose}>
            ✕
          </button>
        </div>
      </DialogHeader>

      <DialogBody className={styles.body}>
        <div className={styles.tools}>
          <input
            ref={filterRef}
            type="search"
            className={styles.filter}
            value={query}
            placeholder={t("gear.setDialog.filterPlaceholder")}
            aria-label={t("gear.setDialog.filterLabel")}
            onChange={(event) => setQuery(event.target.value)}
          />
          {!isBow && (
            <label className={styles.onlyThisPiece}>
              <input
                type="checkbox"
                checked={onlyThisPiece}
                onChange={(event) => setOnlyThisPiece(event.target.checked)}
              />
              {t("gear.setDialog.onlyThisPiece")}
            </label>
          )}
        </div>

        <div className={styles.columns}>
          <div className={styles.cards}>
            {visibleCards.map((card) => {
              const fourPiece = isBow ? undefined : fourPieceTexts[card.id]
              return (
                <button
                  key={card.id}
                  type="button"
                  title={fourPiece ? t(setFourPieceFullKey(card.id), fourPiece.full) : undefined}
                  aria-pressed={pendingSetId === card.id}
                  className={
                    styles.card +
                    (currentSetId === card.id ? ` ${styles.current}` : "") +
                    (pendingSetId === card.id ? ` ${styles.previewed}` : "")
                  }
                  onClick={() => setPendingSetId(card.id)}
                >
                  {cardBody(card)}
                </button>
              )
            })}
            {filteredOutCards.map((card) => (
              <div key={card.id} className={`${styles.card} ${styles.spacer}`} aria-hidden="true">
                {cardBody(card)}
              </div>
            ))}
            {visibleCards.length === 0 && (
              <div className={`${styles.hint} ${styles.noMatch}`}>
                {t("gear.setDialog.noMatch")}
              </div>
            )}
          </div>

          <aside className={styles.side} aria-live="polite">
            <h3>{t("gear.setDialog.selection")}</h3>
            <div className={styles.pick}>
              {pendingName}
              <small>{reachText()}</small>
            </div>
            <div className={styles.dpsRows} style={{ opacity: choices.isPending ? 0.6 : 1 }}>
              <div className={styles.dpsRow}>
                <span>{t("gear.setDialog.previousDps")}</span>
                <b>{data ? formatNumber(data.currentDps, DPS_DIGITS) : placeholder}</b>
              </div>
              <div className={styles.dpsRow}>
                <span>{t("gear.setDialog.currentDps")}</span>
                <b>{pendingDps !== null ? formatNumber(pendingDps, DPS_DIGITS) : placeholder}</b>
              </div>
              <div className={`${styles.dpsRow} ${styles.dpsDiff}`}>
                <span>{t("gear.setDialog.dpsDiff")}</span>
                <b className={diff !== null ? deltaClass(diff) : undefined}>
                  {diff !== null ? signedDps(diff) : placeholder}
                </b>
              </div>
            </div>
            <div className={styles.hint}>
              {hasDps ? t("gear.setDialog.previewHint") : t("gear.setDialog.equipToCompare")}
            </div>
          </aside>
        </div>
      </DialogBody>

      <DialogFooter>
        <span className={`${styles.hint} ${styles.footHint}`}>
          {isBow ? t("gear.setDialog.bowFootHint") : t("gear.setDialog.gearFootHint")}
        </span>
        <button type="button" className="btn" onClick={() => setPendingSetId(null)}>
          {t("common.noSet")}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => onApply(pendingSetId, groupApplies)}
        >
          {t("common.apply")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
