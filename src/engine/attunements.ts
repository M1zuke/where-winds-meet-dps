import type { GearSlot } from "./types"

export interface AttunementOption {
  id: string
  label: string
  min: number
  max: number
  slots: readonly GearSlot[]
  classIds: readonly string[] | null
  enginePath: string | null
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
  },
  {
    id: "moBladeCharge",
    label: "Mo Blade Charged Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitPower"],
    enginePath: "dingYinByTag.attune:moBladeCharge",
  },
]

export function attunementsFor(slot: GearSlot, classId: string): AttunementOption[] {
  return ATTUNEMENT_OPTIONS.filter((opt) => {
    if (!opt.slots.includes(slot)) return false
    if (opt.classIds && !opt.classIds.includes(classId)) return false
    return true
  })
}

export function getAttunement(id: string): AttunementOption | undefined {
  return ATTUNEMENT_OPTIONS.find((o) => o.id === id)
}
