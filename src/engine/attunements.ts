import type { GearLevel, GearLevelValues, GearSlot } from "./types"
import { ATTUNEMENT_OPTIONS as OPTIONS } from "../data/classes/attunementOptions"

export interface AttunementOption {
  id: string
  label: string
  min: GearLevelValues
  max: GearLevelValues
  slots: readonly GearSlot[]
  classIds: readonly string[] | null
  enginePath: string | null
  // Which entities the rolled stat reaches. Only meaningful for the
  // `classSpecificAttunement.*` attunements, whose value is scoped to a category of skills
  // rather than applying to everything the character does.
  affectsTag?: string
  hint?: string
}

export const ATTUNEMENT_OPTIONS: readonly AttunementOption[] = OPTIONS

export type AttunementId = (typeof OPTIONS)[number]["id"]

export function attunementsForClass(classId: string): AttunementOption[] {
  return ATTUNEMENT_OPTIONS.filter((opt) => !opt.classIds || opt.classIds.includes(classId))
}

export function rollsAt(option: AttunementOption, level: GearLevel): boolean {
  return option.max[level] !== undefined
}

export function attunementsFor(
  slot: GearSlot,
  classId: string,
  level: GearLevel,
): AttunementOption[] {
  return attunementsForClass(classId).filter(
    (opt) => opt.slots.includes(slot) && rollsAt(opt, level),
  )
}

export function getAttunement(id: string): AttunementOption | undefined {
  return ATTUNEMENT_OPTIONS.find((o) => o.id === id)
}

/** 0 for a level the option does not roll at — see the ladder's `—` rule. */
export function attunementMin(option: AttunementOption, level: GearLevel): number {
  return option.min[level] ?? 0
}

export function attunementMax(option: AttunementOption, level: GearLevel): number {
  return option.max[level] ?? 0
}
