import { useMemo } from "react"
import type {
  GearLevel,
  GearPiece,
  GearRarity,
  GearSlot,
  GearWordEntry,
} from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { getWordSpecs } from "../../../../engine/itemRanking"
import { relayedCapValue, gearBaseStatsFor } from "../../../../engine/gearStats"
import { attunementsFor, getAttunement } from "../../../../engine/attunements"
import type { Inputs } from "../../../../engine/types"
import type { WordMaxRow } from "../../../../engine/dpsWorker"
import { useI18n } from "../../../../i18n/i18nContext"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import { NumInput, PercentInput } from "../../../components/number-inputs/NumberInputs"
import styles from "./GearPieceForm.module.scss"

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
  piece: GearPiece
  inputs: Inputs
  disabled: boolean
  onChange(piece: GearPiece): void
  wordMaxRows: WordMaxRow[]
  wordMaxPending: boolean
  showWordMax?: boolean
}

export function GearPieceForm({
  piece,
  inputs,
  disabled,
  onChange,
  wordMaxRows,
  wordMaxPending,
  showWordMax = true,
}: Props) {
  const { t } = useI18n()

  const slotOptions: ComboboxOption[] = useMemo(
    () => GEAR_SLOTS.map((slot) => ({ value: slot, label: t(SLOT_LABEL_KEYS[slot]) })),
    [t],
  )
  const levelOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "86", label: "lv86" },
      { value: "91", label: "lv91" },
      { value: "96", label: "lv96" },
    ],
    [],
  )
  const rarityOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "legendary", label: t("Legendary") },
      { value: "epic", label: t("Epic") },
    ],
    [t],
  )
  const wordSpecs = useMemo(() => getWordSpecs(inputs), [inputs])
  const wordOptions: ComboboxOption[] = useMemo(() => {
    const list = wordSpecs.map((spec) => ({ value: spec.word, label: t(spec.word) }))
    return [{ value: "", label: t("(none)") }, ...list]
  }, [wordSpecs, t])
  const attunementCatalog = useMemo(
    () => attunementsFor(piece.slot, inputs.classId),
    [piece.slot, inputs.classId],
  )
  const attunementOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "", label: t("(none)") },
      ...attunementCatalog.map((opt) => ({ value: opt.id, label: t(opt.label) })),
    ],
    [attunementCatalog, t],
  )

  const weaponSide = isWeaponSlot(piece.slot)
  const base = gearBaseStatsFor(piece)

  function capFor(word: string, relayed: boolean): number | null {
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
  function clampAndRound(value: number, word: string, relayed: boolean): number {
    const spec = wordSpecs.find((candidate) => candidate.word === word)
    if (!spec || !Number.isFinite(value)) return value
    const cap = relayed ? relayedCapValue(spec.amount, spec.unit) : spec.amount
    return roundToShownPrecision(Math.min(Math.max(value, 0), cap), spec.unit === "percent")
  }
  function patchWord(idx: number, patchedFields: Partial<GearWordEntry>): void {
    const next = [...piece.words] as GearPiece["words"]
    const merged = { ...next[idx], ...patchedFields }
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
    <fieldset disabled={disabled} style={{ border: "none", padding: 0, margin: 0 }}>
      <div className={styles.gearPairedRow}>
        <label>{t("Type")}</label>
        <Combobox
          value={piece.slot}
          options={slotOptions}
          onChange={(value) => patchBase({ slot: value as GearSlot })}
        />
        <label>{t("Level")}</label>
        <Combobox
          value={String(piece.level)}
          options={levelOptions}
          onChange={(value) => patchBase({ level: Number(value) as GearLevel })}
        />
      </div>
      <div className={styles.gearPairedRow}>
        <label>{t("Rarity")}</label>
        <Combobox
          value={piece.rarity}
          options={rarityOptions}
          onChange={(value) => patchBase({ rarity: value as GearRarity })}
        />
        <label></label>
        <span />
      </div>

      {weaponSide ? (
        <div className={styles.gearPairedRow}>
          <label>{t("Min Phys")}</label>
          <span className={styles.gearDerivedValue}>{base.minPhys}</span>
          <label>{t("Max Phys")}</label>
          <span className={styles.gearDerivedValue}>{base.maxPhys}</span>
        </div>
      ) : (
        <div className={styles.gearPairedRow}>
          <label>{t("HP")}</label>
          <span className={styles.gearDerivedValue}>{base.hp}</span>
          <label>{t("Phys Defense")}</label>
          <span className={styles.gearDerivedValue}>{base.physDef}</span>
        </div>
      )}

      <div className={styles.gearWordsSection}>
        <div className={styles.gearWordsHeader}>
          <div className={styles.gearWordsTitle}>{t("Tunements")}</div>
          <label
            className={styles.gearRelayedToggle}
            title={t("Relayed gear caps each word at 94 % of its max")}
          >
            <input
              type="checkbox"
              checked={piece.relayed}
              onChange={(e) => setRelayed(e.target.checked)}
            />
            {t("Relayed")}
          </label>
        </div>
        <div
          className={styles.gearWordsGrid + (showWordMax ? "" : ` ${styles.gearWordsGridNoMax}`)}
        >
          {piece.words.map((word, idx) => {
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
              deltaTitle = `${t("Full-cast 94%")}: ${maxValueText} → ${deltaText} DPS`
            } else {
              maxValueText = wordMaxPending ? "…" : "—"
            }
            return (
              <div key={idx} className={styles.wordRow}>
                <Combobox
                  className={styles.wordCombobox}
                  value={word.word}
                  options={wordOptions}
                  onChange={(value) => patchWord(idx, { word: value })}
                  placeholder={t("(none)")}
                />
                <ValueInput
                  value={word.value}
                  onChange={(value) => patchWord(idx, { value })}
                  min={0}
                  title={maxDisplay ? `${t("Max")}: ${maxDisplay}` : undefined}
                />
                <button
                  type="button"
                  className={"btn" + (word.retuned ? " is-on" : "")}
                  onClick={() => patchWord(idx, { retuned: !word.retuned })}
                  title={t("Retune")}
                >
                  R
                </button>
                {showWordMax && (
                  <div className={styles.gearWordMax} title={deltaTitle}>
                    <span className={styles.gearWordMaxValue}>{maxValueText}</span>
                    <span className={`${styles.maxDelta} ${deltaSign}`}>{deltaText}</span>
                  </div>
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
          ? `${(min * 100).toFixed(1)}–${(max * 100).toFixed(1)} %${selected.hint ? " " + t(selected.hint) : ""}`
          : ""
        function clampValue(value: number): number {
          if (!selected || !Number.isFinite(value)) return value
          return Math.round(Math.min(Math.max(value, selected.min), selected.max) * 1000) / 1000
        }
        return (
          <div className={styles.gearPairedRow}>
            <label>{t("Attunement")}</label>
            <Combobox
              value={selected?.id ?? ""}
              options={attunementOptions}
              onChange={(value) => patch({ attunement: value, attunementValue: 0 })}
              placeholder={t("(none)")}
            />
            <label>{t("Amount")}</label>
            <ValueInput
              value={piece.attunementValue}
              onChange={(value) => patch({ attunementValue: clampValue(value) })}
              min={0}
              title={rangeHint || undefined}
            />
          </div>
        )
      })()}
    </fieldset>
  )
}
