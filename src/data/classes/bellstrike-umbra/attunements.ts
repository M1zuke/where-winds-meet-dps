// Official English Attune Effect names and ranges, in-game as of 2026-11-11.
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }

export const BELLSTRIKE_UMBRA_ATTUNEMENTS = [
  {
    id: "bleedingDamage",
    label: "Strategic Sword - Bleeding DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.bleedingDamage",
    affectsTag: "attune:bleed",
  },
  {
    id: "swordQ",
    label: "Strategic Sword Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.swordQ",
    affectsTag: "attune:swordQ",
  },
  {
    id: "swordSpecial",
    label: "Strategic Sword Special Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.swordSpecial",
    affectsTag: "attune:swordSpecial",
  },
  {
    id: "spearQ",
    label: "Heavenquaker Spear Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.spearQ",
    affectsTag: "attune:spearQ",
  },
  {
    id: "spearCharged",
    label: "Heavenquaker Spear Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "classSpecificAttunement.spearCharged",
    affectsTag: "attune:spearCharged",
  },
] as const satisfies readonly AttunementOption[]
