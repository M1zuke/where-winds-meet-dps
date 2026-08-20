import { useI18n } from "../../../../i18n/i18nContext"
import { resistanceForInputs } from "../../../../engine/panel"
import type { Inputs, Result } from "../../../../engine/types"
import { syncClassPermanent } from "../../../utils/classSetup"
import { slotInnerWayId } from "../../../../definitions/innerWays/registry"
import { useItemRanking } from "../../../hooks/useItemRanking"
import { useSetTileDps } from "../../../hooks/useSetTileDps"
import { ClassSelect } from "../class-select/ClassSelect"
import { BreakthroughSelect } from "../breakthrough-select/BreakthroughSelect"
import { MindMethodsPanel } from "../mind-methods-panel/MindMethodsPanel"
import { EncounterSettingsPanel } from "../encounter-settings-panel/EncounterSettingsPanel"
import { SetBonusesPanel } from "../set-bonuses-panel/SetBonusesPanel"
import { StatsOverviewPanel } from "../../../components/stats-overview-panel/StatsOverviewPanel"
import { ItemRankingTable } from "../item-ranking-table/ItemRankingTable"
import styles from "./OverviewTab.module.scss"

export function OverviewTab({
  inputs,
  engineInputs,
  onChange,
  result,
}: {
  inputs: Inputs
  engineInputs: Inputs
  onChange: (next: Inputs) => void
  result: Result
}) {
  const { t } = useI18n()
  const { rows: rankingRows, isPending: rankingPending } = useItemRanking(engineInputs, result.dps)
  const { data: tileDps, isPending: tilesPending } = useSetTileDps(inputs)
  const slottedInnerWays = inputs.mindMethods.filter((slot) => slotInnerWayId(slot)).length
  return (
    <div className={styles.overviewGrid}>
      <div className={styles.slots}>
        <div className="panel">
          <h2>{t("Class & Breakthrough")}</h2>
          <ClassSelect
            value={inputs.classId}
            onChange={(classId) => onChange(syncClassPermanent(inputs, classId))}
          />
          <BreakthroughSelect
            value={inputs.breakthrough}
            onChange={(breakthrough) => onChange({ ...inputs, breakthrough })}
          />
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>{t("Inner Ways")}</h2>
            <span className="panel-head-meta">
              <span className="panel-head-meta-value">{slottedInnerWays}</span> /{" "}
              {inputs.mindMethods.length}
            </span>
          </div>
          <MindMethodsPanel inputs={inputs} onChange={onChange} />
        </div>
        <div className="panel">
          <h2>{t("Encounter Settings")}</h2>
          <EncounterSettingsPanel inputs={inputs} onChange={onChange} />
        </div>
      </div>

      <div className={styles.sets}>
        <div className="panel">
          <h2>{t("Set Bonuses")}</h2>
          <SetBonusesPanel
            inputs={inputs}
            onChange={onChange}
            armorDpsByKey={tileDps?.armorDpsByKey}
            bowDpsByChoice={tileDps?.bowDpsByChoice}
            arsenalDpsByChoice={tileDps?.arsenalDpsByChoice}
            isPending={tilesPending}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <div className="panel">
          <div className="panel-head">
            <h2>{t("Panel Stats")}</h2>
            <span className="panel-head-meta">
              {t("Resistance")}:{" "}
              <span className="panel-head-meta-value">{resistanceForInputs(inputs)}%</span>
            </span>
          </div>
          <StatsOverviewPanel inputs={inputs} />
        </div>
      </div>

      <div className={styles.lift}>
        <div className="panel">
          <div className="panel-head">
            <h2>{t("Gear-Stat Lift")}</h2>
            <span className="panel-head-meta">{rankingRows.length}</span>
          </div>
          <div style={{ opacity: rankingPending ? 0.6 : 1 }}>
            <ItemRankingTable rows={rankingRows} />
          </div>
        </div>
      </div>
    </div>
  )
}
