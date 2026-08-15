import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Inputs, OddityNode, OddityRegions, TalentStat } from "../../../../engine/types"
import { DEFAULT_ODDITIES } from "../../../../definitions/baseStats"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { Select } from "../../../components/select/Select"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import styles from "./OdditiesTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

const STAT_OPTIONS: readonly TalentStat[] = [
  "minPhys",
  "maxPhys",
  "physPenetration",
  "minBellstrike",
  "maxBellstrike",
  "bellstrikePenetration",
  "minStonesplit",
  "maxStonesplit",
  "stonesplitPenetration",
  "minSilkbind",
  "maxSilkbind",
  "silkbindPenetration",
  "minBamboocut",
  "maxBamboocut",
  "bamboocutPenetration",
  "precisionRate",
  "critRate",
  "affinityRate",
  "critDamage",
  "affinityDamage",
  "attributeDamage",
]

const RATE_STATS = new Set<TalentStat>([
  "affinityRate",
  "critRate",
  "precisionRate",
  "critDamage",
  "affinityDamage",
  "attributeDamage",
  "physPenetration",
  "bellstrikePenetration",
  "stonesplitPenetration",
  "silkbindPenetration",
  "bamboocutPenetration",
])

const PENETRATION_STATS = new Set<TalentStat>([
  "physPenetration",
  "bellstrikePenetration",
  "stonesplitPenetration",
  "silkbindPenetration",
  "bamboocutPenetration",
])

const STAT_GLYPH: Readonly<Record<TalentStat, string>> = {
  minPhys: "⚔",
  maxPhys: "⚔",
  physPenetration: "➤",
  minBellstrike: "⚔",
  maxBellstrike: "⚔",
  bellstrikePenetration: "➤",
  minStonesplit: "⚔",
  maxStonesplit: "⚔",
  stonesplitPenetration: "➤",
  minSilkbind: "⚔",
  maxSilkbind: "⚔",
  silkbindPenetration: "➤",
  minBamboocut: "⚔",
  maxBamboocut: "⚔",
  bamboocutPenetration: "➤",
  precisionRate: "◎",
  critRate: "✦",
  affinityRate: "❈",
  critDamage: "✦",
  affinityDamage: "❈",
  attributeDamage: "✧",
}

function glyphFor(node: OddityNode): string {
  return node.icon ?? STAT_GLYPH[node.stat] ?? "◆"
}

function nodeSummary(node: OddityNode, t: (text: string) => string): string {
  const isRate = RATE_STATS.has(node.stat)
  const isPen = PENETRATION_STATS.has(node.stat)
  const sign = node.value >= 0 ? "+" : ""
  const num = isPen
    ? `${Math.round(node.value * 1000) / 10}`
    : isRate
      ? `${(node.value * 100).toFixed(2)}%`
      : `${node.value}`
  return `${sign}${num} ${t(`stat.${node.stat}`)}`
}

function regionLabel(region: string): string {
  return region
}

function deepCloneRegions(regions: OddityRegions): OddityRegions {
  return JSON.parse(JSON.stringify(regions)) as OddityRegions
}

function isDefaultNode(region: string, id: number): boolean {
  return (DEFAULT_ODDITIES[region] ?? []).some((node) => node.id === id)
}

const NODE = 40
const HALF = NODE / 2
const SPACING = 88
const LEFT_PAD = 60
const ROW_H = 96
const TITLE_Y = 20
const NODE_CY = 58
const TOP_PAD = 8

type NodeRef = { region: string; id: number } | null

function clampPanValue(pan: number, width: number, contentWidth: number): number {
  const min = Math.min(0, width - contentWidth - LEFT_PAD)
  return Math.min(0, Math.max(min, pan))
}

