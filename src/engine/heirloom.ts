import type { GraduationBuild } from "../definitions/graduationBuilds/graduationBuildDef"
import type { GearPiece, GearWordId, Inputs } from "./types"
import { followedGraduationBuildAmong, graduationBuildsForProfile } from "./graduation"
import { ALL_REROLLABLE_SLOTS, retunedOutWordsOf } from "./retunement"
import { gearPieceAtGearLevel } from "../data/classes/graduationGear"
import { gearWordPoolForLine } from "../data/stats/gearWordPools"
import { weaponTypeForSlot } from "../definitions/classes/registry"

export interface HeirloomSwap {
  slotIndex: number
  currentWord: GearWordId | ""
  word: GearWordId
  builds: readonly GraduationBuild[]
}

export type HeirloomProfile = Pick<
  Inputs,
  "classId" | "graduationBuildId" | "customGraduationBuild"
>

export interface HeirloomMatch {
  builds: readonly GraduationBuild[]
  followed: boolean
  swaps: readonly HeirloomSwap[]
  swap: HeirloomSwap | null
}

const NO_MATCH: HeirloomMatch = { builds: [], followed: false, swaps: [], swap: null }

function wordIds(piece: Pick<GearPiece, "words">): string[] {
  return piece.words.map((word) => word.word)
}

function sortedWordIds(piece: Pick<GearPiece, "words">): string[] {
  return [...wordIds(piece)].sort()
}

function sameWordSet(piece: Pick<GearPiece, "words">, target: GearPiece): boolean {
  const pieceWords = sortedWordIds(piece)
  const targetWords = sortedWordIds(target)
  return pieceWords.every((word, index) => word === targetWords[index])
}

function singleSwapTo(
  piece: GearPiece,
  target: GearPiece,
  build: GraduationBuild,
): HeirloomSwap | null {
  const missing = [...wordIds(target)]
  const extra: number[] = []
  for (const [slotIndex, word] of wordIds(piece).entries()) {
    const found = missing.indexOf(word)
    if (found >= 0) missing.splice(found, 1)
    else extra.push(slotIndex)
  }
  if (extra.length !== 1 || missing.length !== 1) return null
  const slotIndex = extra[0]
  if (!ALL_REROLLABLE_SLOTS.includes(slotIndex)) return null
  return {
    slotIndex,
    currentWord: piece.words[slotIndex].word,
    word: missing[0] as GearWordId,
    builds: [build],
  }
}

function canStillRetune(piece: GearPiece, slotIndex: number, word: GearWordId): boolean {
  if (piece.relayed) return false
  const markedElsewhere = piece.words.some(
    (line, index) => line.retuned && index !== slotIndex && ALL_REROLLABLE_SLOTS.includes(index),
  )
  if (markedElsewhere) return false
  return !retunedOutWordsOf(piece).has(word)
}

function isWordInLinePool(piece: GearPiece, swap: HeirloomSwap, classId: string): boolean {
  return gearWordPoolForLine(
    piece.level,
    piece.slot,
    swap.slotIndex,
    weaponTypeForSlot(classId, piece.slot),
  ).includes(swap.word)
}

export function heirloomMatch(piece: GearPiece, profile: HeirloomProfile): HeirloomMatch {
  const builds = graduationBuildsForProfile(profile)
  if (builds.length === 0 || piece.words.some((word) => !word.word)) return NO_MATCH

  const followed = followedGraduationBuildAmong(builds, profile.graduationBuildId)
  const perfect: GraduationBuild[] = []
  const swaps: HeirloomSwap[] = []
  for (const build of builds) {
    const rawTarget = build.gear.find((gearPiece) => gearPiece.slot === piece.slot)
    if (!rawTarget) continue
    const target = gearPieceAtGearLevel(rawTarget, piece.level)
    if (sameWordSet(piece, target)) {
      perfect.push(build)
      continue
    }
    const candidate = singleSwapTo(piece, target, build)
    if (
      !candidate ||
      !canStillRetune(piece, candidate.slotIndex, candidate.word) ||
      !isWordInLinePool(piece, candidate, profile.classId)
    )
      continue
    const sameSwap = swaps.find(
      (swap) => swap.slotIndex === candidate.slotIndex && swap.word === candidate.word,
    )
    if (sameSwap) sameSwap.builds = [...sameSwap.builds, build]
    else swaps.push(candidate)
  }
  if (perfect.length > 0)
    return {
      builds: perfect,
      followed: perfect.some((build) => build.id === followed?.id),
      swaps: [],
      swap: null,
    }
  const followedRank = (swap: HeirloomSwap) =>
    swap.builds.some((build) => build.id === followed?.id) ? 0 : 1
  const orderedSwaps = swaps.sort((first, second) => followedRank(first) - followedRank(second))
  return { builds: [], followed: false, swaps: orderedSwaps, swap: orderedSwaps[0] ?? null }
}

export function isHeirloom(piece: GearPiece, profile: HeirloomProfile): boolean {
  return heirloomMatch(piece, profile).builds.length > 0
}

export function heirloomSwapFor(piece: GearPiece, profile: HeirloomProfile): HeirloomSwap | null {
  return heirloomMatch(piece, profile).swap
}
