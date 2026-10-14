import type { GearPiece, GearWordId, WeaponName } from "./types"
import {
  TUNEMENT_CAP,
  TUNEMENT_POOLS,
  type TunementCapGroup,
  type TunementLine,
  type TunementPools,
} from "../data/stats/gearTunementWeights"
import type { RetuneLine } from "../data/stats/gearRetuneWeights"
import { gearWordSlotGroup, type GearWordSlotGroup } from "../data/stats/gearWordPools"
import { ALL_REROLLABLE_SLOTS, FIRST_LOCKED_SLOT, retunePoolChoices } from "./retunement"

interface PieceDraws {
  pools: TunementPools
  rolls(line: TunementLine): boolean
  weapon: WeaponName | null
}

function drawsFor(piece: GearPiece, weapon: WeaponName | null): PieceDraws {
  const group: GearWordSlotGroup = gearWordSlotGroup(piece.slot)
  return {
    pools: TUNEMENT_POOLS[piece.level][group][piece.rarity],
    rolls: (line) =>
      !line.onlyOn || line.onlyOn.some((target) => target === group || target === weapon),
    weapon,
  }
}

function totalWeight(lines: readonly TunementLine[]): number {
  return lines.reduce((sum, line) => sum + line.weight, 0)
}

function sharesOf(lines: readonly TunementLine[]): Map<GearWordId, number> {
  const total = totalWeight(lines)
  const shares = new Map<GearWordId, number>()
  if (total === 0) return shares
  for (const line of lines) {
    if (line.word) shares.set(line.word, (shares.get(line.word) ?? 0) + line.weight / total)
  }
  return shares
}

function initialShares({ pools, rolls, weapon }: PieceDraws): Map<GearWordId, number> {
  const initial = pools.initial.find(
    (pool) => !pool.forWeapons || (weapon !== null && pool.forWeapons.includes(weapon)),
  )
  return sharesOf(initial ? initial.lines.filter(rolls) : [])
}

function drawableAfter(
  { pools, rolls }: PieceDraws,
  held: readonly TunementLine[],
): TunementLine[] {
  const heldPerCapGroup = new Map<TunementCapGroup, number>()
  for (const line of held) {
    if (line.capGroup) {
      heldPerCapGroup.set(line.capGroup, (heldPerCapGroup.get(line.capGroup) ?? 0) + 1)
    }
  }
  return pools.retune.filter(
    (line) =>
      rolls(line) &&
      !held.includes(line) &&
      !(line.capGroup && (heldPerCapGroup.get(line.capGroup) ?? 0) >= TUNEMENT_CAP[line.capGroup]),
  )
}

function heldLinesFor(draws: PieceDraws, words: readonly GearWordId[]): TunementLine[] {
  const rollable = draws.pools.retune.filter(draws.rolls)
  return words
    .map((word) => rollable.find((line) => line.word === word))
    .filter((line): line is TunementLine => line !== undefined)
}

function tunedWordsOf(piece: GearPiece, exceptLine?: number): GearWordId[] {
  return ALL_REROLLABLE_SLOTS.filter((index) => index !== exceptLine)
    .map((index) => piece.words[index]?.word)
    .filter((word): word is GearWordId => !!word)
}

export function wordsOnOtherTunableLines(
  piece: GearPiece,
  lineIndex: number,
): ReadonlySet<GearWordId> {
  return lineIndex === FIRST_LOCKED_SLOT ? new Set() : new Set(tunedWordsOf(piece, lineIndex))
}

export function tunementDrawChances(
  piece: GearPiece,
  weapon: WeaponName | null,
  lineIndex: number,
): ReadonlyMap<GearWordId, number> {
  const draws = drawsFor(piece, weapon)
  if (lineIndex === FIRST_LOCKED_SLOT) return initialShares(draws)
  return sharesOf(drawableAfter(draws, heldLinesFor(draws, tunedWordsOf(piece, lineIndex))))
}

const ANY_STAT = null

type DrawPlan = readonly (GearWordId | typeof ANY_STAT)[]

