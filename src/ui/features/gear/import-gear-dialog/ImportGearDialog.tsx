import { useId, useMemo, useRef, useState } from "react"
import type { GearLevel, GearPiece, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { useI18n } from "../../../../i18n/i18nContext"
import { fmt } from "../../../utils/statFormatting"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import dialogChrome from "../shared/gearDialog.module.scss"
import previewStyles from "../shared/gearPreview.module.scss"
import { GEAR_SLOT_LABELS } from "../shared/gearLabels"
import bookmarkletSource from "./gearImportBookmarklet.js?raw"
import { bookmarkletHref } from "./bookmarkletHref"
import {
  AFFIX_MAPPINGS_FILE_NAME,
  exportAffixChoices,
  loadAffixChoices,
  parseAffixChoicesFile,
  saveAffixChoices,
} from "./affixChoiceStore"
import { loadKeepDisplaced, saveKeepDisplaced } from "./importPreferences"
import {
  GearImportError,
  buildImportDiagnostics,
  parseDashboardGearPayload,
  previewablePieces,
  summarizeImport,
  targetKey,
  targetLabel,
  type AffixTarget,
  type GearImportResult,
  type ImportedAffix,
  type ImportedPiece,
} from "./dashboardGearPayload"
import {
  effectiveIdentity,
  resolveAgainstBuild,
  toGearPieces,
  type AffixChoices,
  type IdentityOverrides,
} from "./importedGearPieces"
import styles from "./ImportGearDialog.module.scss"

export const DASHBOARD_URL = "https://www.wherewindsmeetgame.com/m/2025h5sjgj/en/"

const LEVEL_OPTIONS: ComboboxOption[] = [
  { value: "86", label: "lv86" },
  { value: "91", label: "lv91" },
  { value: "96", label: "lv96" },
]

// An unmapped line's units are unknown, and two decimals alone would render both
// a 0.044 ceiling and a 0.04 one as "0.04" — so sub-1 magnitudes read as percent.
function fmtUnmapped(value: number | null): string {
  if (value === null) return "—"
  return fmt(value, Math.abs(value) < 1)
}

interface Props {
  inputs: Inputs
  onCancel(): void
  onImport(pieces: GearPiece[], keepDisplaced: boolean): void
}

export function ImportGearDialog({ inputs, onCancel, onImport }: Props) {
  const { t } = useI18n()
  const [pasted, setPasted] = useState("")
  const [overrides, setOverrides] = useState<IdentityOverrides>({})
  const [choices, setChoices] = useState<AffixChoices>(loadAffixChoices)
  const [keepDisplaced, setKeepDisplaced] = useState(loadKeepDisplaced)
  const [copyNotice, setCopyNotice] = useState("")
  const mappingFileRef = useRef<HTMLInputElement | null>(null)
  const titleId = useId()

  // Set through a ref rather than the href prop so React never inspects the
  // javascript: URL, and on every mount because the anchor unmounts while a
  // parsed capture is on screen.
  function attachBookmarklet(anchor: HTMLAnchorElement | null): void {
    anchor?.setAttribute("href", bookmarkletHref(bookmarkletSource))
  }

  const parsed = useMemo((): { result: GearImportResult | null; error: string } => {
    if (!pasted.trim()) return { result: null, error: "" }
    try {
      return {
        result: resolveAgainstBuild(parseDashboardGearPayload(pasted), inputs, choices),
        error: "",
      }
    } catch (failure) {
      if (failure instanceof GearImportError) return { result: null, error: failure.message }
      throw failure
    }
  }, [pasted, inputs, choices])

  const result = parsed.result
  const summary = useMemo(() => (result ? summarizeImport(result) : null), [result])
  const pieces = useMemo(() => (result ? toGearPieces(result, overrides) : []), [result, overrides])
  const shown = useMemo(() => (result ? previewablePieces(result) : []), [result])

  const filledSlots = new Set(pieces.map((piece) => piece.slot))
  const emptiedSlots = GEAR_SLOTS.filter((slot) => !filledSlots.has(slot))
  const assumedIdentitySlots = shown
    .filter((piece) => piece.slot.kind === "mapped" && piece.identity?.rarity == null)
    .map((piece) => (piece.slot as { slot: GearSlot }).slot)

  async function copyToClipboard(text: string, notice: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      setCopyNotice(notice)
    } catch {
      setCopyNotice(t("Copying failed — select the text and copy it manually."))
    }
  }

  function setOverride(
    gameSlotId: string,
    patch: { level?: GearLevel; rarity?: GearRarity },
  ): void {
    setOverrides((previous) => ({
      ...previous,
      [gameSlotId]: { ...previous[gameSlotId], ...patch },
    }))
  }

  function chooseKeepDisplaced(keep: boolean): void {
    setKeepDisplaced(keep)
    saveKeepDisplaced(keep)
  }

  function clearPaste(): void {
    setPasted("")
    setOverrides({})
    setCopyNotice("")
  }

  function commitChoices(next: AffixChoices): void {
    setChoices(next)
    saveAffixChoices(next)
  }

  function chooseTarget(affixId: string, key: string): void {
    commitChoices({ ...choices, [affixId]: key })
  }

  function exportMappings(): void {
    const url = URL.createObjectURL(
      new Blob([exportAffixChoices(choices)], { type: "application/json" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = AFFIX_MAPPINGS_FILE_NAME
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importMappings(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const loaded = parseAffixChoicesFile(await file.text())
      commitChoices({ ...choices, ...loaded })
      setCopyNotice(`${Object.keys(loaded).length} ${t("mappings loaded.")}`)
    } catch (failure) {
      setCopyNotice(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <Dialog labelledBy={titleId} onClose={onCancel} surfaceClassName={dialogChrome.wide}>
      <DialogHeader>
        <h2 id={titleId}>{t("Import gear")}</h2>
      </DialogHeader>

      <DialogBody>
        {!result && (
          <>
            <ol className={styles.steps}>
              <li>
                {t("Drag this to your bookmarks bar:")}{" "}
                <a
                  ref={attachBookmarklet}
                  className={styles.bookmarklet}
                  onClick={(event) => event.preventDefault()}
                >
                  {t("Import WWM Gear")}
                </a>
              </li>
              <li>
                {t("Open the")}{" "}
                <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
                  {t("official WWM dashboard")}
                </a>{" "}
                {t("and sign in, then click the bookmark.")}
              </li>
              <li>{t("Paste what it copied below.")}</li>
            </ol>

            {copyNotice && <div className="hint">{copyNotice}</div>}

            <textarea
              className={styles.paste}
              value={pasted}
              spellCheck={false}
              placeholder={t("Paste the copied gear JSON here")}
              onChange={(event) => setPasted(event.target.value)}
            />

            {parsed.error && <div className="warnings">⚠ {parsed.error}</div>}
          </>
        )}

        {result && summary && (
          <>
            <div className={styles.summary}>
              <span>
                {result.roleName ?? t("Unnamed character")}
                {result.characterLevel !== null ? ` · ${t("Level")} ${result.characterLevel}` : ""}
              </span>
              <span className="hint">
                {`${summary.mappedPieceCount}/${summary.pieceCount} ${t("pieces matched")} · ${summary.resolvedAffixCount} ${t("stats read")}${summary.unmappedAffixCount ? ` · ${summary.unmappedAffixCount} ${t("unmapped")}` : ""}${summary.clampedCount ? ` · ${summary.clampedCount} ${t("clamped")}` : ""}`}
              </span>
            </div>

            {summary.unmappedAffixCount > 0 && (
              <div className="warnings">
                ⚠ {summary.unmappedAffixCount}{" "}
                {t(
                  "stat lines have no mapping yet. Pick the stat each one is — a ✓ marks the ones whose max roll fits, and every choice is remembered for next time.",
                )}{" "}
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    copyToClipboard(
                      buildImportDiagnostics(result),
                      t("Diagnostics copied — they contain no account details."),
                    )
                  }
                >
                  {t("Copy diagnostics")}
                </button>
              </div>
            )}

            <div className={styles.toolRow}>
              <span className="section-label">{t("Stat-line mappings")}</span>
              <button
                type="button"
                className="btn"
                disabled={!Object.keys(choices).length}
                onClick={exportMappings}
              >
                {t("Export as JSON")}
              </button>
              <button type="button" className="btn" onClick={() => mappingFileRef.current?.click()}>
                {t("Import JSON")}
              </button>
              <span className="hint">
                {Object.keys(choices).length} {t("mapped by you")}
              </span>
              <input
                ref={mappingFileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={importMappings}
              />
            </div>

            {copyNotice && <div className="hint">{copyNotice}</div>}

            {!shown.length && (
              <div className="warnings">
                ⚠ {t("This capture holds no gear this app can import.")}
              </div>
            )}

            <div className={previewStyles.pieceList}>
              {shown.map((piece) => (
                <PiecePreview
                  key={piece.gameSlotId}
                  piece={piece}
                  allPieces={result.pieces}
                  overrides={overrides}
                  onOverride={setOverride}
                  onChooseTarget={chooseTarget}
                />
              ))}
            </div>

            {assumedIdentitySlots.length > 0 && (
              <div className="warnings">
                ⚠{" "}
                {t(
                  "These pieces report base stats this app has no tier for, so their level and rarity are a guess — set them yourself",
                )}
                : {assumedIdentitySlots.map((slot) => t(GEAR_SLOT_LABELS[slot])).join(", ")}.{" "}
                {t("On armor this only changes the HP and defense shown, never the DPS.")}
              </div>
            )}

            {emptiedSlots.length > 0 && (
              <div className="warnings">
                ⚠ {emptiedSlots.length} {t("slots aren't in this payload and will be emptied")}:{" "}
                {emptiedSlots.map((slot) => t(GEAR_SLOT_LABELS[slot])).join(", ")}
              </div>
            )}
          </>
        )}
      </DialogBody>

      <DialogFooter>
        {result && (
          <div className={styles.modeChoice}>
            <span className="section-label">{t("Gear you have now")}</span>
            <label>
              <input
                type="radio"
                checked={!keepDisplaced}
                onChange={() => chooseKeepDisplaced(false)}
              />
              {t("Remove replaced")}
            </label>
            <label>
              <input
                type="radio"
                checked={keepDisplaced}
                onChange={() => chooseKeepDisplaced(true)}
              />
              {t("Keep in inventory")}
            </label>
          </div>
        )}
        <span className="spacer" />
        <span className="hint">{t("Nothing is written until you press Save.")}</span>
        {result && (
          <button type="button" className="btn" onClick={clearPaste}>
            {t("Back")}
          </button>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          {t("Cancel")}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!pieces.length}
          onClick={() => onImport(pieces, keepDisplaced)}
        >
          {t("Import gear")}
        </button>
      </DialogFooter>
    </Dialog>
  )
}

function identityHint(piece: ImportedPiece): string {
  if (piece.identity?.level && piece.identity.rarity) return "read from this piece's base stats"
  if (piece.identity?.rarity) return "rarity read from base stats; level assumed"
  if (piece.observedBaseStats) return "base stats match no known tier — assumed"
  return "no base stats in the payload — assumed"
}

function PiecePreview({
  piece,
  allPieces,
  overrides,
  onOverride,
  onChooseTarget,
}: {
  piece: ImportedPiece
  allPieces: readonly ImportedPiece[]
  overrides: IdentityOverrides
  onOverride(gameSlotId: string, patch: { level?: GearLevel; rarity?: GearRarity }): void
  onChooseTarget(affixId: string, key: string): void
}) {
  const { t } = useI18n()
  const rarityOptions: ComboboxOption[] = [
    { value: "legendary", label: t("Legendary") },
    { value: "epic", label: t("Epic") },
  ]

  if (piece.slot.kind !== "mapped") {
    return (
      <div className={`${previewStyles.piece} ${previewStyles.skipped}`}>
        <div className={previewStyles.pieceHead}>
          <span className={previewStyles.pieceSlot}>
            {t("Game slot")} {piece.gameSlotId}
          </span>
          <span className="hint">{t("unknown slot — skipped")}</span>
        </div>
      </div>
    )
  }

  const slot = piece.slot.slot
  const identity = effectiveIdentity(piece, allPieces, overrides)
  const base = gearBaseStatsFor({ slot, ...identity })

  return (
    <div className={previewStyles.piece}>
      <div className={previewStyles.pieceHead}>
        <span className={previewStyles.pieceSlot}>{t(GEAR_SLOT_LABELS[slot])}</span>
        <span className="hint">
          {isWeaponSlot(slot)
            ? `${t("Min Phys")} ${base.minPhys} · ${t("Max Phys")} ${base.maxPhys}`
            : `${t("HP")} ${base.hp} · ${t("Phys Defense")} ${base.physDef}`}
        </span>
      </div>

      <div className={previewStyles.identityRow}>
        <Combobox
          className={previewStyles.identityPicker}
          value={String(identity.level)}
          options={LEVEL_OPTIONS}
          onChange={(value) => onOverride(piece.gameSlotId, { level: Number(value) as GearLevel })}
        />
        <Combobox
          className={previewStyles.identityPicker}
          value={identity.rarity}
          options={rarityOptions}
          onChange={(value) => onOverride(piece.gameSlotId, { rarity: value as GearRarity })}
        />
        <span className="hint">{t(identityHint(piece))}</span>
      </div>

      <div className={previewStyles.affixList}>
        {piece.affixes.map((affix, index) => (
          <AffixRow key={index} affix={affix} onChooseTarget={onChooseTarget} />
        ))}
        {piece.attunement && (
          <AffixRow affix={piece.attunement} isAttunement onChooseTarget={onChooseTarget} />
        )}
      </div>

      {piece.overflowAffixes.length > 0 && (
        <div className={previewStyles.overflow}>
          <span className="hint">{t("Beyond the 5 tunement rows — not imported")}</span>
          {piece.overflowAffixes.map((affix, index) => (
            <AffixRow key={index} affix={affix} onChooseTarget={onChooseTarget} />
          ))}
        </div>
      )}
    </div>
  )
}

function targetOptions(
  suggestions: readonly AffixTarget[],
  choosable: readonly AffixTarget[],
  t: (key: string) => string,
): ComboboxOption[] {
  const suggested = new Set(suggestions.map(targetKey))
  const rest = choosable.filter((target) => !suggested.has(targetKey(target)))
  return [...suggestions, ...rest].map((target) => ({
    value: targetKey(target),
    label: suggested.has(targetKey(target))
      ? `${t(targetLabel(target))} ✓`
      : t(targetLabel(target)),
  }))
}

function AffixRow({
  affix,
  isAttunement = false,
  onChooseTarget,
}: {
  affix: ImportedAffix
  isAttunement?: boolean
  onChooseTarget(affixId: string, key: string): void
}) {
  const { t } = useI18n()
  const resolution = affix.resolution
  const options = targetOptions(resolution.suggestions, resolution.choosableTargets, t)

  if (resolution.kind !== "resolved") {
    return (
      <div className={`${previewStyles.affix} ${previewStyles.unresolved}`}>
        <Combobox
          className={previewStyles.affixPicker}
          value=""
          options={options}
          placeholder={`#${affix.affixId}${affix.derivedMax !== null ? ` · ${t("max")} ${fmtUnmapped(affix.derivedMax)}` : ""}`}
          onChange={(value) => onChooseTarget(affix.affixId, value)}
        />
        <span className={previewStyles.affixValue}>{fmtUnmapped(affix.rawValue)}</span>
        <span className="hint">{isAttunement ? t("attunement — pick one") : t("pick one")}</span>
      </div>
    )
  }

  const target = resolution.target
  const isPercent = target.kind === "attunement" || target.unit === "percent"

  return (
    <div className={previewStyles.affix}>
      <Combobox
        className={previewStyles.affixPicker}
        value={targetKey(target)}
        options={options}
        onChange={(value) => onChooseTarget(affix.affixId, value)}
      />
      <span className={previewStyles.affixValue}>{fmt(resolution.value, isPercent)}</span>
      {resolution.clampedFrom !== null ? (
        <span className={`${previewStyles.affixNote} is-negative`}>
          {`${fmt(resolution.clampedFrom, isPercent)} → ${t("in range")}`}
        </span>
      ) : (
        <span />
      )}
    </div>
  )
}
