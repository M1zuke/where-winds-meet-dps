import { useEffect, useMemo, useRef, useState } from "react"
import { parseRunSeed, type ParseRun } from "../../../../engine/dpsWorker"
import type { Rotation } from "../../../../engine/rotation"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { useParseRunDetail } from "../../../hooks/useParseRunDetail"
import { decimalNumber, fixed, fullNumber, signedPercent } from "../damageFormat"
import { MEDIAN_RANK, parseAtRank } from "../simulation-parse-ladder-panel/parseLadder"
import { SimulationRunDetailPanel } from "../simulation-run-detail-panel/SimulationRunDetailPanel"
import {
  rememberRunsPage,
  rememberRunsSort,
  rememberSelectedRun,
  simulationViewState,
} from "../simulationViewState"
import {
  clampPage,
  pageCount,
  pageNumbers,
  pageOfRow,
  pageRows,
  rankedRuns,
  sortRankedRuns,
  firstRowOnPage,
  lastRowOnPage,
  topPercentOf,
  type RankedRun,
  type RunSortColumn,
} from "./runsPaging"
import styles from "./SimulationRunsPanel.module.scss"

function signClassOf(delta: number): string {
  if (delta > 0.00005) return "is-positive"
  if (delta < -0.00005) return "is-negative"
  return "is-zero"
}

function axisSpanOf(rows: readonly RankedRun[], medianDps: number): number {
  let span = 0
  for (const row of rows) span = Math.max(span, Math.abs(row.run.dps / medianDps - 1))
  return span || 1
}