function planChance(
  draws: PieceDraws,
  plan: DrawPlan,
  held: readonly TunementLine[],
  anyStatLine: TunementLine | null,
  finish: (anyStatLine: TunementLine | null) => number,
): number {
  if (plan.length === 0) return finish(anyStatLine)
  const [step, ...rest] = plan
  const drawable = drawableAfter(draws, held)
  const total = totalWeight(drawable)
  if (total === 0) return 0
  if (step !== ANY_STAT) {
    const matching = drawable.filter((line) => line.word === step)
    if (matching.length === 0) return 0
    return (
      (totalWeight(matching) / total) *
      planChance(draws, rest, [...held, matching[0]], anyStatLine, finish)
    )
  }
  return drawable.reduce(
    (sum, line) =>
      sum + (line.weight / total) * planChance(draws, rest, [...held, line], line, finish),
    0,
  )
}

function orderings<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]]
  return items.flatMap((item, index) =>
    orderings([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]),
  )
}

function firstLineChance(piece: GearPiece, draws: PieceDraws): number {
  const firstWord = piece.words[FIRST_LOCKED_SLOT]?.word
  return firstWord ? (initialShares(draws).get(firstWord) ?? 0) : 1
}

export function tunementSetChance(piece: GearPiece, weapon: WeaponName | null): number | null {
  const tunedWords = tunedWordsOf(piece)
  if (!piece.words[FIRST_LOCKED_SLOT]?.word && tunedWords.length === 0) return null
  const draws = drawsFor(piece, weapon)
  const tunedChance = orderings(tunedWords).reduce(
    (sum, order) => sum + planChance(draws, order, [], null, () => 1),
    0,
  )
  return firstLineChance(piece, draws) * tunedChance
}

export interface OneRetuneChance {
  chance: number
  lineIndex: number
}

function retunedLineChance(
  piece: GearPiece,
  draws: PieceDraws,
  lineIndex: number,
  library: readonly RetuneLine[],
): number {
  const target = piece.words[lineIndex].word
  const retuneOnto = (anyStatLine: TunementLine | null): number => {
    if (anyStatLine?.word === target) return 1
    const words = piece.words.map((entry, index) =>
      index === lineIndex ? { ...entry, word: anyStatLine?.word ?? "" } : entry,
    ) as GearPiece["words"]
    const choice = retunePoolChoices({ ...piece, words }, library).find(
      (candidate) => candidate.word === target,
    )
    return choice?.pDraw ?? 0
  }
  return orderings(tunedWordsOf(piece, lineIndex)).reduce((sum, order) => {
    let orderSum = sum
    for (let position = 0; position <= order.length; position++) {
      const plan: DrawPlan = [...order.slice(0, position), ANY_STAT, ...order.slice(position)]
      orderSum += planChance(draws, plan, [], null, retuneOnto)
    }
    return orderSum
  }, 0)
}

export function oneRetuneTunedLinesChance(
  piece: GearPiece,
  weapon: WeaponName | null,
  library: readonly RetuneLine[] | null,
): OneRetuneChance | null {
  if (!library) return null
  const tunedLines = ALL_REROLLABLE_SLOTS.filter((index) => !!piece.words[index]?.word)
  if (tunedLines.length === 0) return null
  const markedLines = tunedLines.filter((index) => piece.words[index].retuned)
  const draws = drawsFor(piece, weapon)
  return (markedLines.length > 0 ? markedLines : tunedLines)
    .map((lineIndex) => ({
      lineIndex,
      chance: retunedLineChance(piece, draws, lineIndex, library),
    }))
    .reduce((best, candidate) => (candidate.chance > best.chance ? candidate : best))
}

export function oneRetuneSetChance(
  piece: GearPiece,
  weapon: WeaponName | null,
  library: readonly RetuneLine[] | null,
): OneRetuneChance | null {
  const tuned = oneRetuneTunedLinesChance(piece, weapon, library)
  if (!tuned) return null
  return { ...tuned, chance: firstLineChance(piece, drawsFor(piece, weapon)) * tuned.chance }
}