export function OdditiesTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const oddities = inputs.oddities
  const regionKeys = useMemo(() => Object.keys(oddities), [oddities])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const panX = useRef(0)
  const draggingRef = useRef(false)

  const [width, setWidth] = useState(0)
  const [hovered, setHovered] = useState<NodeRef>(null)
  const [selected, setSelected] = useState<NodeRef>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    region: string
    id: number
    x: number
    y: number
  } | null>(null)

  const maxNodes = useMemo(
    () => Math.max(1, ...regionKeys.map((region) => (oddities[region] ?? []).length)),
    [regionKeys, oddities],
  )
  const contentWidth = LEFT_PAD + maxNodes * SPACING
  const canvasHeight = TOP_PAD + regionKeys.length * ROW_H

  const clampPan = useCallback(() => {
    panX.current = clampPanValue(panX.current, width, contentWidth)
  }, [width, contentWidth])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || width <= 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    clampPan()

    const dpr = window.devicePixelRatio || 1
    const totalHeight = TOP_PAD + regionKeys.length * ROW_H
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(totalHeight * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${totalHeight}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, totalHeight)

    regionKeys.forEach((region, regionIdx) => {
      const nodes = oddities[region] ?? []
      const rowTop = TOP_PAD + regionIdx * ROW_H
      const cy = rowTop + NODE_CY

      nodes.forEach((node, nodeIdx) => {
        const cx = LEFT_PAD + nodeIdx * SPACING + panX.current
        const offscreen = cx < -NODE || cx > width + NODE

        if (nodeIdx > 0) {
          const prevCx = LEFT_PAD + (nodeIdx - 1) * SPACING + panX.current
          const bothOffscreen = offscreen && (prevCx < -NODE || prevCx > width + NODE)
          if (!bothOffscreen) {
            ctx.strokeStyle = "rgba(192, 160, 96, 0.25)"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(prevCx, cy)
            ctx.lineTo(cx, cy)
            ctx.stroke()
          }
        }

        if (offscreen) return

        const isHovered = !!hovered && hovered.region === region && hovered.id === node.id
        const isSelected = !!selected && selected.region === region && selected.id === node.id

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(Math.PI / 4)
        ctx.fillStyle = node.enabled
          ? isHovered
            ? "#e0bd72"
            : "#c0a060"
          : "rgba(192, 160, 96, 0.15)"
        ctx.strokeStyle = isSelected
          ? "#ffffff"
          : node.enabled
            ? "#8a6a30"
            : "rgba(138, 106, 48, 0.4)"
        ctx.lineWidth = isSelected ? 3 : 1.5
        ctx.setLineDash(node.enabled ? [] : [3, 3])
        ctx.beginPath()
        ctx.rect(-HALF, -HALF, NODE, NODE)
        ctx.fill()
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        ctx.fillStyle = node.enabled ? "#1a1a1a" : "#999"
        ctx.font = "18px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(glyphFor(node), cx, cy)
      })

      const label = t(regionLabel(region))
      ctx.font = "13px sans-serif"
      const textWidth = ctx.measureText(label).width
      ctx.fillStyle = "rgba(20, 20, 20, 0.85)"
      ctx.fillRect(8, rowTop + 4, textWidth + 16, 22)
      ctx.strokeStyle = "#3a3a3a"
      ctx.lineWidth = 1
      ctx.strokeRect(8, rowTop + 4, textWidth + 16, 22)
      ctx.fillStyle = "#c0a060"
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
      ctx.fillText(label, 16, rowTop + TITLE_Y)
    })
  }, [width, regionKeys, oddities, hovered, selected, t, clampPan])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => setWidth(container.clientWidth || 0)
    update()
    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(container)
    }
    window.addEventListener("resize", update)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      panX.current += -(e.deltaX || e.deltaY)
      clampPan()
      draw()
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", onWheel)
  }, [draw, clampPan])

  useEffect(() => {
    if (!contextMenu) return
    function onDocMouseDown(ev: MouseEvent) {
      if (menuRef.current?.contains(ev.target as Node)) return
      setContextMenu(null)
    }
    window.addEventListener("mousedown", onDocMouseDown)
    return () => window.removeEventListener("mousedown", onDocMouseDown)
  }, [contextMenu])

  function hitTest(px: number, py: number): NodeRef {
    for (let regionIdx = 0; regionIdx < regionKeys.length; regionIdx++) {
      const region = regionKeys[regionIdx]
      const nodes = oddities[region] ?? []
      const rowTop = TOP_PAD + regionIdx * ROW_H
      const cy = rowTop + NODE_CY
      for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
        const cx = LEFT_PAD + nodeIdx * SPACING + panX.current
        const dx = Math.abs(px - cx) / HALF
        const dy = Math.abs(py - cy) / HALF
        if (dx + dy <= 1) return { region, id: nodes[nodeIdx].id }
      }
    }
    return null
  }

  function localCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setContextMenu(null)
    draggingRef.current = true
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    const drag = { x: e.clientX, startPan: panX.current, moved: false, button: e.button }

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - drag.x
      if (Math.abs(dx) > 3) drag.moved = true
      panX.current = drag.startPan + dx
      clampPan()
      draw()
    }
    function onUp(ev: MouseEvent) {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      draggingRef.current = false
      if (canvasRef.current) canvasRef.current.style.cursor = "grab"
      if (drag.moved) return
      const local = localCoords(ev.clientX, ev.clientY)
      const hit = hitTest(local.x, local.y)
      if (!hit) return
      if (drag.button === 2) {
        const containerRect = containerRef.current?.getBoundingClientRect()
        setContextMenu({
          region: hit.region,
          id: hit.id,
          x: ev.clientX - (containerRect?.left ?? 0),
          y: ev.clientY - (containerRect?.top ?? 0),
        })
      } else {
        const node = (oddities[hit.region] ?? []).find((candidate) => candidate.id === hit.id)
        if (node) patchNode(hit.region, hit.id, { enabled: !node.enabled })
      }
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (draggingRef.current) return
    const local = localCoords(e.clientX, e.clientY)
    const hit = hitTest(local.x, local.y)
    setHovered(hit)
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? "pointer" : "grab"
    const containerRect = containerRef.current?.getBoundingClientRect()
    setCursorPos({
      x: e.clientX - (containerRect?.left ?? 0),
      y: e.clientY - (containerRect?.top ?? 0),
    })
  }

  function onMouseLeave() {
    if (!draggingRef.current) setHovered(null)
  }

  function patchNode(region: string, id: number, patch: Partial<OddityNode>) {
    const nodes = (oddities[region] ?? []).map((node) =>
      node.id === id ? { ...node, ...patch } : node,
    )
    onChange({ ...inputs, oddities: { ...oddities, [region]: nodes } })
  }

  function addNode(region: string) {
    const nodes = oddities[region] ?? []
    const nextId = nodes.reduce((maxId, node) => Math.max(maxId, node.id), 0) + 1
    const node: OddityNode = { id: nextId, stat: "maxPhys", value: 0, enabled: true }
    onChange({ ...inputs, oddities: { ...oddities, [region]: [...nodes, node] } })
    setSelected({ region, id: nextId })
  }

  function removeNode(region: string, id: number) {
    const nodes = (oddities[region] ?? []).filter((node) => node.id !== id)
    onChange({ ...inputs, oddities: { ...oddities, [region]: nodes } })
    setSelected((prev) => (prev && prev.region === region && prev.id === id ? null : prev))
  }

  async function resetAll() {
    if (!(await confirm(t("Reset all oddities to default?")))) return
    onChange({ ...inputs, oddities: deepCloneRegions(DEFAULT_ODDITIES) })
    setSelected(null)
  }

  const hoveredNode = hovered
    ? (oddities[hovered.region] ?? []).find((node) => node.id === hovered.id)
    : null
  const selectedNode = selected
    ? (oddities[selected.region] ?? []).find((node) => node.id === selected.id)
    : null

  return (
    <div className="panel">
      <div className="toolbar">
        <span className="toolbar-label">{t("Oddities")}</span>
        <button type="button" className={`btn ${styles.btnDanger}`} onClick={resetAll}>
          {t("Reset to default")}
        </button>
      </div>

      <div className={styles.odditiesCanvasWrap} ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onContextMenu={(e) => e.preventDefault()}
        />
        {hoveredNode &&
          cursorPos &&
          (() => {
            const flipUp = cursorPos.y > canvasHeight - 90
            const flipLeft = cursorPos.x > width - 180
            const transform =
              `${flipLeft ? "translateX(-100%)" : ""} ${flipUp ? "translateY(-100%)" : ""}`.trim()
            return (
              <div
                className={styles.oddityTooltip}
                style={{
                  left: flipLeft ? cursorPos.x - 16 : cursorPos.x + 16,
                  top: flipUp ? cursorPos.y - 16 : cursorPos.y + 16,
                  transform: transform || undefined,
                }}
              >
                <div className={styles.oddityTooltipTitle}>{nodeSummary(hoveredNode, t)}</div>
                <div className={styles.oddityTooltipState}>
                  {hoveredNode.enabled ? t("On") : t("Off")}
                </div>
              </div>
            )
          })()}
        {contextMenu &&
          (() => {
            const menu = contextMenu
            const custom = !isDefaultNode(menu.region, menu.id)
            return (
              <div
                ref={menuRef}
                className={styles.oddityContextMenu}
                style={{ left: menu.x, top: menu.y }}
              >
                <button
                  type="button"
                  onClick={() => {
                    addNode(menu.region)
                    setContextMenu(null)
                  }}
                >
                  {t("Add node")}
                </button>
                {custom && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected({ region: menu.region, id: menu.id })
                      setContextMenu(null)
                    }}
                  >
                    {t("Edit")}
                  </button>
                )}
                {custom && (
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => {
                      removeNode(menu.region, menu.id)
                      setContextMenu(null)
                    }}
                  >
                    {t("Delete node")}
                  </button>
                )}
              </div>
            )
          })()}
      </div>

      {selected && selectedNode && !isDefaultNode(selected.region, selected.id) && (
        <NodeEditor
          node={selectedNode}
          onPatch={(patch) => patchNode(selected.region, selected.id, patch)}
          t={t}
        />
      )}
    </div>
  )
}

