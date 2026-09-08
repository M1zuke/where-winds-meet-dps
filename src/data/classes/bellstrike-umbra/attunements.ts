// Labels are the official English Attune Effect names (in-game Attune Effect
// list, 2026-08-13). Ranges are the gear-level ladder's `bleed` row (2026-09-07).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const BELLSTRIKE_UMBRA_ATTUNEMENTS = [
  {
    id: "bleedingDamage",
    label: "Strategic Sword - Bleeding DMG Boost",
    min: { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 },
    max: { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 },
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.bleedingDamage",
    affectsTag: "attune:bleed",
  },
] as const satisfies readonly AttunementOption[]
