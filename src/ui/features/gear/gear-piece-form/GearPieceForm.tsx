import { useMemo, type ReactNode } from "react"
import type {
  GearLevel,
  GearPiece,
  GearRarity,
  GearSlot,
  GearWordEntry,
} from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { isGearWordId, isUnknownGearWord } from "../../../../data/stats/statLines"
import { getWordSpecs } from "../../../../engine/itemRanking"
import { relayedCapValue } from "../../../../engine/gearStats"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { attunementsFor, attunementLabelKey, getAttunement } from "../../../../engine/attunements"
import type { Inputs } from "../../../../engine/types"
import type { WordMaxRow } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import { attunementHintKey, rarityKey, statLineKey } from "../../../../i18n/contentKeys"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import { Select } from "../../../components/select/Select"
import { NumInput, PercentInput } from "../../../components/number-inputs/NumberInputs"
import { Switch } from "../../../components/switch/Switch"
import { HelpHint } from "../../../components/help-hint/HelpHint"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import type { GearScreenshotRowSlot } from "../screenshot-ocr/ocrGearPiece"
import styles from "./GearPieceForm.module.scss"

export type ScanMarkField = "slot" | "level" | GearScreenshotRowSlot

export interface ScanFieldMark {
  level: "guessed" | "unresolved"
  name: boolean
  value: boolean
}

export type ScanMarks = Readonly<Partial<Record<ScanMarkField, ScanFieldMark>>>

type ScanFieldHalf = "name" | "value"

function fmtDpsDelta(deltaDps: number): string {
  const rounded = Math.round(deltaDps)
  if (rounded > 0) return `+${rounded.toLocaleString()}`
  if (rounded < 0) return rounded.toLocaleString()
  return "+0"
}

function deltaSignClass(deltaDps: number): string {
  if (deltaDps > 0.5) return "is-positive"
  if (deltaDps < -0.5) return "is-negative"
  return "is-zero"
}

interface Props {
  piece: GearPiece
  inputs: Inputs
  onChange(piece: GearPiece): void
  wordMaxRows: WordMaxRow[]
  wordMaxPending: boolean
  showWordMax?: boolean
  scanMarks?: ScanMarks
  onScanMarkCleared?(field: ScanMarkField): void
}

