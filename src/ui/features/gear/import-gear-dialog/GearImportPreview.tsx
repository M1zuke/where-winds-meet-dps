import { useRef } from "react"
import type { GearLevel, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { statLineLabel } from "../../../../data/stats/statLines"
import { getAttunement } from "../../../../engine/attunements"
import { useI18n } from "../../../../i18n/i18nContext"
import {
  attunementKey,
  innerWayKey,
  innerWayTierKey,
  rarityKey,
  statLineKey,
} from "../../../../i18n/contentKeys"
import { fmt } from "../../../utils/statFormatting"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import previewStyles from "../shared/gearPreview.module.scss"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import { unsupportedInnerWayNames } from "./importedInnerWays"
import {
  innerWaysAbsentFromCapture,
  targetKey,
  targetLabel,
  targetLabelKey,
  type AffixTarget,
  type ImportedAffix,
  type ImportedInnerWay,
  type ImportedPiece,
} from "./dashboardGearPayload"
import { effectiveIdentity, type IdentityOverrides } from "./importedGearPieces"
import type { GearImportDraft } from "./useGearImportDraft"
import styles from "./gearImport.module.scss"

const LEVEL_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "86", labelKey: "gear.level.86" },
  { value: "91", labelKey: "gear.level.91" },
  { value: "96", labelKey: "gear.level.96" },
]

// An unmapped line's units are unknown, and two decimals alone would render both
// a 0.044 ceiling and a 0.04 one as "0.04" — so sub-1 magnitudes read as percent.
function fmtUnmapped(value: number | null): string {
  if (value === null) return "—"
  return fmt(value, Math.abs(value) < 1)
}

interface Props {
  draft: GearImportDraft
  mindMethods: Inputs["mindMethods"]
  onClearPaste?(): void
  warnAboutDisplacedSlots: boolean
}