function NodeEditor({
  node,
  onPatch,
  t,
}: {
  node: OddityNode
  onPatch: (patch: Partial<OddityNode>) => void
  t: (text: string) => string
}) {
  const isRate = RATE_STATS.has(node.stat)
  const isPen = PENETRATION_STATS.has(node.stat)
  const displayValue = isRate ? node.value * 100 : node.value
  const setValue = (typed: number) => onPatch({ value: isRate ? typed / 100 : typed })

  return (
    <div className={`panel ${styles.oddityEditor}`}>
      <h3>{t("Edit oddity node")}</h3>
      <div className={styles.talentsCell}>
        <label>{t("Stat")}</label>
        <Select
          ariaLabel={t("Stat")}
          value={node.stat}
          onChange={(stat) => onPatch({ stat: stat as TalentStat })}
          options={STAT_OPTIONS.map((stat) => ({ value: stat, label: t(`stat.${stat}`) }))}
        />
      </div>
      <div className={styles.talentsCell}>
        <label>{t("Amount")}</label>
        <NumInput
          step={isRate ? 0.1 : 1}
          value={Number.isFinite(displayValue) ? displayValue : 0}
          onChange={setValue}
        />
        <span className={styles.talentsUnit}>{isRate && !isPen ? "%" : ""}</span>
      </div>
    </div>
  )
}
