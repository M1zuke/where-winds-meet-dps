// Ranges are the breakthrough-16 gear-tier rolls, and labels the official
// English Attune Effect names (in-game Attune Effect list, 2026-08-13).
// `phalanxChargeDamage` is the exception: no official English string for it has
// been captured, so its label is composed, not cited.
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const STONESPLIT_STRENGTH_ATTUNEMENTS = [
  {
    id: "phalanxChargeDamage",
    label: "Phalanxbane Blade - Charged Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.phalanxChargeDamage",
    affectsTag: "attune:phalanxbaneCharged",
  },
  {
    id: "phalanxbaneQ",
    label: "Phalanxbane Blade - Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.phalanxbaneQ",
    affectsTag: "attune:phalanxbaneQ",
  },
  {
    id: "snowpartingQ",
    label: "Snowparting Blade - Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.snowpartingQ",
    affectsTag: "attune:snowpartingQ",
  },
  {
    id: "snowpartingCharged",
    label: "Snowparting Blade - Charged Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.snowpartingCharged",
    affectsTag: "attune:snowpartingCharged",
  },
  {
    id: "snowpartingVariedCombo",
    label: "Snowparting Blade - Light/Heavy Attack Varied Combo DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.snowpartingVariedCombo",
    affectsTag: "attune:snowpartingVariedCombo",
  },
] as const satisfies readonly AttunementOption[]
