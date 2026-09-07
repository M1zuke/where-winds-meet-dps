// Each `labelByClass` entry carries the official English Attune Effect name for
// that class's art (in-game Attune Effect list, 2026-08-13; Nameless Sword /
// Spear from the client localization).
import type { AttunementOption } from "../../engine/attunements"
import { ARMOR_SLOTS } from "./attunementSlots"

// Gear-level ladder, shared by every "martial-art / charged / special skill DMG
// boost" attunement line (in-game, 2026-09-07).
const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }

export const WEAPON_ART_ATTUNEMENTS = [
  {
    id: "swordQ",
    label: "Sword Martial Art Skill DMG Boost",
    labelByClass: {
      bellstrikeUmbra: "Strategic Sword Martial Art Skill DMG Boost",
      bellstrikeSplendor: "Nameless Sword Martial Art Skill DMG Boost",
    },
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra", "bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.swordQ",
    affectsTag: "attune:swordQ",
  },
  {
    id: "swordCharged",
    label: "Sword Charged Skill DMG Boost",
    labelByClass: { bellstrikeSplendor: "Nameless Sword Charged Skill DMG Boost" },
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.swordCharged",
    affectsTag: "attune:swordCharged",
  },
  {
    id: "swordSpecial",
    label: "Sword Special Skill DMG Boost",
    labelByClass: {
      bellstrikeUmbra: "Strategic Sword Special Skill DMG Boost",
      bellstrikeSplendor: "Nameless Sword Special Skill DMG Boost",
    },
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra", "bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.swordSpecial",
    affectsTag: "attune:swordSpecial",
  },
  {
    id: "spearQ",
    label: "Spear Martial Art Skill DMG Boost",
    labelByClass: { bellstrikeUmbra: "Heavenquaker Spear Martial Art Skill DMG Boost" },
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
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
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra", "bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.spearCharged",
    affectsTag: "attune:spearCharged",
  },
  {
    id: "spearSpecial",
    label: "Spear Special Skill DMG Boost",
    labelByClass: { bellstrikeSplendor: "Nameless Spear Special Skill DMG Boost" },
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.spearSpecial",
    affectsTag: "attune:spearSpecial",
  },
] as const satisfies readonly AttunementOption[]
