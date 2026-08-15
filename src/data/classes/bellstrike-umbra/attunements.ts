// Ranges are the breakthrough-16 gear-tier rolls, and labels the official
// English Attune Effect names (in-game Attune Effect list, 2026-08-13).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const BELLSTRIKE_UMBRA_ATTUNEMENTS = [
  {
    id: "bleedingDamage",
    label: "Strategic Sword - Bleeding DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.bleedingDamage",
    affectsTag: "attune:bleed",
  },
] as const satisfies readonly AttunementOption[]
