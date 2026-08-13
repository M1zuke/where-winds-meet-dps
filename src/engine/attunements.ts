import type { GearSlot } from "./types"
import { ATTUNEMENT_OPTIONS as OPTIONS } from "../data/classes/attunementOptions"

export interface AttunementOption {
  id: string
  label: string
  min: number
  max: number
  slots: readonly GearSlot[]
  classIds: readonly string[] | null
  enginePath: string | null
  // Which entities the rolled stat reaches. Only meaningful for the
  // `dingYinByTag.*` attunements, whose value is scoped to a category of skills
  // rather than applying to everything the character does.
  affectsTag?: string
  hint?: string
}

export const ATTUNEMENT_OPTIONS: readonly AttunementOption[] = OPTIONS

export type AttunementId = (typeof OPTIONS)[number]["id"]

export function attunementsForClass(classId: string): AttunementOption[] {
  return ATTUNEMENT_OPTIONS.filter((opt) => !opt.classIds || opt.classIds.includes(classId))
}

export function attunementsFor(slot: GearSlot, classId: string): AttunementOption[] {
  return attunementsForClass(classId).filter((opt) => opt.slots.includes(slot))
}

export function getAttunement(id: string): AttunementOption | undefined {
  return ATTUNEMENT_OPTIONS.find((o) => o.id === id)
}