export function GearImportPreview({
  draft,
  mindMethods: currentMindMethods,
  onClearPaste,
  warnAboutDisplacedSlots,
}: Props) {
  const { t } = useI18n()
  const mappingFileRef = useRef<HTMLInputElement | null>(null)
  const {
    result,
    summary,
    pieces,
    shown,
    innerWays,
    mindMethods,
    overrides,
    setOverride,
    choices,
    chooseTarget,
    exportMappings,
    importMappings,
    copyNotice,
    copyDiagnostics,
  } = draft

  if (!result || !summary) return null

  const unsupportedInnerWays = unsupportedInnerWayNames(innerWays)
  const emptiedMindMethods = mindMethods
    ? currentMindMethods.filter((slot, index) => slot.name && !mindMethods[index]!.name).length
    : 0

  const filledSlots = new Set(pieces.map((piece) => piece.slot))
  const emptiedSlots = GEAR_SLOTS.filter((slot) => !filledSlots.has(slot))
  const assumedIdentitySlots = shown
    .filter((piece) => piece.slot.kind === "mapped" && piece.identity?.rarity == null)
    .map((piece) => (piece.slot as { slot: GearSlot }).slot)

  return (
    <>
      <div className={styles.summary}>
        <span>
          {result.roleName ?? t("gear.importGearDialog.unnamedCharacter")}
          {result.characterLevel !== null
            ? ` · ${t("gear.importGearDialog.level")} ${result.characterLevel}`
            : ""}
        </span>
        <span className="hint">
          {`${summary.mappedPieceCount}/${summary.pieceCount} ${t("gear.importGearDialog.piecesMatched")} · ${summary.resolvedAffixCount} ${t("gear.importGearDialog.statsRead")}${summary.unmappedAffixCount ? ` · ${summary.unmappedAffixCount} ${t("gear.importGearDialog.unmapped")}` : ""}${summary.clampedCount ? ` · ${summary.clampedCount} ${t("gear.importGearDialog.clamped")}` : ""}`}
        </span>
        {onClearPaste && (
          <button type="button" className="btn" onClick={onClearPaste}>
            {t("gear.importGearDialog.pasteADifferentCapture")}
          </button>
        )}
      </div>

      {innerWays.length > 0 && (
        <>
          <div className={styles.toolRow}>
            <span className="section-label">{t("gear.importGearDialog.innerWays")}</span>
            <span className="hint">
              {`${summary.resolvedInnerWayCount}/${summary.innerWayCount} ${t("gear.importGearDialog.matched")}`}
            </span>
          </div>
          <div className={styles.innerWayGrid}>
            {innerWays.map((innerWay, index) => (
              <InnerWayCard key={index} innerWay={innerWay} />
            ))}
          </div>
        </>
      )}

      {unsupportedInnerWays.length > 0 && (
        <div className="warnings">
          ⚠ {t("gear.importGearDialog.thisAppDoesNotModel")} {unsupportedInnerWays.join(", ")} —{" "}
          {t("gear.importGearDialog.theyAreLeftHint")}
        </div>
      )}

      {innerWaysAbsentFromCapture(result) && (
        <div className="warnings">⚠ {t("gear.importGearDialog.thisCaptureCarriesHint")}</div>
      )}

      {warnAboutDisplacedSlots && emptiedMindMethods > 0 && (
        <div className="warnings">
          ⚠ {emptiedMindMethods} {t("gear.importGearDialog.ofYourInnerHint")}
        </div>
      )}

      {summary.notInThisBuildCount > 0 && (
        <div className="warnings">
          ⚠ {summary.notInThisBuildCount} {t("gear.importGearDialog.statLinesAreHint")}
        </div>
      )}

      {summary.unmappedAffixCount - summary.notInThisBuildCount > 0 && (
        <div className="warnings">
          ⚠ {summary.unmappedAffixCount - summary.notInThisBuildCount}{" "}
          {t("gear.importGearDialog.statLinesHaveHint")}{" "}
          <button type="button" className="btn" onClick={copyDiagnostics}>
            {t("gear.importGearDialog.copyDiagnostics")}
          </button>
        </div>
      )}

      <div className={styles.toolRow}>
        <span className="section-label">{t("gear.importGearDialog.statLineMappings")}</span>
        <button
          type="button"
          className="btn"
          disabled={!Object.keys(choices).length}
          onClick={exportMappings}
        >
          {t("gear.importGearDialog.exportAsJson")}
        </button>
        <button type="button" className="btn" onClick={() => mappingFileRef.current?.click()}>
          {t("gear.importGearDialog.importJson")}
        </button>
        <span className="hint">
          {Object.keys(choices).length} {t("gear.importGearDialog.mappedByYou")}
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
        <div className="warnings">⚠ {t("gear.importGearDialog.thisCaptureHoldsNoGear")}</div>
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
          ⚠ {t("gear.importGearDialog.thesePiecesReportHint")}:{" "}
          {assumedIdentitySlots.map((slot) => t(GEAR_SLOT_KEYS[slot])).join(", ")}.{" "}
          {t("gear.importGearDialog.onArmorThisHint")}
        </div>
      )}

      {warnAboutDisplacedSlots && emptiedSlots.length > 0 && (
        <div className="warnings">
          ⚠ {emptiedSlots.length} {t("gear.importGearDialog.slotsArenTInThis")}:{" "}
          {emptiedSlots.map((slot) => t(GEAR_SLOT_KEYS[slot])).join(", ")}
        </div>
      )}
    </>
  )
}

function identityHintKey(piece: ImportedPiece): string {
  if (piece.identity?.level && piece.identity.rarity)
    return "gear.importGearDialog.identityFromBaseStats"
  if (piece.identity?.rarity) return "gear.importGearDialog.identityRarityFromBaseStats"
  if (piece.observedBaseStats) return "gear.importGearDialog.identityFromUnknownTier"
  return "gear.importGearDialog.identityAssumed"
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
    { value: "legendary", label: t(rarityKey("legendary")) },
    { value: "epic", label: t(rarityKey("epic")) },
  ]

  if (piece.slot.kind !== "mapped") {
    return (
      <div className={`${previewStyles.piece} ${previewStyles.skipped}`}>
        <div className={previewStyles.pieceHead}>
          <span className={previewStyles.pieceSlot}>
            {t("gear.importGearDialog.gameSlot")} {piece.gameSlotId}
          </span>
          <span className="hint">{t("gear.importGearDialog.unknownSlotSkipped")}</span>
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
        <span className={previewStyles.pieceSlot}>{t(GEAR_SLOT_KEYS[slot])}</span>
        <span className="hint">
          {isWeaponSlot(slot)
            ? `${t("common.minPhys")} ${base.minPhys} · ${t("common.maxPhys")} ${base.maxPhys}`
            : `${t("content.statLine.hp")} ${base.hp} · ${t("content.statLine.physDef")} ${base.physDef}`}
        </span>
      </div>

      <div className={previewStyles.identityRow}>
        <Combobox
          className={previewStyles.identityPicker}
          value={String(identity.level)}
          options={LEVEL_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
          onChange={(value) => onOverride(piece.gameSlotId, { level: Number(value) as GearLevel })}
        />
        <Combobox
          className={previewStyles.identityPicker}
          value={identity.rarity}
          options={rarityOptions}
          onChange={(value) => onOverride(piece.gameSlotId, { rarity: value as GearRarity })}
        />
        <span className="hint">{t(identityHintKey(piece))}</span>
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
          <span className="hint">{t("gear.importGearDialog.beyondThe5TunementRows")}</span>
          {piece.overflowAffixes.map((affix, index) => (
            <AffixRow key={index} affix={affix} onChooseTarget={onChooseTarget} />
          ))}
        </div>
      )}
    </div>
  )
}

