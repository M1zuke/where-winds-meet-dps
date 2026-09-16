import { createGraduationGearPiece } from "../data/classes/graduationGear"
import type { GraduationWords } from "../data/classes/graduationGear"
import { GEAR_WORD_IDS } from "../data/stats/statLines"
import type { GraduationBuild } from "../definitions/graduationBuilds/graduationBuildDef"
import type { AttunementId } from "./attunements"
import { getAttunement } from "./attunements"
import type { Arsenal, BowSet, GearSlot, GearWordId } from "./types"
import { GEAR_SLOTS } from "./types"

export interface CustomGraduationSlot {
  slot: GearSlot
  words: GraduationWords
  attunement: string
}

export interface CustomGraduationBuild {
  id: string
  name: string
  classId: string
  slots: readonly CustomGraduationSlot[]
  set: string | null
  bowSet: BowSet
  arsenal: Arsenal
  rotationId: string
  createdAt: string
  updatedAt: string
}

const ARSENALS: Readonly<Record<Arsenal, true>> = {
  general: true,
  bellstrike: true,
  stonesplit: true,
  silkbind: true,
  bamboocut: true,
}

const BOW_SETS: Readonly<Record<Exclude<BowSet, null>, true>> = {
  affinity: true,
  crit: true,
  precision: true,
}

let buildCounter = 0

export function newCustomGraduationBuildId(): string {
  buildCounter = (buildCounter + 1) | 0
  const time = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `cg-${time}-${random}-${buildCounter.toString(36)}`
}

export function isCustomGraduationSlot(value: unknown): value is CustomGraduationSlot {
  if (!value || typeof value !== "object") return false
  const slot = value as CustomGraduationSlot
  if (!GEAR_SLOTS.includes(slot.slot)) return false
  if (!Array.isArray(slot.words) || slot.words.length !== 5) return false
  if (!slot.words.every((word) => GEAR_WORD_IDS.includes(word as GearWordId))) return false
  return typeof slot.attunement === "string" && getAttunement(slot.attunement) !== undefined
}

export function isCustomGraduationBuild(value: unknown): value is CustomGraduationBuild {
  if (!value || typeof value !== "object") return false
  const build = value as CustomGraduationBuild
  if (typeof build.id !== "string" || build.id === "") return false
  if (typeof build.name !== "string" || build.name === "") return false
  if (typeof build.classId !== "string" || build.classId === "") return false
  if (typeof build.rotationId !== "string" || build.rotationId === "") return false
  if (build.set !== null && typeof build.set !== "string") return false
  if (build.bowSet !== null && !(build.bowSet in BOW_SETS)) return false
  if (!(build.arsenal in ARSENALS)) return false
  if (typeof build.createdAt !== "string" || typeof build.updatedAt !== "string") return false
  if (!Array.isArray(build.slots) || build.slots.length === 0) return false
  return build.slots.every(isCustomGraduationSlot)
}

export function graduationBuildFromCustom(custom: CustomGraduationBuild): GraduationBuild {
  return {
    id: custom.id,
    name: custom.name,
    classId: custom.classId,
    gear: custom.slots.map((slot) =>
      createGraduationGearPiece({
        idPrefix: custom.id,
        slot: slot.slot,
        words: slot.words,
        attunement: slot.attunement as AttunementId,
      }),
    ),
    set: custom.set,
    bowSet: custom.bowSet,
    arsenal: custom.arsenal,
    rotationId: custom.rotationId,
  }
}
