import { useMemo } from "react"
import { useI18n } from "../../../../i18n/i18nContext"
import { statLineKey } from "../../../../i18n/contentKeys"
import { statLineLabel } from "../../../../data/stats/statLines"
import type { Inputs } from "../../../../engine/types"
import { equippedStatLineCounts } from "./equippedStatLineCounts"
import styles from "./EquippedStatLinesPanel.module.scss"

export function EquippedStatLinesPanel({ inputs }: { inputs: Inputs }) {
  const { t } = useI18n()
  const { rows, currentTotal, wantedTotal } = useMemo(
    () => equippedStatLineCounts(inputs),
    [inputs],
  )
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{t("overview.equippedStatLines")}</h2>
        <span className="panel-head-meta">
          <span className="panel-head-meta-value">{currentTotal}</span>
          {wantedTotal !== null && ` / ${wantedTotal}`}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="hint">{t("overview.equippedStatLines.empty")}</p>
      ) : (
        <table className={`ranking-table ranking-table-spaced ${styles.countTable}`}>
          <thead>
            <tr>
              <th>{t("overview.itemRankingTable.statLine")}</th>
              <th>{t("common.count")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.statLineId}>
                <td>{t(statLineKey(row.statLineId), statLineLabel(row.statLineId))}</td>
                <td>
                  <span className={styles.current}>{row.current}</span>
                  {wantedTotal !== null && ` / ${row.wanted}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
