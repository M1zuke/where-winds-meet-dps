import { useRef } from "react"
import type { GearLevel, GearRarity, GearSlot, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { gearBaseStatsFor } from "../../../../data/stats/gearBaseStats"
import { statLineLabel } from "../../../../data/stats/statLines"
import { getAttunement } from "../../../../engine/attunements"
import { useI18n } from "../../../../i18n/i18nContext"
import { fmt } from "../../../utils/statFormatting"
import { Combobox, type ComboboxOption } from "../../../components/combobox/Combobox"
import previewStyles from "../shared/gearPreview.module.scss"
import { GEAR_SLOT_LABELS } from "../shared/gearLabels"
import { unsupportedInnerWayNames } from "./importedInnerWays"
import {
  innerWaysAbsentFromCapture,
  targetKey,
  targetLabel,
  type AffixTarget,
  type ImportedAffix,
  type ImportedInnerWay,
  type ImportedPiece,
} from "./dashboardGearPayload"
import { effectiveIdentity, type IdentityOverrides } from "./importedGearPieces"
import type { GearImportDraft } from "./useGearImportDraft"
import styles from "./gearImport.module.scss"

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
          {result.roleName ?? t("Unnamed character")}
          {result.characterLevel !== null ? ` · ${t("Level")} ${result.characterLevel}` : ""}
        </span>
        <span className="hint">
          {`${summary.mappedPieceCount}/${summary.pieceCount} ${t("pieces matched")} · ${summary.resolvedAffixCount} ${t("stats read")}${summary.unmappedAffixCount ? ` · ${summary.unmappedAffixCount} ${t("unmapped")}` : ""}${summary.clampedCount ? ` · ${summary.clampedCount} ${t("clamped")}` : ""}`}
        </span>
        {onClearPaste && (
          <button type="button" className="btn" onClick={onClearPaste}>
            {t("Paste a different capture")}
          </button>
        )}
      </div>

      {innerWays.length > 0 && (
        <>
          <div className={styles.toolRow}>
            <span className="section-label">{t("Inner ways")}</span>
            <span className="hint">
              {`${summary.resolvedInnerWayCount}/${summary.innerWayCount} ${t("matched")}`}
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
          ⚠ {t("This app does not model")} {unsupportedInnerWays.map(t).join(", ")} —{" "}
          {t(
            "they are left out of the import and out of the calculation, so your real damage will differ.",
          )}
        </div>
      )}

      {innerWaysAbsentFromCapture(result) && (
        <div className="warnings">
          ⚠{" "}
          {t(
            "This capture carries no inner ways — re-drag the bookmarklet from this dialog and run it again.",
          )}
        </div>
      )}

      {warnAboutDisplacedSlots && emptiedMindMethods > 0 && (
        <div className="warnings">
          ⚠ {emptiedMindMethods}{" "}
          {t("of your inner-way slots aren't in this capture and will be emptied.")}
        </div>
      )}

      {summary.notInThisBuildCount > 0 && (
        <div className="warnings">
          ⚠ {summary.notInThisBuildCount}{" "}
          {t(
            "stat lines are known but belong to another class, so they cannot be imported. Attunements are class-specific — each names the weapon art it boosts, so only the classes that wield that art can roll it. Penetration and resistance attunements are weapon-side only, the class-specific ones armour-side.",
          )}
        </div>
      )}

      {summary.unmappedAffixCount - summary.notInThisBuildCount > 0 && (
        <div className="warnings">
          ⚠ {summary.unmappedAffixCount - summary.notInThisBuildCount}{" "}
          {t(
            "stat lines have no mapping yet. Pick the stat each one is — a ✓ marks the ones whose max roll fits, and every choice is remembered for next time.",
          )}{" "}
          <button type="button" className="btn" onClick={copyDiagnostics}>
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
        <div className="warnings">⚠ {t("This capture holds no gear this app can import.")}</div>
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

      {warnAboutDisplacedSlots && emptiedSlots.length > 0 && (
        <div className="warnings">
          ⚠ {emptiedSlots.length} {t("slots aren't in this payload and will be emptied")}:{" "}
          {emptiedSlots.map((slot) => t(GEAR_SLOT_LABELS[slot])).join(", ")}
        </div>
      )}
    </>
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

function statLineName(mappedTo: string, t: (key: string) => string): string {
  const separator = mappedTo.indexOf(":")
  const name = mappedTo.slice(separator + 1)
  if (mappedTo.slice(0, separator) !== "attunement") return t(statLineLabel(name))
  return t(getAttunement(name)?.label ?? name)
}

function innerWayNote(innerWay: ImportedInnerWay): string {
  switch (innerWay.resolution.kind) {
    case "resolved":
      return innerWay.resolution.tierAssumed ? "tier assumed" : ""
    case "notForThisClass":
      return "this class cannot slot it — left out"
    case "unsupported":
      return "not modelled yet — left out"
    case "unmapped":
      return "no mapping yet — left out"
  }
}

function InnerWayCard({ innerWay }: { innerWay: ImportedInnerWay }) {
  const { t } = useI18n()
  const resolution = innerWay.resolution
  const tier = resolution.kind === "resolved" ? resolution.tier : innerWay.reportedTier
  const note = innerWayNote(innerWay)

  return (
    <div
      className={
        resolution.kind === "resolved"
          ? styles.innerWayCard
          : `${styles.innerWayCard} ${styles.unresolved}`
      }
    >
      <span className={styles.innerWayTier}>
        {tier !== null ? t(`tier ${tier}`) : t("no tier")}
      </span>
      <span className={styles.innerWayName}>
        {resolution.kind === "unmapped" ? `#${innerWay.passiveId}` : t(resolution.name)}
      </span>
      {note && <span className="hint">{t(note)}</span>}
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
    const known = resolution.mappedTo ? statLineName(resolution.mappedTo, t) : null
    return (
      <div className={`${previewStyles.affix} ${previewStyles.unresolved}`}>
        <Combobox
          className={previewStyles.affixPicker}
          value=""
          options={options}
          placeholder={
            known ??
            `#${affix.affixId}${affix.derivedMax !== null ? ` · ${t("max")} ${fmtUnmapped(affix.derivedMax)}` : ""}`
          }
          onChange={(value) => onChooseTarget(affix.affixId, value)}
        />
        <span className={previewStyles.affixValue}>{fmtUnmapped(affix.rawValue)}</span>
        <span className="hint">
          {known
            ? t("not on this class")
            : isAttunement
              ? t("attunement — pick one")
              : t("pick one")}
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
          {`${fmt(resolution.clampedFrom, isPercent)} → ${t("in range")}`}
        </span>
      ) : (
        <span />
      )}
    </div>
  )
}
