// Official English Attune Effect names and ranges, in-game as of 2026-11-11.
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }

export const BELLSTRIKE_SPLENDOR_ATTUNEMENTS = [
  {
    id: "namelessSwordQ",
    label: "Nameless Sword Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.namelessSwordQ",
    affectsTag: "attune:namelessSwordQ",
  },
  {
    id: "swordCharged",
    label: "Nameless Sword Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.swordCharged",
    affectsTag: "attune:swordCharged",
  },
  {
    id: "namelessSwordSpecial",
    label: "Nameless Sword Special Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.namelessSwordSpecial",
    affectsTag: "attune:namelessSwordSpecial",
  },
  {
    id: "namelessSpearCharged",
    label: "Nameless Spear Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.namelessSpearCharged",
    affectsTag: "attune:namelessSpearCharged",
  },
  {
    id: "spearSpecial",
    label: "Nameless Spear Special Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeSplendor"],
    enginePath: "classSpecificAttunement.spearSpecial",
    affectsTag: "attune:spearSpecial",
  },
] as const satisfies readonly AttunementOption[]
