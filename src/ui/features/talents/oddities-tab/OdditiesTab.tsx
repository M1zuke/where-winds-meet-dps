import { useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Inputs } from "../../../../engine/types"
import type {
  OddityBoardRegion,
  OddityNodeDef,
  OddityStat,
} from "../../../../definitions/baseStats"
import {
  ODDITY_BOARD,
  claimedOddityCost,
  claimedOddityNodes,
  isOddityNodeClaimed,
  isOddityNodeReachable,
  oddityBoardTotals,
  oddityNodeById,
  withOddityNodeClaimed,
} from "../../../../definitions/baseStats"
import { useI18n } from "../../../../i18n/i18nContext"
import {
  oddityChapterKey,
  oddityNodeDescriptionKey,
  oddityNodeKey,
  oddityRegionKey,
} from "../../../../i18n/contentKeys"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { OddityNodeIcons } from "./oddity-node-icons/OddityNodeIcons"
import { oddityIconHref } from "./oddityIconHref"
import styles from "./OdditiesTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

const STAT_KEYS: Readonly<Record<OddityStat, string>> = {
  minPhys: "common.minPhys",
  maxPhys: "common.maxPhys",
  physDef: "content.statLine.physDef",
  maxHp: "content.statLine.maxHp",
}

const STAT_ORDER: readonly OddityStat[] = ["minPhys", "maxPhys", "physDef", "maxHp"]

type NodeState = "claimed" | "ready" | "locked"

const STATE_KEYS: Readonly<Record<NodeState, string>> = {
  claimed: "talents.oddities.claimed",
  ready: "talents.oddities.ready",
  locked: "talents.oddities.lockedByPredecessor",
}

const REGIONS_NEWEST_FIRST = [...ODDITY_BOARD].reverse()

const BOARD_HEIGHT = 340
const CHAPTER_BAND = 34
const EDGE_PAD = 32
const TOOLTIP_GAP = 10
const NODE_RADIUS: Readonly<Record<OddityNodeDef["kind"], number>> = {
  opener: 14,
  reward: 11,
  final: 18,
}
const ICON_SIZE: Readonly<Record<OddityNodeDef["kind"], number>> = {
  opener: 16,
  reward: 15,
  final: 20,
}

interface ChapterBand {
  chapter: number
  label: string
  center: number
  left: number
}

interface BoardLayout {
  width: number
  centerX: (node: OddityNodeDef) => number
  centerY: (node: OddityNodeDef) => number
  chapters: readonly ChapterBand[]
}

