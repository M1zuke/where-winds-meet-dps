import { useId, useMemo, useRef, useState } from "react"
import { classDefinition } from "../../../../definitions/classes/registry"
import { SET_BY_ID } from "../../../../definitions/sets/registry"
import { RELAYED_FACTOR } from "../../../../engine/gearStats"
import { graduationBuild, graduationInputs } from "../../../../engine/graduation"
import { resistanceForInputs } from "../../../../engine/panel"
import type { Inputs } from "../../../../engine/types"
import { GEAR_SLOTS } from "../../../../engine/types"
import { classKey, setKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { StatsOverviewPanel } from "../../../components/stats-overview-panel/StatsOverviewPanel"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { SubTabPanel } from "../../../components/sub-tabs/SubTabPanel"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { BuildPieceCard } from "../build-piece-card/BuildPieceCard"
import { BuildSummary, type BuildSummaryItem } from "../build-summary/BuildSummary"
import { ARSENAL_KEYS, BOW_SET_KEYS } from "../shared/buildSetKeys"
import dialogChrome from "../shared/gearDialog.module.scss"
import previewStyles from "../shared/gearPreview.module.scss"
import styles from "./GraduationBuildDialog.module.scss"

interface Props {
  inputs: Inputs
  theoreticalDps: number | null
  relayedTheoreticalDps: number | null
  onClose(): void
}

const RELAYED_PERCENT = Math.round(RELAYED_FACTOR * 100)

function formatDps(value: number | null): string {
  return value === null
    ? "—"
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

  const summaryItems: BuildSummaryItem[] = [
    {
      label: t("common.armorSet"),
      value: armorSet ? t(setKey(armorSet.id), armorSet.name) : t("common.unselected"),
    },
    {
      label: t("common.bowSet"),
      value: build.bowSet ? t(BOW_SET_KEYS[build.bowSet]) : t("common.unselected"),
    },
    { label: t("common.arsenal"), value: t(ARSENAL_KEYS[build.arsenal]) },
    { label: t("common.talentsOddities"), value: t("gear.graduationBuildDialog.allEnabled") },
  ]

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
        <div className={dialogChrome.intro} id={descriptionId}>
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
          <span className={dialogChrome.introDps}>
            {t("common.dps")} {formatDps(relayed ? relayedTheoreticalDps : theoreticalDps)}
          </span>
        </div>

        <SubTabs
          active={tab}
          onSelect={setTab}
          tabs={[
            { key: "build", label: t("common.build") },
            { key: "stats", label: t("common.panelStats") },
          ]}
        />

        <SubTabPanel>
          {tab === "build" && (
            <>
              <BuildSummary items={summaryItems} />

              <div className={previewStyles.pieceList}>
                {GEAR_SLOTS.map((slot) => {
                  const piece = piecesBySlot.get(slot)
                  return piece ? <BuildPieceCard key={slot} piece={piece} /> : null
                })}
              </div>
            </>
          )}

          {tab === "stats" && (
            <div className={dialogChrome.statsPane}>
              <div className={dialogChrome.statsMeta}>
                {t("common.resistance")}:{" "}
                <span className={dialogChrome.statsMetaValue}>
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
