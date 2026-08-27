import { useId, useMemo, useRef, useState } from "react"
import { classDefinition } from "../../../../definitions/classes/registry"
import { SET_BY_ID } from "../../../../definitions/sets/registry"
import { resistanceForInputs } from "../../../../engine/panel"
import type { GearPiece, GearSlot, Inputs } from "../../../../engine/types"
import { GEAR_SLOTS } from "../../../../engine/types"
import { classKey, setKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { formatNumber } from "../../../utils/numberFormatting"
import { StatsOverviewPanel } from "../../../components/stats-overview-panel/StatsOverviewPanel"
import { SubTabs } from "../../../components/sub-tabs/SubTabs"
import { SubTabPanel } from "../../../components/sub-tabs/SubTabPanel"
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "../../../components/dialog/Dialog"
import { BuildPieceCard } from "../build-piece-card/BuildPieceCard"
import { BuildSummary, type BuildSummaryItem } from "../build-summary/BuildSummary"
import { ARSENAL_KEYS, BOW_SET_KEYS } from "../shared/buildSetKeys"
import dialogChrome from "../shared/gearDialog.module.scss"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import previewStyles from "../shared/gearPreview.module.scss"

interface Props {
  inputs: Inputs
  currentDps: number
  onClose(): void
}

export function EquippedBuildDialog({ inputs, currentDps, onClose }: Props) {
  const { t } = useI18n()
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [tab, setTab] = useState<"build" | "stats">("build")
  const classDef = classDefinition(inputs.classId)

  const piecesBySlot = useMemo(() => {
    const inventoryById = new Map(inputs.inventory.map((piece) => [piece.id, piece]))
    const bySlot = new Map<GearSlot, GearPiece>()
    for (const slot of GEAR_SLOTS) {
      const piece = inventoryById.get(inputs.equipped[slot] ?? "")
      if (piece) bySlot.set(slot, piece)
    }
    return bySlot
  }, [inputs.equipped, inputs.inventory])

  const armorSet = inputs.set ? SET_BY_ID[inputs.set] : null
  const enabledCount =
    inputs.martialArtsTalents.filter((talent) => talent.enabled).length +
    Object.values(inputs.oddities).reduce(
      (total, nodes) => total + nodes.filter((node) => node.enabled).length,
      0,
    )

  const summaryItems: BuildSummaryItem[] = [
    {
      label: t("common.armorSet"),
      value: armorSet ? t(setKey(armorSet.id), armorSet.name) : t("common.unselected"),
    },
    {
      label: t("common.bowSet"),
      value: inputs.bowSet ? t(BOW_SET_KEYS[inputs.bowSet]) : t("common.unselected"),
    },
    { label: t("common.arsenal"), value: t(ARSENAL_KEYS[inputs.arsenal]) },
    {
      label: t("common.talentsOddities"),
      value: `${enabledCount} ${t("gear.equippedBuildDialog.enabled")}`,
    },
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
        <h2 id={titleId}>{t("gear.buildSummary")}</h2>
      </DialogHeader>

      <DialogBody>
        <div className={dialogChrome.intro} id={descriptionId}>
          <span>{t(classKey(inputs.classId), classDef?.displayName ?? inputs.classId)}</span>
          <span className={dialogChrome.introDps}>
            {t("common.dps")} {formatNumber(currentDps)}
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
                  return piece ? (
                    <BuildPieceCard key={slot} piece={piece} />
                  ) : (
                    <EmptySlotCard key={slot} slot={slot} />
                  )
                })}
              </div>
            </>
          )}

          {tab === "stats" && (
            <div className={dialogChrome.statsPane}>
              <div className={dialogChrome.statsMeta}>
                {t("common.resistance")}:{" "}
                <span className={dialogChrome.statsMetaValue}>{resistanceForInputs(inputs)}%</span>
              </div>
              <StatsOverviewPanel inputs={inputs} />
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

function EmptySlotCard({ slot }: { slot: GearSlot }) {
  const { t } = useI18n()
  return (
    <article
      className={`${previewStyles.piece} ${previewStyles.skipped}`}
      aria-label={t(GEAR_SLOT_KEYS[slot])}
    >
      <div className={previewStyles.pieceHead}>
        <span className={previewStyles.pieceSlot}>{t(GEAR_SLOT_KEYS[slot])}</span>
        <span className="hint">{t("gear.equippedBuildDialog.emptySlot")}</span>
      </div>
    </article>
  )
}
