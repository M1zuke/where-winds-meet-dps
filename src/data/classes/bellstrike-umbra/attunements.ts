// Ranges are the breakthrough-16 gear-tier rolls (in-game Attune Effect list,
// 2026-08-13).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const BELLSTRIKE_UMBRA_ATTUNEMENTS = [
  {
    id: "bleedingDamage",
    label: "Bleed Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.Bleed Boost",
    affectsTag: "attune:bleed",
  },
  {
    id: "swordQ",
    label: "Strategic Sword Martial Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.Strategic Sword Martial Boost",
    affectsTag: "attune:swordQ",
  },
  {
    id: "swordSpecial",
    label: "Strategic Sword Special Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.Strategic Sword Special Boost",
    affectsTag: "attune:swordSpecial",
  },
  {
    id: "spearQ",
    label: "Heavenquaker Spear Martial Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.Heavenquaker Spear Martial Boost",
    affectsTag: "attune:spearQ",
  },
  {
    id: "spearCharged",
    label: "Heavenquaker Spear Charged Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.Heavenquaker Spear Charged Boost",
    affectsTag: "attune:spearCharged",
  },
] as const satisfies readonly AttunementOption[]