export function GearPieceForm({
  piece,
  inputs,
  onChange,
  wordMaxRows,
  wordMaxPending,
  showWordMax = true,
  scanMarks,
  onScanMarkCleared,
}: Props) {
  const { t } = useI18n()

  function markClassName(field: ScanMarkField, half: ScanFieldHalf): string | undefined {
    const mark = scanMarks?.[field]
    if (!mark) return undefined
    if (half === "name" ? !mark.name : !mark.value) return undefined
    return mark.level === "unresolved" ? styles.markUnresolved : styles.markGuessed
  }

  const slotOptions: ComboboxOption[] = useMemo(
    () => GEAR_SLOTS.map((slot) => ({ value: slot, label: t(GEAR_SLOT_KEYS[slot]) })),
    [t],
  )
  const levelOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "86", label: t("gear.level.86") },
      { value: "91", label: t("gear.level.91") },
      { value: "96", label: t("gear.level.96") },
    ],
    [t],
  )
  const rarityOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "legendary", label: t(rarityKey("legendary")) },
      { value: "epic", label: t(rarityKey("epic")) },
    ],
    [t],
  )
  const wordSpecs = useMemo(() => getWordSpecs(inputs), [inputs])
  const wordOptions: ComboboxOption[] = useMemo(() => {
    const list = wordSpecs.map((spec) => ({
      value: spec.word,
      label: t(statLineKey(spec.word), spec.label),
    }))
    return [{ value: "", label: t("common.none") }, ...list]
  }, [wordSpecs, t])
  const attunementCatalog = useMemo(
    () => attunementsFor(piece.slot, inputs.classId),
    [piece.slot, inputs.classId],
  )
  const attunementOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "", label: t("common.none") },
      ...attunementCatalog.map((option) => ({
        value: option.id,
        label: t(attunementLabelKey(option, inputs.classId), option.label),
      })),
    ],
    [attunementCatalog, inputs.classId, t],
  )

  const weaponSide = isWeaponSlot(piece.slot)
  const base = gearBaseStatsFor(piece)

  function capFor(word: GearWordEntry["word"], relayed: boolean): number | null {
    const spec = wordSpecs.find((candidate) => candidate.word === word)
    if (!spec) return null
    return relayed ? relayedCapValue(spec.amount, spec.unit) : spec.amount
  }
  // Two decimals as displayed, so a percent word keeps four on its fraction.
  function roundToShownPrecision(value: number, isPercent: boolean): number {
    if (!Number.isFinite(value)) return value
    return isPercent ? Math.round(value * 10000) / 10000 : Math.round(value * 100) / 100
  }

  function patch(fields: Partial<GearPiece>): void {
    onChange({ ...piece, ...fields })
  }
  function patchBase(fields: Partial<GearPiece>): void {
    const merged = { ...piece, ...fields }
    const base = gearBaseStatsFor(merged)
    onChange({
      ...merged,
      minPhys: base.minPhys,
      maxPhys: base.maxPhys,
      hp: base.hp,
      physDef: base.physDef,
    })
  }
  function clampAndRound(value: number, word: GearWordEntry["word"], relayed: boolean): number {
    const spec = wordSpecs.find((candidate) => candidate.word === word)
    if (!spec || !Number.isFinite(value)) return value
    const cap = relayed ? relayedCapValue(spec.amount, spec.unit) : spec.amount
    return roundToShownPrecision(Math.min(Math.max(value, 0), cap), spec.unit === "percent")
  }
  // A row the form shows as empty is empty as far as an edit is concerned: the
  // word the profile is holding for another build goes only when the user
  // writes over the row it sits on.
  function patchWord(idx: number, patchedFields: Partial<GearWordEntry>): void {
    const next = [...piece.words] as GearPiece["words"]
    const current = next[idx]
    const base = isUnknownGearWord(current.word)
      ? { ...current, word: "" as const, value: 0 }
      : current
    const merged = { ...base, ...patchedFields }
    merged.value = clampAndRound(merged.value, merged.word, piece.relayed)
    next[idx] = merged
    onChange({ ...piece, words: next })
  }
  function setRelayed(relayed: boolean): void {
    const nextWords = piece.words.map((word) => ({
      ...word,
      value: clampAndRound(word.value, word.word, relayed),
    })) as GearPiece["words"]
    onChange({ ...piece, relayed, words: nextWords })
  }

  return (
    <fieldset className={styles.gearForm}>
      <div className={styles.identityRow}>
        <Field label={t("common.type")}>
          <Select
            ariaLabel={t("common.type")}
            value={piece.slot}
            options={slotOptions}
            className={markClassName("slot", "name")}
            onChange={(value) => {
              onScanMarkCleared?.("slot")
              patchBase({ slot: value as GearSlot })
            }}
          />
        </Field>
        <Field label={t("gear.pieceForm.level")}>
          <Select
            ariaLabel={t("gear.pieceForm.level")}
            value={String(piece.level)}
            options={levelOptions}
            className={markClassName("level", "name")}
            onChange={(value) => {
              onScanMarkCleared?.("level")
              patchBase({ level: Number(value) as GearLevel })
            }}
          />
        </Field>
        <Field label={t("gear.pieceForm.rarity")}>
          <Select
            ariaLabel={t("gear.pieceForm.rarity")}
            value={piece.rarity}
            options={rarityOptions}
            onChange={(value) => patchBase({ rarity: value as GearRarity })}
          />
        </Field>
      </div>

      <div className={styles.baseStats}>
        {weaponSide ? (
          <>
            <BaseStat label={t("common.minPhys")} value={base.minPhys} />
            <BaseStat label={t("common.maxPhys")} value={base.maxPhys} />
          </>
        ) : (
          <>
            <BaseStat label={t("content.statLine.hp")} value={base.hp} />
            <BaseStat label={t("content.statLine.physDef")} value={base.physDef} />
          </>
        )}
      </div>

      <div className={styles.gearWordsSection}>
        <div
          className={
            styles.gearWordsGrid +
            (showWordMax ? "" : ` ${styles.gearWordsGridNoMax}`) +
            (piece.relayed ? ` ${styles.isRelayed}` : "")
          }
        >
          <span className={styles.relayedCell}>
            <Switch
              checked={piece.relayed}
              label={t("gear.pieceForm.relayed")}
              onChange={(relayed) => setRelayed(relayed)}
            />
            <HelpHint text={t("gear.pieceForm.relayedCapsEveryHint")} />
          </span>

          <span className={`${styles.colHead} ${styles.sectionTitle}`}>
            {t("gear.pieceForm.tunements")}
          </span>
          <span className={`${styles.colHead} ${styles.colHeadRight}`}>
            {t("gear.pieceForm.value")}
          </span>
          <span className={styles.colHead} />
          {showWordMax && (
            <>
              <span className={`${styles.colHead} ${styles.colHeadRight}`}>
                {t("gear.pieceForm.at94")}
              </span>
              <span className={`${styles.colHead} ${styles.colHeadRight}`}>
                {t("gear.pieceForm.dps")}
              </span>
            </>
          )}
          {piece.words.map((stored, idx) => {
            const word = isUnknownGearWord(stored.word)
              ? { ...stored, word: "" as const, value: 0 }
              : stored
            const spec = wordSpecs.find((candidate) => candidate.word === word.word)
            const isPercent = spec?.unit === "percent"
            const ValueInput = isPercent ? PercentInput : NumInput
            const cap = capFor(word.word, piece.relayed)
            const maxDisplay =
              cap != null ? (isPercent ? `${(cap * 100).toFixed(2)} %` : cap.toFixed(2)) : undefined
            const wm: WordMaxRow | undefined = wordMaxRows[idx]
            let maxValueText: string
            let deltaText = ""
            let deltaSign = "is-zero"
            let deltaTitle: string | undefined
            if (wm && wm.evaluated) {
              maxValueText =
                wm.unit === "percent"
                  ? `${(wm.capValue * 100).toFixed(2)}%`
                  : wm.capValue.toFixed(2)
              deltaText = fmtDpsDelta(wm.deltaDps)
              deltaSign = deltaSignClass(wm.deltaDps)
              deltaTitle = `${t("gear.pieceForm.fullCast94")}: ${maxValueText} → ${deltaText} DPS`
            } else {
              maxValueText = wordMaxPending ? "…" : "—"
            }
            const wordField = `word${idx}` as ScanMarkField
            return (
              <div key={idx} className={styles.wordRow}>
                <Combobox
                  className={
                    styles.wordCombobox +
                    (markClassName(wordField, "name") ? ` ${markClassName(wordField, "name")}` : "")
                  }
                  value={word.word}
                  options={wordOptions}
                  onChange={(value) => {
                    onScanMarkCleared?.(wordField)
                    patchWord(idx, { word: isGearWordId(value) ? value : "" })
                  }}
                  placeholder={t("common.none")}
                />
                <ValueInput
                  className={markClassName(wordField, "value")}
                  value={word.value}
                  onChange={(value) => {
                    onScanMarkCleared?.(wordField)
                    patchWord(idx, { value })
                  }}
                  min={0}
                  title={maxDisplay ? `${t("gear.pieceForm.max")}: ${maxDisplay}` : undefined}
                />
                <button
                  type="button"
                  className={"btn" + (word.retuned ? " is-on" : "")}
                  onClick={() => patchWord(idx, { retuned: !word.retuned })}
                  title={t("gear.pieceForm.retune")}
                >
                  R
                </button>
                {showWordMax && (
                  <>
                    <span className={styles.gearWordMaxValue} title={deltaTitle}>
                      {maxValueText}
                    </span>
                    <span className={`${styles.maxDelta} ${deltaSign}`} title={deltaTitle}>
                      {deltaText}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {(() => {
        const active = piece.attunement ? getAttunement(piece.attunement) : undefined
        const selected =
          active && attunementCatalog.some((opt) => opt.id === active.id) ? active : undefined
        const isPercent = true
        const ValueInput = isPercent ? PercentInput : NumInput
        const min = selected?.min ?? 0
        const max = selected?.max ?? 0
        const rangeHint = selected
          ? `${(min * 100).toFixed(1)}–${(max * 100).toFixed(1)} %${selected.hint ? " " + t(attunementHintKey(selected.id), selected.hint) : ""}`
          : ""
        function clampValue(value: number): number {
          if (!selected || !Number.isFinite(value)) return value
          return Math.round(Math.min(Math.max(value, selected.min), selected.max) * 1000) / 1000
        }
        return (
          <div className={styles.attunementSection}>
            <span className={`${styles.colHead} ${styles.sectionTitle}`}>
              {t("common.attunement")}
            </span>
            <span className={`${styles.colHead} ${styles.colHeadRight}`}>{t("common.amount")}</span>
            <Combobox
              value={selected?.id ?? ""}
              options={attunementOptions}
              className={markClassName("attunement", "name")}
              onChange={(value) => {
                onScanMarkCleared?.("attunement")
                patch({ attunement: value, attunementValue: 0 })
              }}
              placeholder={t("common.none")}
            />
            <ValueInput
              className={markClassName("attunement", "value")}
              value={piece.attunementValue}
              onChange={(value) => {
                onScanMarkCleared?.("attunement")
                patch({ attunementValue: clampValue(value) })
              }}
              min={0}
              title={rangeHint || undefined}
            />
          </div>
        )
      })()}
    </fieldset>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  )
}

function BaseStat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.baseStat}>
      <span className={styles.baseStatLabel}>{label}</span>
      <span className={styles.baseStatValue}>{value}</span>
    </div>
  )
}
