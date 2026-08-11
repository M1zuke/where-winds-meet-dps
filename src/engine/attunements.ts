import type { Skill } from "./skill"
import { readStatValue, resolveEnginePath } from "./statPaths"
import type { GearSlot, Inputs } from "./types"

export interface AttunementSkillEffect {
  /** Matches a skill carrying `attune:<tag>`. */
  tag: string
  kind: "damageMultiplier"
}

export interface AttunementOption {
  id: string
  label: string
  min: number
  max: number
  slots: readonly GearSlot[]
  classIds: readonly string[] | null
  enginePath: string | null
  skillEffect?: AttunementSkillEffect
  hint?: string
}

const GENERAL_SLOTS: readonly GearSlot[] = ["leftWeapon", "rightWeapon", "disc", "pendant"]
const ARMOR_SLOTS: readonly GearSlot[] = ["helm", "armor", "greaves", "bracer"]

// Ranges are the breakthrough-16 gear-tier rolls (in-game, 2026-07-24).
export const ATTUNEMENT_OPTIONS: readonly AttunementOption[] = [
  {
    id: "physPen",
    label: "Physical Penetration",
    min: 0.066,
    max: 0.11,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: "phys.penetration",
  },
  {
    id: "formlessPen",
    label: "Formless Penetration",
    min: 0.078,
    max: 0.13,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: "primaryAttr.penetration",
  },
  {
    id: "physResist",
    label: "Physical Resistance",
    min: 0.066,
    max: 0.11,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: null,
    hint: "(defense only)",
  },
  {
    id: "bleedingDamage",
    label: "Bleed Boost",
    min: 0.03,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "dingYinByTag.Bleed Boost",
    skillEffect: { tag: "bleed", kind: "damageMultiplier" },
  },
  {
    id: "phalanxChargeDamage",
    label: "Phalanx Charge Boost",
    min: 0.03,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "dingYinByTag.Phalanx Charge Boost",
    skillEffect: { tag: "phalanxbaneCharged", kind: "damageMultiplier" },
  },
]

export function attunementsForClass(classId: string): AttunementOption[] {
  return ATTUNEMENT_OPTIONS.filter((opt) => !opt.classIds || opt.classIds.includes(classId))
}

export function attunementsFor(slot: GearSlot, classId: string): AttunementOption[] {
  return attunementsForClass(classId).filter((opt) => opt.slots.includes(slot))
}

export function getAttunement(id: string): AttunementOption | undefined {
  return ATTUNEMENT_OPTIONS.find((o) => o.id === id)
}

/**
 * Returns the post-formula multiplier contributed by every class-legal,
 * skill-scoped attunement whose `attune:*` selector matches this skill.
 * Values for the same skill add before becoming one multiplier.
 */
export function skillAttunementDamageMultiplier(
  skill: Pick<Skill, "tags">,
  inputs: Inputs,
): number {
  const tags = new Set(skill.tags ?? [])
  let bonus = 0

  for (const option of attunementsForClass(inputs.classId)) {
    const effect = option.skillEffect
    if (!effect || effect.kind !== "damageMultiplier" || !option.enginePath) continue
    if (!tags.has(`attune:${effect.tag}`)) continue
    bonus += readStatValue(inputs, resolveEnginePath(option.enginePath, inputs))
  }

  return 1 + bonus
}
