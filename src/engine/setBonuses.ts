import type { BowGearLevel, BowSet, GearLevel, GearLevelValues, GearPiece, Inputs } from "./types"
import { GEAR_LEVELS } from "./types"
import { FOUR_PIECE_SIZE, TWO_PIECE_SIZE, equippedSetBearingPieces } from "./setPieces"
import { GEAR_SET_DEFS, SET_BY_ID } from "../definitions/sets/registry"
import { BOW_SET_DEFS } from "../data/sets/bowSets"

export { setPieceCount, setPieceCountWith } from "./setPieces"

export interface ActiveSets {
  twoPiece: readonly { setId: string; level: GearLevel }[]
  fourPiece: string | null
  bow: { set: Exclude<BowSet, null>; level: BowGearLevel } | null
}

export interface GearSetOption {
  name: string
  setKey: string
  stat?: "affinityRate" | "critRate" | "precisionRate" | "maxPhys" | "minPhys" | "physDef"
  value?: GearLevelValues
}

export const GEAR_SET_OPTIONS: readonly GearSetOption[] = GEAR_SET_DEFS.map((set) => ({
  name: set.name,
  setKey: set.id,
  ...set.panelBonus,
}))

export function setTierLevel(
  levels: readonly number[],
  tierSize: number,
  ladderLevels: readonly number[],
): number | null {
  if (levels.length < tierSize || ladderLevels.length === 0) return null
  const highest = [...levels].sort((left, right) => right - left).slice(0, tierSize)
  const average = highest.reduce((sum, level) => sum + level, 0) / tierSize
  const ascending = [...ladderLevels].sort((left, right) => left - right)
  return ascending.find((rung) => rung >= average) ?? ascending[ascending.length - 1]
}

function ladderOf(values: GearLevelValues | undefined): readonly number[] {
  return values ? Object.keys(values).map(Number) : GEAR_LEVELS
}

function knownSetOf(piece: GearPiece): string | null {
  return typeof piece.set === "string" && SET_BY_ID[piece.set]?.group === "gear" ? piece.set : null
}

function levelsBySet(pieces: readonly GearPiece[]): Map<string, number[]> {
  const bySet = new Map<string, number[]>()
  for (const piece of pieces) {
    const setId = knownSetOf(piece)
    if (setId) bySet.set(setId, [...(bySet.get(setId) ?? []), piece.level])
  }
  return bySet
}

export function resolveActiveSets(inputs: Inputs): ActiveSets {
  const twoPiece: { setId: string; level: GearLevel }[] = []
  let fourPiece: string | null = null
  for (const [setId, levels] of levelsBySet(equippedSetBearingPieces(inputs))) {
    const ladder = ladderOf(SET_BY_ID[setId]?.panelBonus?.value)
    const level = setTierLevel(levels, TWO_PIECE_SIZE, ladder)
    if (level !== null) twoPiece.push({ setId, level: level as GearLevel })
    if (levels.length >= FOUR_PIECE_SIZE) fourPiece = setId
  }

  const { bow, thumbRing } = inputs.bowGear
  let activeBow: ActiveSets["bow"] = null
  if (bow && thumbRing && bow.set !== null && bow.set === thumbRing.set) {
    const definition = BOW_SET_DEFS[bow.set]
    const level = definition
      ? setTierLevel([bow.level, thumbRing.level], TWO_PIECE_SIZE, ladderOf(definition.value))
      : null
    if (level !== null) activeBow = { set: bow.set, level: level as BowGearLevel }
  }

  return { twoPiece, fourPiece, bow: activeBow }
}

function withStat(inputs: Inputs, stat: NonNullable<GearSetOption["stat"]>, value: number): Inputs {
  switch (stat) {
    case "affinityRate":
      return { ...inputs, affinityRate: inputs.affinityRate + value }
    case "critRate":
      return { ...inputs, critRate: inputs.critRate + value }
    case "precisionRate":
      return { ...inputs, precision: inputs.precision + value }
    case "maxPhys":
      return { ...inputs, phys: { ...inputs.phys, max: inputs.phys.max + value } }
    case "minPhys":
      return { ...inputs, phys: { ...inputs.phys, min: inputs.phys.min + value } }
    case "physDef":
      return inputs
  }
}

export function applySetBonuses(inputs: Inputs): Inputs {
  const active = resolveActiveSets(inputs)
  let next = inputs
  for (const { setId, level } of active.twoPiece) {
    const bonus = SET_BY_ID[setId]?.panelBonus
    const value = bonus?.value[level]
    if (bonus && value !== undefined) next = withStat(next, bonus.stat, value)
  }
  if (active.bow) {
    const definition = BOW_SET_DEFS[active.bow.set]
    const value = definition.value[active.bow.level]
    if (value !== undefined) next = withStat(next, definition.stat, value)
  }
  return next
}

export function setPhysDefBonus(inputs: Inputs): number {
  let total = 0
  for (const { setId, level } of resolveActiveSets(inputs).twoPiece) {
    const bonus = SET_BY_ID[setId]?.panelBonus
    if (bonus?.stat === "physDef") total += bonus.value[level] ?? 0
  }
  return total
}