export function SimulationRunsPanel({
  sorted,
  seed,
  inputs,
  rotation,
  meanDps,
  rotationDuration,
  isStale,
}: {
  sorted: readonly ParseRun[]
  seed: number
  inputs: Inputs
  rotation: Rotation | null
  meanDps: number
  rotationDuration: number
  isStale: boolean
}) {
  const { t } = useI18n()
  const { detail, request } = useParseRunDetail()
  const [sortColumn, setSortColumn] = useState<RunSortColumn>(() => simulationViewState.sortColumn)
  const [sortDescending, setSortDescending] = useState(() => simulationViewState.sortDescending)
  const [page, setPage] = useState(() => simulationViewState.page)
  const [selectedRunIndex, setSelectedRunIndex] = useState(
    () => simulationViewState.selectedRunIndex,
  )
  const rowRefs = useRef(new Map<number, HTMLTableRowElement>())
  const focusAfterKeyboard = useRef<number | null>(null)

  const ranked = useMemo(() => rankedRuns(sorted), [sorted])
  const rows = useMemo(
    () => sortRankedRuns(ranked, sortColumn, sortDescending),
    [ranked, sortColumn, sortDescending],
  )

  const medianDps = parseAtRank(sorted, MEDIAN_RANK)?.dps ?? 0
  const axisSpan = axisSpanOf(ranked, medianDps)
  const currentPage = clampPage(page, rows.length)
  const visible = pageRows(rows, currentPage)
  const totalPages = pageCount(rows.length)

  const selected = isStale ? null : selectedRunIndex
  const selectedRow =
    selected === null ? null : (rows.find((row) => row.run.index === selected) ?? null)
  const selectedSeed = selectedRow ? parseRunSeed(seed, selectedRow.run.index) : null
  const matchingDetail = detail && detail.seed === selectedSeed ? detail : null

  useEffect(() => {
    if (selectedSeed === null) return
    request({ inputs, rotation, seed: selectedSeed })
  }, [selectedSeed, inputs, rotation, request])

  useEffect(() => {
    const index = focusAfterKeyboard.current
    if (index === null) return
    focusAfterKeyboard.current = null
    rowRefs.current.get(index)?.focus()
  })

  function goToPage(nextPage: number) {
    const clamped = clampPage(nextPage, rows.length)
    rememberRunsPage(clamped)
    setPage(clamped)
  }

  function select(runIndex: number | null) {
    rememberSelectedRun(runIndex)
    setSelectedRunIndex(runIndex)
  }

  function selectAndReveal(runIndex: number, withFocus: boolean) {
    const position = rows.findIndex((row) => row.run.index === runIndex)
    if (position < 0) return
    select(runIndex)
    goToPage(pageOfRow(position))
    if (withFocus) focusAfterKeyboard.current = runIndex
  }

  function sortBy(column: RunSortColumn) {
    const descending = column === sortColumn ? !sortDescending : true
    rememberRunsSort(column, descending)
    setSortColumn(column)
    setSortDescending(descending)
    goToPage(1)
  }

  function moveSelection(from: number, step: number) {
    const position = rows.findIndex((row) => row.run.index === from)
    const next = rows[position + step]
    if (!next) return
    selectAndReveal(next.run.index, true)
  }

  function onRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, runIndex: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      select(runIndex)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      moveSelection(runIndex, 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveSelection(runIndex, -1)
    } else if (event.key === "Escape") {
      select(null)
    }
  }

  const sortableHeader = (column: RunSortColumn, label: string) => (
    <th
      className={`${styles.sortable} ${styles.numeric}`}
      aria-sort={column === sortColumn ? (sortDescending ? "descending" : "ascending") : "none"}
    >
      <button type="button" className={styles.sortButton} onClick={() => sortBy(column)}>
        {label}
        <span className={styles.caret} aria-hidden="true">
          {column === sortColumn ? (sortDescending ? "▼" : "▲") : ""}
        </span>
      </button>
    </th>
  )

  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const median = parseAtRank(sorted, MEDIAN_RANK)

  return (
    <>
      <div className="panel-head">
        <h2>{t("simulation.runs.title")}</h2>
        <span className={styles.jump}>
          <span className={styles.jumpLabel}>{t("simulation.runs.jumpTo")}</span>
          <button
            type="button"
            className="btn"
            onClick={() => best && selectAndReveal(best.run.index, false)}
          >
            {t("simulation.runs.best")}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => median && selectAndReveal(median.index, false)}
          >
            {t("simulation.runs.median")}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => worst && selectAndReveal(worst.run.index, false)}
          >
            {t("simulation.runs.worst")}
          </button>
          {selectedRow && (
            <button
              type="button"
              className="btn is-on"
              onClick={() => selectAndReveal(selectedRow.run.index, false)}
            >
              {t("simulation.runs.selected")}
            </button>
          )}
        </span>
        <span className="panel-head-meta">
          <span className="panel-head-meta-value">
            {t("simulation.runs.page")} {fullNumber(currentPage)} {t("common.of")}{" "}
            {fullNumber(totalPages)}
          </span>
        </span>
      </div>

      <div className={styles.body + (selectedRow ? ` ${styles.withDetail}` : "")}>
        <div className={styles.listColumn}>
          {selectedRow === null && <p className="hint">{t("simulation.runs.selectARunHint")}</p>}
          <div className={styles.tableScroller}>
            <table className={`ranking-table ${styles.runs}`}>
              <thead>
                <tr>
                  <th className={styles.rankCell}>{t("simulation.runs.rank")}</th>
                  {sortableHeader("run", t("simulation.runs.runNumber"))}
                  {sortableHeader("dps", t("common.dps"))}
                  {sortableHeader("damage", t("common.damage"))}
                  <th className={`${styles.abrasionCell} ${styles.numeric}`}>
                    {t("common.abrasion")}
                  </th>
                  <th className={`${styles.normalCell} ${styles.numeric}`}>{t("common.normal")}</th>
                  <th className={`${styles.criticalCell} ${styles.numeric}`}>
                    {t("simulation.outcomeMix.category.critical")}
                  </th>
                  <th className={`${styles.affinityCell} ${styles.numeric}`}>
                    {t("common.affinity")}
                  </th>
                  <th className={`bar-col ${styles.barCell}`}>
                    {t("simulation.runs.vsMedian")} (±{fixed(axisSpan * 100, 1)} %)
                  </th>
                  <th className={styles.deltaCell} />
                </tr>
              </thead>
              <tbody>
                {visible.map(({ run, rank }) => {
                  const delta = medianDps > 0 ? run.dps / medianDps - 1 : 0
                  const sign = signClassOf(delta)
                  const halfWidth = Math.min(50, (Math.abs(delta) / axisSpan) * 50)
                  const isSelected = selectedRow?.run.index === run.index
                  return (
                    <tr
                      key={run.index}
                      ref={(element) => {
                        if (element) rowRefs.current.set(run.index, element)
                        else rowRefs.current.delete(run.index)
                      }}
                      className={styles.runRow + (isSelected ? ` ${styles.selected}` : "")}
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => select(isSelected ? null : run.index)}
                      onKeyDown={(event) => onRowKeyDown(event, run.index)}
                    >
                      <th scope="row" className={styles.rankCell}>
                        {fullNumber(rank)}
                      </th>
                      <td className={`${styles.runCell} ${styles.numeric}`}>
                        #{fullNumber(run.index + 1)}
                      </td>
                      <td className={`${styles.dpsCell} ${styles.numeric}`}>
                        {decimalNumber(run.dps, 2)}
                      </td>
                      <td className={`${styles.damageCell} ${styles.numeric}`}>
                        {fullNumber(run.totalDamage)}
                      </td>
                      <td className={`${styles.abrasionCell} ${styles.numeric}`}>
                        {fullNumber(run.abrasionHits)}
                      </td>
                      <td className={`${styles.normalCell} ${styles.numeric}`}>
                        {fullNumber(run.normalHits)}
                      </td>
                      <td className={`${styles.criticalCell} ${styles.numeric}`}>
                        {fullNumber(run.criticalHits)}
                      </td>
                      <td className={`${styles.affinityCell} ${styles.numeric}`}>
                        {fullNumber(run.affinityHits)}
                      </td>
                      <td className={`bar-col ${styles.barCell}`}>
                        <div className="skill-bar-track">
                          <div
                            className={`${styles.divergingFill} ${sign}`}
                            style={
                              delta >= 0
                                ? { left: "50%", width: halfWidth + "%" }
                                : { right: "50%", width: halfWidth + "%" }
                            }
                          />
                          <div className={styles.centreTick} />
                        </div>
                      </td>
                      <td className={`${styles.deltaCell} ${styles.numeric} ${sign}`}>
                        {signedPercent(delta)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <span className={styles.rowCount}>
              {t("simulation.runs.rows")} {fullNumber(firstRowOnPage(currentPage, rows.length))}–
              {fullNumber(lastRowOnPage(currentPage, rows.length))} {t("common.of")}{" "}
              {fullNumber(rows.length)}
            </span>
            <button
              type="button"
              className="btn icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label={t("simulation.runs.previousPage")}
            >
              ‹
            </button>
            <span className={styles.pageOfCount}>
              {t("simulation.runs.page")} {fullNumber(currentPage)} / {fullNumber(totalPages)}
            </span>
            <span className={styles.pageButtons}>
              {pageNumbers(currentPage, totalPages).map((slot, position) =>
                slot === "gap" ? (
                  <span key={`gap${position}`} className={styles.gap}>
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    key={slot}
                    className={"btn icon" + (slot === currentPage ? " is-on" : "")}
                    onClick={() => goToPage(slot)}
                  >
                    {fullNumber(slot)}
                  </button>
                ),
              )}
            </span>
            <button
              type="button"
              className="btn icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label={t("simulation.runs.nextPage")}
            >
              ›
            </button>
          </div>
        </div>

        {selectedRow && (
          <div className={styles.detailColumn}>
            <SimulationRunDetailPanel
              run={selectedRow.run}
              rank={selectedRow.rank}
              runCount={rows.length}
              topPercent={topPercentOf(selectedRow.rank, rows.length)}
              medianDps={medianDps}
              meanDps={meanDps}
              rotationDuration={rotationDuration}
              detail={matchingDetail}
              onClose={() => select(null)}
            />
          </div>
        )}
      </div>
    </>
  )
}
