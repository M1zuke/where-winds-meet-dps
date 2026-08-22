import { useId, useMemo, useRef, useState } from "react"
import { classDefinition } from "../../../../definitions/classes/registry"
import { SET_BY_ID } from "../../../../definitions/sets/registry"
import { attunementLabel, attunementLabelKey, getAttunement } from "../../../../engine/attunements"
import { RELAYED_FACTOR } from "../../../../engine/gearStats"
import { graduationBuild, graduationInputs } from "../../../../engine/graduation"
import { resistanceForInputs } from "../../../../engine/panel"
import type { Arsenal, BowSet, GearPiece, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS, isWeaponSlot } from "../../../../engine/types"
import { statLineLabel } from "../../../../data/stats/statLines"
import { classKey, rarityKey, setKey, statLineKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { StatsOverviewPanel } from "../../../components/stats-overview-panel/StatsOverviewPanel"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { SubTabPanel } from "../../../components/sub-tabs/SubTabPanel"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import dialogChrome from "../shared/gearDialog.module.scss"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import previewStyles from "../shared/gearPreview.module.scss"
import styles from "./GraduationBuildDialog.module.scss"

interface Props {
  inputs: Inputs
  theoreticalDps: number | null
  relayedTheoreticalDps: number | null
  onClose(): void
}

const BOW_SET_KEYS: Readonly<Record<Exclude<BowSet, null>, string>> = {
  affinity: "common.affinity",
  crit: "common.crit",
  precision: "common.precision",
}

const ARSENAL_KEYS: Readonly<Record<Arsenal, string>> = {
  general: "common.generalArsenal",
  bellstrike: "common.bellstrikeArsenal",
  stonesplit: "common.stonesplitArsenal",
  silkbind: "common.silkbindArsenal",
  bamboocut: "common.bamboocutArsenal",
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

function baseStatsLabel(piece: GearPiece, t: (key: string, fallback?: string) => string): string {
  return isWeaponSlot(piece.slot)
    ? `${t("common.minPhys")} ${piece.minPhys} · ${t("common.maxPhys")} ${piece.maxPhys}`
    : `${t("content.statLine.hp")} ${piece.hp.toLocaleString()} · ${t("content.statLine.physDef")} ${piece.physDef}`
}

export function GraduationBuildDialog({
  inputs,
  theoreticalDps,
  relayedTheoreticalDps,
  onClose,
}: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [tab, setTab] = useState<"build" | "stats">("build")
  const [relayed, setRelayed] = useState(false)
  const variant = relayed ? "relayed" : "maxRolls"
  const classDef = classDefinition(inputs.classId)
  const build = useMemo(() => graduationBuild(inputs.classId, variant), [inputs.classId, variant])
  const benchmarkInputs = useMemo(() => graduationInputs(inputs, variant), [inputs, variant])

  if (!classDef || !build || !benchmarkInputs) return null
  const piecesBySlot = new Map(build.gear.map((piece) => [piece.slot, piece]))
  const armorSet = build.set ? SET_BY_ID[build.set] : null

  return (
    <Dialog
      labelledBy={titleId}
      describedBy={descriptionId}
      onClose={onClose}
      surfaceClassName={dialogChrome.wide}
      initialFocusRef={closeButtonRef}
    >
      <DialogHeader>
        <h2 id={titleId}>{t("gear.graduationBuildDialog.graduationBuild")}</h2>
      </DialogHeader>

      <DialogBody>
        <div className={styles.intro} id={descriptionId}>
          <span>{t(classKey(classDef.id), classDef.displayName)}</span>
          <label className={styles.relayedToggle}>
            <input
              type="checkbox"
              checked={relayed}
              onChange={(event) => setRelayed(event.target.checked)}
            />
            {t("gear.graduationBuildDialog.relayedWords")} ({RELAYED_PERCENT}%{" "}
            {t("gear.graduationBuildDialog.ofMaxRoll")})
          </label>
          <span className={styles.theoreticalDps}>
            {t("common.dps")} {formatDps(relayed ? relayedTheoreticalDps : theoreticalDps)}
          </span>
        </div>

        <SubTabs
          active={tab}
          onSelect={setTab}
          tabs={[
            { key: "build", label: t("gear.graduationBuildDialog.build") },
            { key: "stats", label: t("common.panelStats") },
          ]}
        />

        <SubTabPanel>
          {tab === "build" && (
            <>
              <div className={styles.buildSummary}>
                <SummaryItem
                  label={t("common.armorSet")}
                  value={armorSet ? t(setKey(armorSet.id), armorSet.name) : t("common.unselected")}
                />
                <SummaryItem
                  label={t("common.bowSet")}
                  value={build.bowSet ? t(BOW_SET_KEYS[build.bowSet]) : t("common.unselected")}
                />
                <SummaryItem label={t("common.arsenal")} value={t(ARSENAL_KEYS[build.arsenal])} />
                <SummaryItem
                  label={t("common.talentsOddities")}
                  value={t("gear.graduationBuildDialog.allEnabled")}
                />
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
                      aria-label={t(GEAR_SLOT_KEYS[slot])}
                    >
                      <div className={previewStyles.pieceHead}>
                        <span className={previewStyles.pieceSlot}>{t(GEAR_SLOT_KEYS[slot])}</span>
                        <span className="hint">{baseStatsLabel(piece, t)}</span>
                      </div>
                      <div className={previewStyles.identityRow}>
                        <span className={styles.identityBadge}>
                          {t("gear.graduationBuildDialog.level")} {piece.level}
                        </span>
                        <span className={styles.identityBadge}>
                          {t(rarityKey(piece.rarity), piece.rarity)}
                        </span>
                      </div>
                      <div className={previewStyles.affixList}>
                        {piece.words.map((word, index) => (
                          <div className={previewStyles.affix} key={`${word.word}-${index}`}>
                            <span className={previewStyles.affixName}>
                              {t(statLineKey(word.word), statLineLabel(word.word))}
                            </span>
                            <span className={previewStyles.affixValue}>
                              {formatGearValue(word.value)}
                            </span>
                            <span />
                          </div>
                        ))}
                        <div className={`${previewStyles.affix} ${styles.attunement}`}>
                          <span className={previewStyles.affixName}>
                            {attunement
                              ? t(
                                  attunementLabelKey(attunement, null),
                                  attunementLabel(attunement, null),
                                )
                              : piece.attunement}
                          </span>
                          <span className={previewStyles.affixValue}>
                            {formatGearValue(piece.attunementValue)}
                          </span>
                          <span className={styles.attunementLabel}>{t("common.attunement")}</span>
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
                {t("common.resistance")}:{" "}
                <span className={styles.statsMetaValue}>
                  {resistanceForInputs(benchmarkInputs)}%
                </span>
              </div>
              <StatsOverviewPanel inputs={benchmarkInputs} />
            </div>
          )}
        </SubTabPanel>
      </DialogBody>

      <DialogFooter>
        <button ref={closeButtonRef} type="button" className="btn primary" onClick={onClose}>
          {t("common.close")}
        </button>
      </DialogFooter>
    </Dialog>
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