function layoutOf(region: OddityBoardRegion): BoardLayout {
  const xs = region.nodes.map((node) => node.x)
  const ys = region.nodes.map((node) => node.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const inner = BOARD_HEIGHT - CHAPTER_BAND - EDGE_PAD * 2
  const scale = inner / Math.max(1, maxY - minY)
  const centerX = (node: OddityNodeDef) => EDGE_PAD + (node.x - minX) * scale
  const centerY = (node: OddityNodeDef) => CHAPTER_BAND + EDGE_PAD + (maxY - node.y) * scale

  const byChapter = new Map<number, OddityNodeDef[]>()
  for (const node of region.nodes) {
    const members = byChapter.get(node.chapter)
    if (members) members.push(node)
    else byChapter.set(node.chapter, [node])
  }
  const chapters = [...byChapter.entries()]
    .sort(([left], [right]) => left - right)
    .map(([chapter, members]) => {
      const centers = members.map(centerX)
      return {
        chapter,
        label: region.chapters[chapter - 1] ?? `${chapter}`,
        center: (Math.min(...centers) + Math.max(...centers)) / 2,
        left: Math.min(...centers),
      }
    })

  return { width: (maxX - minX) * scale + EDGE_PAD * 2, centerX, centerY, chapters }
}

function pentagonPoints(radius: number): string {
  return Array.from({ length: 5 }, (_, corner) => {
    const angle = -Math.PI / 2 + (corner * 2 * Math.PI) / 5
    return `${radius * Math.cos(angle)},${radius * Math.sin(angle)}`
  }).join(" ")
}

function formatTotal(value: number): string {
  return value > 0 ? `+${value.toLocaleString("en-US")}` : "—"
}

export function OdditiesTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const unclaimed = inputs.unclaimedOddityNodes
  const [openRegion, setOpenRegion] = useState<string>(REGIONS_NEWEST_FIRST[0].key)
  const [hovered, setHovered] = useState<OddityNodeDef | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [frameWidth, setFrameWidth] = useState(0)
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 })
  const frameRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const draggedRef = useRef(false)

  const region =
    REGIONS_NEWEST_FIRST.find((entry) => entry.key === openRegion) ?? REGIONS_NEWEST_FIRST[0]
  const layout = useMemo(() => layoutOf(region), [region])
  const totals = oddityBoardTotals(unclaimed)

  useLayoutEffect(() => {
    const element = frameRef.current
    if (!element) return
    const measure = () => setFrameWidth(element.clientWidth)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [openRegion])

  useLayoutEffect(() => {
    const element = tooltipRef.current
    if (!element) return
    setTooltipSize({ width: element.offsetWidth, height: element.offsetHeight })
  }, [hovered])

  function stateOf(node: OddityNodeDef): NodeState {
    if (isOddityNodeClaimed(unclaimed, region.key, node.id)) return "claimed"
    return isOddityNodeReachable(unclaimed, region.key, node) ? "ready" : "locked"
  }

  function toggle(node: OddityNodeDef) {
    const claimed = isOddityNodeClaimed(unclaimed, region.key, node.id)
    onChange({
      ...inputs,
      unclaimedOddityNodes: withOddityNodeClaimed(unclaimed, region.key, node.id, !claimed),
    })
  }

  async function resetAll() {
    if (!(await confirm(t("talents.oddities.resetAllOdditiesToDefault")))) return
    onChange({ ...inputs, unclaimedOddityNodes: {} })
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

  const spent = claimedOddityCost(unclaimed, region.key)
  const nothingUnclaimed = Object.keys(unclaimed).length === 0

  const visibleWidth = frameWidth || layout.width
  const tooltipLeft = hovered
    ? Math.max(
        TOOLTIP_GAP,
        Math.min(
          layout.centerX(hovered) - scrollLeft + NODE_RADIUS[hovered.kind] + TOOLTIP_GAP,
          Math.max(TOOLTIP_GAP, visibleWidth - tooltipSize.width - TOOLTIP_GAP),
        ),
      )
    : 0
  const tooltipTop = hovered
    ? Math.max(
        TOOLTIP_GAP,
        Math.min(
          layout.centerY(hovered) + NODE_RADIUS[hovered.kind] + TOOLTIP_GAP,
          Math.max(TOOLTIP_GAP, BOARD_HEIGHT - tooltipSize.height - TOOLTIP_GAP),
        ),
      )
    : 0
  const gate = hovered?.requires === undefined ? null : oddityNodeById(region.key, hovered.requires)

  return (
    <div className={styles.tab}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.eyebrow}>{t("talents.oddities.oddityCollection")}</p>
          <h2 className={styles.title}>{t("talents.oddities.melodiesOfPeace")}</h2>
        </div>
        <div className={styles.budget}>
          <div className={styles.budgetFigure}>
            <b>{spent}</b>
            <span>
              {" / "}
              {region.cost} {t("talents.oddities.oddities")}
            </span>
          </div>
          <div className={styles.budgetLabel}>
            {t("talents.oddities.submittedIn")} {t(oddityRegionKey(region.key), region.key)}
          </div>
          <div className={styles.budgetBar}>
            <i style={{ width: `${region.cost ? (spent / region.cost) * 100 : 0}%` }} />
          </div>
        </div>
        <button type="button" className="btn danger" onClick={resetAll} disabled={nothingUnclaimed}>
          {t("common.resetToDefault")}
        </button>
      </header>

      <section>
        <h3 className={styles.blockTitle}>{t("talents.oddities.whatTheBoardGrants")}</h3>
        <p className={styles.sub}>{t("talents.oddities.grantsHint")}</p>
        <dl className={styles.totals}>
          {STAT_ORDER.map((stat) => (
            <div className={styles.total} key={stat}>
              <dt>{t(STAT_KEYS[stat])}</dt>
              <dd className={totals[stat] ? undefined : styles.zero}>
                {formatTotal(totals[stat] ?? 0)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.legend}>
        <span>
          <i className={styles.swatchClaimed} /> {t("talents.oddities.claimed")}
        </span>
        <span>
          <i className={styles.swatchReady} /> {t("talents.oddities.ready")}
        </span>
        <span>
          <i className={styles.swatchLocked} /> {t("talents.oddities.lockedByPredecessor")}
        </span>
        <span>
          <i className={styles.swatchOpener} /> {t("talents.oddities.chapterOpener")}
        </span>
        <span>
          <i className={styles.swatchFinal} /> {t("talents.oddities.finalMelody")}
        </span>
      </div>
      <p className={styles.sub}>{t("talents.oddities.boardHint")}</p>

      <div className={styles.regions}>
        {REGIONS_NEWEST_FIRST.map((entry, index) => {
          const open = entry.key === region.key
          const claimedCount = claimedOddityNodes(unclaimed, entry.key).length
          const regionSpent = claimedOddityCost(unclaimed, entry.key)
          return (
            <section className={styles.region} key={entry.key} data-open={open}>
              <button
                type="button"
                className={styles.regionHead}
                aria-expanded={open}
                onClick={() => setOpenRegion(entry.key)}
              >
                <span className={styles.caret} aria-hidden="true">
                  {open ? "▾" : "▸"}
                </span>
                <span className={styles.regionName}>
                  {t(oddityRegionKey(entry.key), entry.key)}
                </span>
                {index === 0 && (
                  <span className={styles.newest}>{t("talents.oddities.newest")}</span>
                )}
                <span
                  className={styles.regionMeta}
                  data-complete={claimedCount === entry.nodes.length}
                >
                  {claimedCount}/{entry.nodes.length} {t("talents.oddities.melodies")} ·{" "}
                  {regionSpent}/{entry.cost} {t("talents.oddities.oddities")}
                </span>
              </button>

              {open && (
                <div className={styles.regionBody}>
                  <div
                    className={styles.boardFrame}
                    ref={frameRef}
                    style={{ height: `${BOARD_HEIGHT}px` }}
                    onPointerDown={onPointerDown}
                    onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}
                  >
                    <svg
                      className={styles.board}
                      width={layout.width}
                      height={BOARD_HEIGHT}
                      viewBox={`0 0 ${layout.width} ${BOARD_HEIGHT}`}
                      role="group"
                      aria-label={t(oddityRegionKey(entry.key), entry.key)}
                    >
                      <OddityNodeIcons />
                      <g>
                        {layout.chapters.map((chapter, chapterIndex) => (
                          <g key={chapter.chapter}>
                            {chapterIndex > 0 && (
                              <line
                                className={styles.chapterLine}
                                x1={chapter.left - 18}
                                y1={CHAPTER_BAND - 14}
                                x2={chapter.left - 18}
                                y2={BOARD_HEIGHT - 8}
                              />
                            )}
                            <text
                              className={styles.chapterLabel}
                              x={chapter.center}
                              y={21}
                              textAnchor="middle"
                            >
                              {t(oddityChapterKey(chapter.label), chapter.label)}
                            </text>
                          </g>
                        ))}
                      </g>
                      <g>
                        {entry.nodes
                          .filter((node) => node.requires !== undefined)
                          .map((node) => {
                            const parent = oddityNodeById(entry.key, node.requires!)
                            if (!parent) return null
                            const lit = isOddityNodeClaimed(unclaimed, entry.key, node.id)
                            return (
                              <line
                                key={`edge-${node.id}`}
                                className={lit ? styles.edgeLit : styles.edge}
                                x1={layout.centerX(parent)}
                                y1={layout.centerY(parent)}
                                x2={layout.centerX(node)}
                                y2={layout.centerY(node)}
                              />
                            )
                          })}
                      </g>
                      <g>
                        {entry.nodes.map((node) => {
                          const radius = NODE_RADIUS[node.kind]
                          return (
                            <g
                              key={node.id}
                              className={styles.node}
                              data-state={stateOf(node)}
                              data-kind={node.kind}
                              transform={`translate(${layout.centerX(node)},${layout.centerY(node)})`}
                              role="button"
                              tabIndex={0}
                              aria-label={t(oddityNodeKey(node), node.name)}
                              aria-pressed={isOddityNodeClaimed(unclaimed, entry.key, node.id)}
                              onClick={() => {
                                if (!draggedRef.current) toggle(node)
                              }}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return
                                event.preventDefault()
                                toggle(node)
                              }}
                              onMouseEnter={() => setHovered(node)}
                              onFocus={() => setHovered(node)}
                              onMouseLeave={() => setHovered(null)}
                              onBlur={() => setHovered(null)}
                            >
                              {node.kind === "opener" && (
                                <rect
                                  className={styles.shape}
                                  x={-radius}
                                  y={-radius}
                                  width={radius * 2}
                                  height={radius * 2}
                                  rx={2}
                                  transform="rotate(45)"
                                />
                              )}
                              {node.kind === "reward" && (
                                <circle className={styles.shape} r={radius} />
                              )}
                              {node.kind === "final" && (
                                <polygon className={styles.shape} points={pentagonPoints(radius)} />
                              )}
                              <use
                                className={styles.glyph}
                                href={oddityIconHref(node.icon)}
                                x={-ICON_SIZE[node.kind] / 2}
                                y={-ICON_SIZE[node.kind] / 2}
                                width={ICON_SIZE[node.kind]}
                                height={ICON_SIZE[node.kind]}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </g>
                          )
                        })}
                      </g>
                    </svg>
                  </div>

                  {hovered && (
                    <div
                      className={styles.tooltip}
                      ref={tooltipRef}
                      style={{ left: `${tooltipLeft}px`, top: `${tooltipTop}px` }}
                    >
                      <div className={styles.tooltipTitle}>
                        {t(oddityNodeKey(hovered), hovered.name)}
                      </div>
                      <div className={styles.tooltipMeta}>
                        {t(
                          oddityChapterKey(entry.chapters[hovered.chapter - 1]),
                          entry.chapters[hovered.chapter - 1],
                        )}{" "}
                        · {t("talents.oddities.node")} {hovered.id}
                      </div>
                      <div className={styles.tooltipCost}>
                        {hovered.cost} {t("talents.oddities.oddities")}
                      </div>
                      <div className={styles.tooltipEffect}>
                        {t(oddityNodeDescriptionKey(hovered), hovered.description)}
                      </div>
                      <div className={styles.tooltipState}>
                        {t(STATE_KEYS[stateOf(hovered)])}
                        {hovered.stat ? "" : ` — ${t("talents.oddities.noEngineEffect")}`}
                      </div>
                      <div className={styles.tooltipGate}>
                        {gate
                          ? `${
                              isOddityNodeClaimed(unclaimed, entry.key, gate.id)
                                ? t("talents.oddities.openedBy")
                                : t("talents.oddities.lockedUntil")
                            } ${t(oddityNodeKey(gate), gate.name)}`
                          : t("talents.oddities.firstMelody")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