function statLineName(mappedTo: string, t: (key: string, fallback?: string) => string): string {
  const separator = mappedTo.indexOf(":")
  const name = mappedTo.slice(separator + 1)
  if (mappedTo.slice(0, separator) !== "attunement")
    return t(statLineKey(name), statLineLabel(name))
  const attunement = getAttunement(name)
  return attunement ? t(attunementKey(attunement.id), attunement.label) : name
}

function innerWayNoteKey(innerWay: ImportedInnerWay): string {
  switch (innerWay.resolution.kind) {
    case "resolved":
      return innerWay.resolution.tierAssumed ? "gear.importGearDialog.tierAssumed" : ""
    case "notForThisClass":
      return "gear.importGearDialog.innerWayNotForThisClass"
    case "unsupported":
      return "gear.importGearDialog.innerWayUnsupported"
    case "unmapped":
      return "gear.importGearDialog.innerWayUnmapped"
  }
}

function innerWayLabel(
  innerWay: ImportedInnerWay,
  t: (key: string, fallback?: string) => string,
): string {
  const resolution = innerWay.resolution
  switch (resolution.kind) {
    case "resolved":
    case "notForThisClass":
      return t(innerWayKey(resolution.innerWayId), resolution.name)
    case "unsupported":
      return resolution.name
    case "unmapped":
      return `#${innerWay.passiveId}`
  }
}

function InnerWayCard({ innerWay }: { innerWay: ImportedInnerWay }) {
  const { t } = useI18n()
  const resolution = innerWay.resolution
  const tier = resolution.kind === "resolved" ? resolution.tier : innerWay.reportedTier
  const tierText = tier === null ? null : `tier ${tier}`

  return (
    <div
      className={
        resolution.kind === "resolved"
          ? styles.innerWayCard
          : `${styles.innerWayCard} ${styles.unresolved}`
      }
    >
      <span className={styles.innerWayTier}>
        {tierText ? t(innerWayTierKey(tierText), tierText) : t("gear.importGearDialog.noTier")}
      </span>
      <span className={styles.innerWayName}>{innerWayLabel(innerWay, t)}</span>
      {innerWayNoteKey(innerWay) && <span className="hint">{t(innerWayNoteKey(innerWay))}</span>}
    </div>
  )
}

function targetOptions(
  suggestions: readonly AffixTarget[],
  choosable: readonly AffixTarget[],
  t: (key: string, fallback?: string) => string,
): ComboboxOption[] {
  const suggested = new Set(suggestions.map(targetKey))
  const rest = choosable.filter((target) => !suggested.has(targetKey(target)))
  return [...suggestions, ...rest].map((target) => ({
    value: targetKey(target),
    label: suggested.has(targetKey(target))
      ? `${t(targetLabelKey(target), targetLabel(target))} ✓`
      : t(targetLabelKey(target), targetLabel(target)),
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
    const known = resolution.mappedTo ? statLineName(resolution.mappedTo, t) : null
    return (
      <div className={`${previewStyles.affix} ${previewStyles.unresolved}`}>
        <Combobox
          className={previewStyles.affixPicker}
          value=""
          options={options}
          placeholder={
            known ??
            `#${affix.affixId}${affix.derivedMax !== null ? ` · ${t("common.max")} ${fmtUnmapped(affix.derivedMax)}` : ""}`
          }
          onChange={(value) => onChooseTarget(affix.affixId, value)}
        />
        <span className={previewStyles.affixValue}>{fmtUnmapped(affix.rawValue)}</span>
        <span className="hint">
          {known
            ? t("gear.importGearDialog.notOnThisClass")
            : isAttunement
              ? t("gear.importGearDialog.attunementPickOne")
              : t("gear.importGearDialog.pickOne")}
        </span>
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
          {`${fmt(resolution.clampedFrom, isPercent)} → ${t("gear.importGearDialog.inRange")}`}
        </span>
      ) : (
        <span />
      )}
    </div>
  )
}
