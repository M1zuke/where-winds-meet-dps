// Labels are the official English Attune Effect names (in-game Attune Effect
// list, 2026-08-13). `phalanxChargeDamage` is the exception: no official
// English string for it has been captured, so its label is composed, not
// cited. Ranges are the gear-level ladder's matching rows (2026-09-07).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }

export const STONESPLIT_STRENGTH_ATTUNEMENTS = [
  {
    id: "phalanxChargeDamage",
    label: "Phalanxbane Blade - Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.phalanxChargeDamage",
    affectsTag: "attune:phalanxbaneCharged",
  },
  {
    id: "phalanxbaneQ",
    label: "Phalanxbane Blade - Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.phalanxbaneQ",
    affectsTag: "attune:phalanxbaneQ",
  },
  {
    id: "snowpartingQ",
    label: "Snowparting Blade - Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.snowpartingQ",
    affectsTag: "attune:snowpartingQ",
  },
  {
    id: "snowpartingCharged",
    label: "Snowparting Blade - Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.snowpartingCharged",
    affectsTag: "attune:snowpartingCharged",
  },
  {
    id: "snowpartingVariedCombo",
    label: "Snowparting Blade - Light/Heavy Attack Varied Combo DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.snowpartingVariedCombo",
    affectsTag: "attune:snowpartingVariedCombo",
  },
] as const satisfies readonly AttunementOption[]
