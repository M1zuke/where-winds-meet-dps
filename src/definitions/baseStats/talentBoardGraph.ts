import { TALENT_BOARD } from "../../data/baseStats"
import type { DisabledTalentNodes } from "../../engine/types"
import type { TalentNodeDef } from "./talentNodeDef"
import type { TalentPointEffects, TalentPointStat } from "./talentPointDef"

export interface TalentBoardCell {
  key: string
  column: number
  lane: number
  requires: string | null
  ranks: readonly TalentNodeDef[]
}

const STAT_ORDER: Readonly<Record<TalentPointStat, number>> = {
  minPhys: 0,
  maxPhys: 1,
  minFormless: 2,
  maxFormless: 3,
  precisionRate: 4,
  critRate: 5,
  critDamage: 6,
  affinityRate: 7,
  affinityDamage: 8,
  power: 9,
  agility: 10,
  momentum: 11,
  body: 12,
  defense: 13,
  maxHp: 14,
  physDef: 15,
}

export const TALENT_POINT_BUDGET = TALENT_BOARD.length

const NODES_BY_ID = new Map(TALENT_BOARD.map((node) => [node.id, node]))

const CHILDREN_BY_ID = ((): ReadonlyMap<number, readonly number[]> => {
  const children = new Map<number, number[]>()
  for (const node of TALENT_BOARD) {
    if (node.requires === undefined) continue
    const siblings = children.get(node.requires)
    if (siblings) siblings.push(node.id)
    else children.set(node.requires, [node.id])
  }
  return children
})()

const cellKeyOf = (node: TalentNodeDef): string => `${node.column},${node.lane}`

export const TALENT_BOARD_CELLS: readonly TalentBoardCell[] = ((): TalentBoardCell[] => {
  const byKey = new Map<string, TalentNodeDef[]>()
  for (const node of [...TALENT_BOARD].sort((left, right) => left.id - right.id)) {
    const ranks = byKey.get(cellKeyOf(node))
    if (ranks) ranks.push(node)
    else byKey.set(cellKeyOf(node), [node])
  }
  return [...byKey.values()]
    .map((ranks) => {
      const parent = ranks[0].requires === undefined ? null : NODES_BY_ID.get(ranks[0].requires)
      return {
        key: cellKeyOf(ranks[0]),
        column: ranks[0].column,
        lane: ranks[0].lane,
        requires: parent ? cellKeyOf(parent) : null,
        ranks,
      }
    })
    .sort((left, right) => left.column - right.column || left.lane - right.lane)
})()

export interface TalentBoardGate {
  column: number
  level: number
}

export const TALENT_BOARD_GATES: readonly TalentBoardGate[] = TALENT_BOARD.filter(
  (node) => node.gate?.kind === "worldLevel",
)
  .map((node) => ({ column: node.column, level: node.gate!.value }))
  .sort((left, right) => left.column - right.column)

export function talentNodeById(id: number): TalentNodeDef | undefined {
  return NODES_BY_ID.get(id)
}

export function talentPointStats(effects: TalentPointEffects): TalentPointStat[] {
  return (Object.keys(effects) as TalentPointStat[]).sort(
    (left, right) => STAT_ORDER[left] - STAT_ORDER[right],
  )
}

export function closeDisabledTalentNodes(disabled: DisabledTalentNodes): number[] {
  const closed = new Set(disabled)
  const pending = [...closed]
  while (pending.length > 0) {
    for (const child of CHILDREN_BY_ID.get(pending.pop()!) ?? []) {
      if (closed.has(child)) continue
      closed.add(child)
      pending.push(child)
    }
  }
  return [...closed].sort((left, right) => left - right)
}

export function isTalentNodeTaken(disabled: DisabledTalentNodes | undefined, id: number): boolean {
  return !disabled?.includes(id)
}

const BLOCKED_BY_BREAKTHROUGH = new Map<number, readonly number[]>()

export function talentNodesAboveBreakthrough(breakthrough: number): readonly number[] {
  const cached = BLOCKED_BY_BREAKTHROUGH.get(breakthrough)
  if (cached) return cached
  const blocked = closeDisabledTalentNodes(
    TALENT_BOARD.filter(
      (node) => node.gate?.kind === "worldLevel" && node.gate.value > breakthrough,
    ).map((node) => node.id),
  )
  BLOCKED_BY_BREAKTHROUGH.set(breakthrough, blocked)
  return blocked
}

export function effectiveDisabledTalentNodes(
  disabled: DisabledTalentNodes | undefined,
  breakthrough: number,
): readonly number[] {
  const blocked = talentNodesAboveBreakthrough(breakthrough)
  if (!disabled || disabled.length === 0) return blocked
  return closeDisabledTalentNodes([...disabled, ...blocked])
}

export function takenRanks(
  cell: TalentBoardCell,
  disabled: DisabledTalentNodes | undefined,
): number {
  return cell.ranks.filter((node) => isTalentNodeTaken(disabled, node.id)).length
}

export function takenTalentPoints(disabled: DisabledTalentNodes | undefined): number {
  return TALENT_BOARD.filter((node) => isTalentNodeTaken(disabled, node.id)).length
}

export function withTalentCellRanks(
  disabled: DisabledTalentNodes | undefined,
  cell: TalentBoardCell,
  ranks: number,
): number[] {
  const next = new Set(disabled ?? [])
  cell.ranks.forEach((node, index) => {
    if (index < ranks) next.delete(node.id)
    else next.add(node.id)
  })
  return closeDisabledTalentNodes([...next])
}

export function talentBoardTotals(
  disabled: DisabledTalentNodes | undefined,
): Readonly<Partial<Record<TalentPointStat, number>>> {
  const totals: Partial<Record<TalentPointStat, number>> = {}
  for (const node of TALENT_BOARD) {
    if (!node.effects || !isTalentNodeTaken(disabled, node.id)) continue
    for (const [stat, value] of Object.entries(node.effects) as [TalentPointStat, number][]) {
      totals[stat] = (totals[stat] ?? 0) + value
    }
  }
  return totals
}
