import type { GraduationBuild } from "../definitions/graduationBuilds/graduationBuildDef"
import type { GearPiece, GearWordId, Inputs } from "./types"
import { followedGraduationBuildAmong, graduationBuildsForProfile } from "./graduation"
import { ALL_REROLLABLE_SLOTS, retunedOutWordsOf } from "./retunement"

export interface HeirloomSwap {
  slotIndex: number
  currentWord: GearWordId | ""
  word: GearWordId
}

export type HeirloomProfile = Pick<
  Inputs,
  "classId" | "graduationBuildId" | "customGraduationBuild"
>

export interface HeirloomMatch {
  builds: readonly GraduationBuild[]
  followed: boolean
  swap: HeirloomSwap | null
}

const NO_MATCH: HeirloomMatch = { builds: [], followed: false, swap: null }

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

function singleSwapTo(piece: GearPiece, target: GearPiece): HeirloomSwap | null {
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
  return { slotIndex, currentWord: piece.words[slotIndex].word, word: missing[0] as GearWordId }
}

function canStillRetune(piece: GearPiece, slotIndex: number, word: GearWordId): boolean {
  if (piece.relayed) return false
  const markedElsewhere = piece.words.some(
    (line, index) => line.retuned && index !== slotIndex && ALL_REROLLABLE_SLOTS.includes(index),
  )
  if (markedElsewhere) return false
  return !retunedOutWordsOf(piece).has(word)
}

export function heirloomMatch(piece: GearPiece, profile: HeirloomProfile): HeirloomMatch {
  const builds = graduationBuildsForProfile(profile)
  if (builds.length === 0 || piece.words.some((word) => !word.word)) return NO_MATCH

  const perfect: GraduationBuild[] = []
  let swap: HeirloomSwap | null = null
  for (const build of builds) {
    const target = build.gear.find((gearPiece) => gearPiece.slot === piece.slot)
    if (!target) continue
    if (sameWordSet(piece, target)) {
      perfect.push(build)
      continue
    }
    if (swap) continue
    const candidate = singleSwapTo(piece, target)
    if (candidate && canStillRetune(piece, candidate.slotIndex, candidate.word)) swap = candidate
  }
  if (perfect.length === 0) return { builds: [], followed: false, swap }
  const followed = followedGraduationBuildAmong(builds, profile.graduationBuildId)
  return {
    builds: perfect,
    followed: perfect.some((build) => build.id === followed?.id),
    swap: null,
  }
}

export function isHeirloom(piece: GearPiece, profile: HeirloomProfile): boolean {
  return heirloomMatch(piece, profile).builds.length > 0
}

export function heirloomSwapFor(piece: GearPiece, profile: HeirloomProfile): HeirloomSwap | null {
  return heirloomMatch(piece, profile).swap
}
