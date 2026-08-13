import { useEffect, useMemo, useRef, useState } from "react"
import { classDefinition } from "../../../../definitions/classes/registry"
import { SET_BY_ID } from "../../../../definitions/sets/registry"
import { getAttunement } from "../../../../engine/attunements"
import { RELAYED_FACTOR } from "../../../../engine/gearStats"
import { graduationBuild, graduationInputs } from "../../../../engine/graduation"
import { resistanceForInputs } from "../../../../engine/panel"
import type { Arsenal, BowSet, GearPiece, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { StatsOverviewPanel } from "../../../components/stats-overview-panel/StatsOverviewPanel"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import dialogChrome from "../shared/gearDialog.module.scss"
import { GEAR_SLOT_LABELS } from "../shared/gearLabels"
import previewStyles from "../shared/gearPreview.module.scss"
import styles from "./GraduationBuildDialog.module.scss"

interface Props {
  inputs: Inputs
  theoreticalDps: number | null
  relayedTheoreticalDps: number | null
  onClose(): void
}

const BOW_SET_LABELS: Readonly<Record<Exclude<BowSet, null>, string>> = {
  affinity: "Affinity",
  crit: "Crit",
  precision: "Precision",
}

const ARSENAL_LABELS: Readonly<Record<Arsenal, string>> = {
  general: "General Arsenal",
  bellstrike: "Bellstrike Arsenal",
  stonesplit: "Stonesplit Arsenal",
  silkbind: "Silkbind Arsenal",
  bamboocut: "Bamboocut Arsenal",
}

const RELAYED_PERCENT = Math.round(RELAYED_FACTOR * 100)

function formatDps(value: number | null): string {
  return value === null
    ? "—"
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatGearValue(value: number): string {
  if (Math.abs(value) < 1 && value !== 0) return `${(value * 100).toFixed(2)}%`
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function baseStatsLabel(piece: GearPiece, t: (text: string) => string): string {
  return isWeaponSlot(piece.slot)
    ? `${t("Min Phys")} ${piece.minPhys} · ${t("Max Phys")} ${piece.maxPhys}`
    : `${t("HP")} ${piece.hp.toLocaleString()} · ${t("Phys Defense")} ${piece.physDef}`
}

export function GraduationBuildDialog({
  inputs,
  theoreticalDps,
  relayedTheoreticalDps,
  onClose,
}: Props) {
  const { t } = useI18n()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [tab, setTab] = useState<"build" | "stats">("build")
  const [relayed, setRelayed] = useState(false)
  const variant = relayed ? "relayed" : "maxRolls"
  const classDef = classDefinition(inputs.classId)
  const build = useMemo(() => graduationBuild(inputs.classId, variant), [inputs.classId, variant])
  const benchmarkInputs = useMemo(() => graduationInputs(inputs, variant), [inputs, variant])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      onClose()
    }
    document.addEventListener("keydown", onKey)
    closeButtonRef.current?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!classDef || !build || !benchmarkInputs) return null
  const piecesBySlot = new Map(build.gear.map((piece) => [piece.slot, piece]))
  const armorSet = build.set ? SET_BY_ID[build.set]?.name : null
  const bowSet = build.bowSet ? BOW_SET_LABELS[build.bowSet] : "(unselected)"

  return (
    <div
      className={dialogChrome.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="graduation-build-title"
      aria-describedby="graduation-build-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={`${dialogChrome.modal} ${styles.wideModal}`}>
        <div className={dialogChrome.header}>
          <h2 id="graduation-build-title">{t("Graduation build")}</h2>
        </div>

        <div className={dialogChrome.body}>
          <div className={styles.intro} id="graduation-build-description">
            <span>{t(classDef.displayName)}</span>
            <label className={styles.relayedToggle}>
              <input
                type="checkbox"
                checked={relayed}
                onChange={(event) => setRelayed(event.target.checked)}
              />
              {t(`Relayed words (${RELAYED_PERCENT}% of max roll)`)}
            </label>
            <span className={styles.theoreticalDps}>
              {t("DPS")} {formatDps(relayed ? relayedTheoreticalDps : theoreticalDps)}
            </span>
          </div>

          <SubTabs
            active={tab}
            onSelect={setTab}
            tabs={[
              { key: "build", label: t("Build") },
              { key: "stats", label: t("Panel Stats") },
            ]}
          />

          {tab === "build" && (
            <>
              <div className={styles.buildSummary}>
                <SummaryItem label={t("Armor Set")} value={t(armorSet ?? "(unselected)")} />
                <SummaryItem label={t("Bow Set")} value={t(bowSet)} />
                <SummaryItem label={t("Arsenal")} value={t(ARSENAL_LABELS[build.arsenal])} />
                <SummaryItem label={t("Talents & Oddities")} value={t("All enabled")} />
              </div>

              <div className={previewStyles.pieceList}>
                {GEAR_SLOTS.map((slot) => {
                  const piece = piecesBySlot.get(slot)
                  if (!piece) return null
                  const attunement = getAttunement(piece.attunement)
                  return (
                    <article
                      className={previewStyles.piece}
                      key={slot}
                      aria-label={t(GEAR_SLOT_LABELS[slot])}
                    >
                      <div className={previewStyles.pieceHead}>
                        <span className={previewStyles.pieceSlot}>{t(GEAR_SLOT_LABELS[slot])}</span>
                        <span className="hint">{baseStatsLabel(piece, t)}</span>
                      </div>
                      <div className={previewStyles.identityRow}>
                        <span className={styles.identityBadge}>{t(`Level ${piece.level}`)}</span>
                        <span className={styles.identityBadge}>{t(piece.rarity)}</span>
                      </div>
                      <div className={previewStyles.affixList}>
                        {piece.words.map((word, index) => (
                          <div className={previewStyles.affix} key={`${word.word}-${index}`}>
                            <span className={previewStyles.affixName}>{t(word.word)}</span>
                            <span className={previewStyles.affixValue}>
                              {formatGearValue(word.value)}
                            </span>
                            <span />
                          </div>
                        ))}
                        <div className={`${previewStyles.affix} ${styles.attunement}`}>
                          <span className={previewStyles.affixName}>
                            {t(attunement?.label ?? piece.attunement)}
                          </span>
                          <span className={previewStyles.affixValue}>
                            {formatGearValue(piece.attunementValue)}
                          </span>
                          <span className={styles.attunementLabel}>{t("Attunement")}</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {tab === "stats" && (
            <div className={styles.statsPane}>
              <div className={styles.statsMeta}>
                {t("Resistance")}:{" "}
                <span className={styles.statsMetaValue}>
                  {resistanceForInputs(benchmarkInputs)}%
                </span>
              </div>
              <StatsOverviewPanel inputs={benchmarkInputs} />
            </div>
          )}
        </div>

        <div className={dialogChrome.footer}>
          <button ref={closeButtonRef} type="button" className="btn primary" onClick={onClose}>
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  )
}
