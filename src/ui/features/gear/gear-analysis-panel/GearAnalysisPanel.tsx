import type { GearSlot, Inputs } from "../../../../engine/types"
import type { GearSlotAnalysisRow } from "../../../../engine/gearAnalysis"
import { useI18n } from "../../../../i18n/i18nContext"
import { useGearAnalysis } from "../../../hooks/useGearAnalysis"
import { GEAR_SLOT_KEYS } from "../shared/gearSlotKeys"
import { HelpHint } from "../../../components/help-hint/HelpHint"
import styles from "./GearAnalysisPanel.module.scss"

interface Props {
  engineInputs: Inputs
  currentDps: number
}

type GainKey = "retuneGain" | "reattuneGain" | "relayGain"

const COLUMN_HINT_KEYS: Record<GainKey | "unequipLoss", string> = {
  retuneGain: "gear.analysis.retuneGainHint",
  reattuneGain: "gear.analysis.reattuneGainHint",
  relayGain: "gear.analysis.relayGainHint",
  unequipLoss: "gear.analysis.unequipLossHint",
}

const GAIN_EPSILON = 0.5

function fmtGain(gain: number): string {
  return `+${Math.round(gain).toLocaleString("en-US")}`
}

function fmtLoss(loss: number): string {
  const rounded = Math.round(loss)
  if (rounded === 0) return "0"
  return rounded > 0
    ? `-${rounded.toLocaleString("en-US")}`
    : `+${(-rounded).toLocaleString("en-US")}`
}

function lossSignClass(loss: number): string {
  const rounded = Math.round(loss)
  if (rounded > 0) return "is-negative"
  if (rounded < 0) return "is-positive"
  return "is-zero"
}

function fmtShare(loss: number, totalDps: number): string {
  if (totalDps <= 0) return "—"
  return `${(Math.abs(loss / totalDps) * 100).toFixed(1)} %`
}

function ranksBySlot(rows: GearSlotAnalysisRow[], key: GainKey): Map<GearSlot, number> {
  const worthwhile = rows
    .filter((row) => (row[key] ?? 0) > GAIN_EPSILON)
    .sort((rowA, rowB) => (rowB[key] ?? 0) - (rowA[key] ?? 0))
  return new Map(worthwhile.map((row, index) => [row.slot, index + 1]))
}

function RankCell({ gain, rank }: { gain: number | null; rank: number | undefined }) {
  if (rank === undefined || gain === null) {
    return (
      <td className={styles.rankCell}>
        <span className={`${styles.rank} ${styles.noRank}`}>—</span>
      </td>
    )
  }
  return (
    <td className={styles.rankCell} title={fmtGain(gain)}>
      <span className={styles.rank}>#{rank}</span>
    </td>
  )
}

export function GearAnalysisPanel({ engineInputs, currentDps }: Props) {
  const { t } = useI18n()
  const { rows, isPending } = useGearAnalysis(engineInputs, currentDps)

  if (rows.length === 0) {
    return (
      <div className="empty-tab">
        {isPending ? t("gear.analysis.computing") : t("gear.analysis.noAnalysisYet")}
      </div>
    )
  }

  const equippedRows = rows.filter((row) => row.pieceId !== null)
  if (equippedRows.length === 0) {
    return <div className="empty-tab">{t("gear.analysis.equipGearToSeeWhere")}</div>
  }

  const retuneRanks = ranksBySlot(equippedRows, "retuneGain")
  const reattuneRanks = ranksBySlot(equippedRows, "reattuneGain")
  const relayRanks = ranksBySlot(equippedRows, "relayGain")
  const sorted = [...equippedRows].sort((rowA, rowB) => rowB.unequipLoss - rowA.unequipLoss)
  const totalLoss = equippedRows.reduce((sum, row) => sum + row.unequipLoss, 0)

  return (
    <div className={styles.analysis} style={{ opacity: isPending ? 0.6 : 1 }}>
      <table className={`ranking-table ${styles.analysisTable}`}>
        <thead>
          <tr>
            <th>{t("gear.analysis.slot")}</th>
            <th className={styles.rankHead}>
              {t("gear.analysis.retune")}
              <HelpHint text={t(COLUMN_HINT_KEYS.retuneGain)} />
            </th>
            <th className={styles.rankHead}>
              {t("gear.analysis.reAttune")}
              <HelpHint text={t(COLUMN_HINT_KEYS.reattuneGain)} />
            </th>
            <th className={styles.rankHead}>
              {t("gear.analysis.relay")}
              <HelpHint text={t(COLUMN_HINT_KEYS.relayGain)} />
            </th>
            <th className={styles.lossHead}>
              {t("gear.analysis.tunedStats")}
              <HelpHint text={t(COLUMN_HINT_KEYS.unequipLoss)} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.slot}>
              <td>{t(GEAR_SLOT_KEYS[row.slot])}</td>
              <RankCell gain={row.retuneGain} rank={retuneRanks.get(row.slot)} />
              <RankCell gain={row.reattuneGain} rank={reattuneRanks.get(row.slot)} />
              <RankCell gain={row.relayGain} rank={relayRanks.get(row.slot)} />
              <td className={`${styles.loss} ${lossSignClass(row.unequipLoss)}`}>
                {fmtLoss(row.unequipLoss)}
                <span className={styles.share}>({fmtShare(row.unequipLoss, currentDps)})</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>{t("gear.analysis.totalTunedStatDpsContribution")}</td>
            <td className={`${styles.loss} ${lossSignClass(totalLoss)}`}>
              {fmtLoss(totalLoss)}
              <span className={styles.share}>({fmtShare(totalLoss, currentDps)})</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
