// Ranges are the breakthrough-16 gear-tier rolls, and each `labelByClass` entry
// the official English Attune Effect name for that class's art (in-game Attune
// Effect list, 2026-08-13; Nameless Sword / Spear from the client localization).
import type { AttunementOption } from "../../engine/attunements"
import { ARMOR_SLOTS } from "./attunementSlots"

export const WEAPON_ART_ATTUNEMENTS = [
  {
    id: "swordQ",
    label: "Sword Martial Art Skill DMG Boost",
    labelByClass: {
      bellstrikeUmbra: "Strategic Sword Martial Art Skill DMG Boost",
      bellstrikeSplendor: "Nameless Sword Martial Art Skill DMG Boost",
    },
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra", "bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.swordQ",
    affectsTag: "attune:swordQ",
  },
  {
    id: "swordSpecial",
    label: "Sword Special Skill DMG Boost",
    labelByClass: {
      bellstrikeUmbra: "Strategic Sword Special Skill DMG Boost",
      bellstrikeSplendor: "Nameless Sword Special Skill DMG Boost",
    },
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra", "bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.swordSpecial",
    affectsTag: "attune:swordSpecial",
  },
  {
    id: "spearQ",
    label: "Spear Martial Art Skill DMG Boost",
    labelByClass: { bellstrikeUmbra: "Heavenquaker Spear Martial Art Skill DMG Boost" },
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.spearQ",
    affectsTag: "attune:spearQ",
  },
  {
    id: "spearCharged",
    label: "Spear Charged Skill DMG Boost",
    labelByClass: {
      bellstrikeUmbra: "Heavenquaker Spear Charged Skill DMG Boost",
      bellstrikeSplendor: "Nameless Spear Charged Skill DMG Boost",
    },
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra", "bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.spearCharged",
    affectsTag: "attune:spearCharged",
  },
] as const satisfies readonly AttunementOption[]
