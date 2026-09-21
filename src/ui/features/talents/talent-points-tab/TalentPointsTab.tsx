import { useEffect, useMemo, useRef, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import type {
  TalentBoardCell,
  TalentGateKind,
  TalentPointStat,
} from "../../../../definitions/baseStats"
import {
  TALENT_BOARD_CELLS,
  TALENT_BOARD_GATES,
  TALENT_POINT_BUDGET,
  effectiveDisabledTalentNodes,
  isTalentNodeTaken,
  takenRanks,
  takenTalentPoints,
  talentBoardTotals,
  talentNodesAboveBreakthrough,
  talentPointStats,
  withTalentCellRanks,
} from "../../../../definitions/baseStats"
import { useI18n } from "../../../../i18n/i18nContext"
import { talentNodeDescriptionKey, talentNodeKey } from "../../../../i18n/contentKeys"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { TalentNodeIcons } from "./talent-node-icons/TalentNodeIcons"
import { talentIconHref } from "./talentIconHref"
import styles from "./TalentPointsTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

const STAT_KEYS: Readonly<Record<TalentPointStat, string>> = {
  minPhys: "common.minPhys",
  maxPhys: "common.maxPhys",
  minFormless: "content.statLine.minFormless",
  maxFormless: "content.statLine.maxFormless",
  precisionRate: "content.statLine.precision",
  critRate: "talents.stat.critRate",
  critDamage: "talents.stat.critDamage",
  affinityRate: "content.statLine.affinity",
  affinityDamage: "talents.stat.affinityDamage",
  power: "content.statLine.power",
  agility: "content.statLine.agility",
  momentum: "content.statLine.momentum",
  body: "content.statLine.body",
  defense: "content.statLine.defense",
  maxHp: "content.statLine.maxHp",
  physDef: "content.statLine.physDef",
}

const GATE_KEYS: Readonly<Record<TalentGateKind, string>> = {
  martialMastery: "talents.talentPoints.needsMartialMastery",
  maxHp: "talents.talentPoints.needsMaxHp",
  worldLevel: "talents.talentPoints.needsSoloModeLevel",
  characterLevel: "talents.talentPoints.needsCharacterLevel",
}

type CellState = "full" | "partial" | "ready" | "locked" | "gated"

const STATE_KEYS: Readonly<Record<CellState, string>> = {
  full: "talents.talentPoints.invested",
  partial: "talents.talentPoints.invested",
  ready: "talents.talentPoints.available",
  locked: "talents.talentPoints.locked",
  gated: "talents.talentPoints.beyondBreakthrough",
}

const RATE_STATS = new Set<TalentPointStat>([
  "precisionRate",
  "critRate",
  "critDamage",
  "affinityRate",
  "affinityDamage",
])

const NODE_SIZE = 38
const HALF = NODE_SIZE / 2
const ICON_SIZE = 22
const LANE_GAP = 82
const COLUMN_WIDTH = 84
const SIDE_PAD = 58
const FALLBACK_HEIGHT = 380
const TOOLTIP_WIDTH = 240
const COLUMNS = Math.max(...TALENT_BOARD_CELLS.map((cell) => cell.column))
const BOARD_WIDTH = SIDE_PAD * 2 + (COLUMNS - 1) * COLUMN_WIDTH

function formatValue(stat: TalentPointStat, value: number): string {
  if (RATE_STATS.has(stat)) return `+${Math.round(value * 1000) / 10}%`
  return `+${Math.round(value * 10) / 10}`
}

export function TalentPointsTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const disabled = inputs.disabledTalentNodes
  const frameRef = useRef<HTMLDivElement | null>(null)
  const draggedRef = useRef(false)
  const [hovered, setHovered] = useState<TalentBoardCell | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [frame, setFrame] = useState({ width: 0, height: FALLBACK_HEIGHT })

  const cellByKey = useMemo(() => new Map(TALENT_BOARD_CELLS.map((cell) => [cell.key, cell])), [])
  const beyondBreakthrough = useMemo(
    () => new Set(talentNodesAboveBreakthrough(inputs.breakthrough)),
    [inputs.breakthrough],
  )
  const effective = useMemo(
    () => effectiveDisabledTalentNodes(disabled, inputs.breakthrough),
    [disabled, inputs.breakthrough],
  )
  const spent = takenTalentPoints(effective)
  const totals = talentBoardTotals(effective)

  const centerX = (cell: TalentBoardCell): number => SIDE_PAD + (cell.column - 1) * COLUMN_WIDTH
  const centerY = (cell: TalentBoardCell): number => frame.height / 2 + (cell.lane - 2) * LANE_GAP

  useEffect(() => {
    const element = frameRef.current
    if (!element) return
    const measure = () =>
      setFrame({
        width: element.clientWidth,
        height: element.clientHeight || FALLBACK_HEIGHT,
      })
    measure()
    element.scrollLeft = element.scrollWidth
    setScrollLeft(element.scrollLeft)
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function parentTaken(cell: TalentBoardCell): boolean {
    const requires = cell.ranks[0].requires
    return requires === undefined || isTalentNodeTaken(effective, requires)
  }

  function stateOf(cell: TalentBoardCell): CellState {
    if (beyondBreakthrough.has(cell.ranks[0].id)) return "gated"
    const ranks = takenRanks(cell, effective)
    if (ranks === cell.ranks.length) return "full"
    if (ranks > 0) return "partial"
    return parentTaken(cell) ? "ready" : "locked"
  }

  function toggle(cell: TalentBoardCell) {
    if (beyondBreakthrough.has(cell.ranks[0].id)) return
    const ranks = takenRanks(cell, effective)
    if (ranks < cell.ranks.length && !parentTaken(cell)) return
    const next = ranks === cell.ranks.length ? 0 : ranks + 1
    onChange({ ...inputs, disabledTalentNodes: withTalentCellRanks(disabled, cell, next) })
  }

  async function resetAll() {
    if (!(await confirm(t("talents.talentPoints.resetAllTalentPointsToDefault")))) return
    onChange({ ...inputs, disabledTalentNodes: [] })
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const element = frameRef.current
    if (!element) return
    const start = { x: event.clientX, scroll: element.scrollLeft }
    draggedRef.current = false

    function onMove(moveEvent: PointerEvent) {
      if (Math.abs(moveEvent.clientX - start.x) > 3) draggedRef.current = true
      element!.scrollLeft = start.scroll - (moveEvent.clientX - start.x)
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const hoveredRanks = hovered ? takenRanks(hovered, effective) : 0
  const hoveredNode = hovered
    ? hovered.ranks[Math.min(hoveredRanks, hovered.ranks.length - 1)]
    : null
  const tooltipLeft = hovered
    ? Math.max(
        8,
        Math.min(
          centerX(hovered) - scrollLeft + HALF + 8,
          (frame.width || BOARD_WIDTH) - TOOLTIP_WIDTH - 8,
        ),
      )
    : 0
  const tooltipAnchor = hovered
    ? hovered.lane === 3
      ? { bottom: `${frame.height - centerY(hovered) + HALF + 6}px` }
      : { top: `${centerY(hovered) + HALF + 6}px` }
    : {}

  return (
    <div className={styles.tab}>
      <div className="toolbar">
        <span className="toolbar-label">{t("talents.talentPoints.talentPoints")}</span>
        <span className={styles.budget}>
          <b>{spent}</b> / {TALENT_POINT_BUDGET} {t("talents.talentPoints.pointsSpent")}
        </span>
        <button
          type="button"
          className="btn danger"
          onClick={resetAll}
          disabled={disabled.length === 0}
        >
          {t("common.resetToDefault")}
        </button>
      </div>

      <dl className={styles.totals}>
        {talentPointStats(totals).map((stat) => (
          <div className={styles.total} key={stat}>
            <dt>{t(STAT_KEYS[stat])}</dt>
            <dd>{formatValue(stat, totals[stat] ?? 0)}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.hint}>{t("talents.talentPoints.boardHint")}</p>

      <div className={styles.boardShell}>
        <div
          className={styles.boardFrame}
          ref={frameRef}
          onPointerDown={onPointerDown}
          onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
        >
          <svg
            className={styles.board}
            width={BOARD_WIDTH}
            height={frame.height}
            viewBox={`0 0 ${BOARD_WIDTH} ${frame.height}`}
            role="group"
            aria-label={t("talents.talentPoints.talentPoints")}
          >
            <TalentNodeIcons />
            <g>
              {TALENT_BOARD_GATES.map((gate) => {
                const x = SIDE_PAD + (gate.column - 1) * COLUMN_WIDTH - COLUMN_WIDTH / 2
                return (
                  <g key={`gate-${gate.level}`}>
                    <line
                      className={styles.gateLine}
                      x1={x}
                      y1={10}
                      x2={x}
                      y2={frame.height - 10}
                    />
                    <text className={styles.gateLabel} x={x + 5} y={22}>
                      {t("talents.talentPoints.soloModeLevel")} {gate.level}
                    </text>
                  </g>
                )
              })}
            </g>
            <g>
              {TALENT_BOARD_CELLS.filter((cell) => cell.requires).map((cell) => {
                const parent = cellByKey.get(cell.requires!)!
                const lit = takenRanks(cell, effective) > 0
                return (
                  <line
                    key={`edge-${cell.key}`}
                    className={lit ? styles.edgeLit : styles.edge}
                    x1={centerX(parent)}
                    y1={centerY(parent)}
                    x2={centerX(cell)}
                    y2={centerY(cell)}
                  />
                )
              })}
            </g>
            <g>
              {TALENT_BOARD_CELLS.map((cell) => {
                const node = cell.ranks[0]
                const ranks = takenRanks(cell, effective)
                const label = t(talentNodeKey(node), node.name)
                const pipGap = 9
                return (
                  <g
                    key={cell.key}
                    className={styles.node}
                    data-state={stateOf(cell)}
                    transform={`translate(${centerX(cell)},${centerY(cell)})`}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      cell.ranks.length > 1 ? `${label} ${ranks} / ${cell.ranks.length}` : label
                    }
                    aria-pressed={ranks > 0}
                    onClick={() => {
                      if (!draggedRef.current) toggle(cell)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return
                      event.preventDefault()
                      toggle(cell)
                    }}
                    onMouseEnter={() => setHovered(cell)}
                    onFocus={() => setHovered(cell)}
                    onMouseLeave={() => setHovered(null)}
                    onBlur={() => setHovered(null)}
                  >
                    {node.effects ? (
                      <rect
                        className={styles.shape}
                        x={-HALF}
                        y={-HALF}
                        width={NODE_SIZE}
                        height={NODE_SIZE}
                        rx={3}
                        transform="rotate(45)"
                      />
                    ) : (
                      <circle className={styles.shape} r={HALF * 0.92} />
                    )}
                    <use
                      className={styles.glyph}
                      href={talentIconHref(node.icon)}
                      x={-ICON_SIZE / 2}
                      y={-ICON_SIZE / 2}
                      width={ICON_SIZE}
                      height={ICON_SIZE}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {cell.ranks.length > 1 &&
                      cell.ranks.map((rank, index) => (
                        <rect
                          key={rank.id}
                          className={index < ranks ? styles.pipOn : styles.pip}
                          x={((cell.ranks.length - 1) * -pipGap) / 2 + index * pipGap - 2.5}
                          y={HALF + 7}
                          width={5}
                          height={5}
                          rx={1}
                        />
                      ))}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {hovered && hoveredNode && (
          <div className={styles.tooltip} style={{ left: `${tooltipLeft}px`, ...tooltipAnchor }}>
            <div className={styles.tooltipTitle}>
              {t(talentNodeKey(hoveredNode), hoveredNode.name)}
            </div>
            <div className={styles.tooltipState}>
              {hovered.ranks.length > 1 && stateOf(hovered) !== "gated"
                ? `${t("common.rank")} ${hoveredRanks} / ${hovered.ranks.length}`
                : t(STATE_KEYS[stateOf(hovered)])}
            </div>
            {hoveredNode.effects && (
              <div className={styles.tooltipEffect}>
                {talentPointStats(hoveredNode.effects)
                  .map(
                    (stat) =>
                      `${formatValue(stat, hoveredNode.effects![stat] ?? 0)} ${t(STAT_KEYS[stat])}`,
                  )
                  .join(" · ")}
                {hovered.ranks.length > 1 ? ` ${t("talents.talentPoints.perRank")}` : ""}
              </div>
            )}
            <div className={styles.tooltipDescription}>
              {t(talentNodeDescriptionKey(hoveredNode), hoveredNode.description)}
            </div>
            {hoveredNode.gate && (
              <div className={styles.tooltipGate}>
                {t(GATE_KEYS[hoveredNode.gate.kind])}{" "}
                {hoveredNode.gate.value.toLocaleString("en-US")}
              </div>
            )}
            {!hoveredNode.effects && (
              <span className={styles.tooltipTag}>{t("talents.talentPoints.noStatEffect")}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
