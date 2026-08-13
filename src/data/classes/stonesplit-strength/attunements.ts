// Ranges are the breakthrough-16 gear-tier rolls (in-game Attune Effect list,
// 2026-08-13).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const STONESPLIT_STRENGTH_ATTUNEMENTS = [
  {
    id: "phalanxChargeDamage",
    label: "Phalanx Charge Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.Phalanx Charge Boost",
    affectsTag: "attune:phalanxbaneCharged",
  },
  {
    id: "phalanxbaneQ",
    label: "Phalanx Martial Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.Phalanx Martial Boost",
    affectsTag: "attune:phalanxbaneQ",
  },
  {
    id: "snowpartingQ",
    label: "Snowparting Martial Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.Snowparting Martial Boost",
    affectsTag: "attune:snowpartingQ",
  },
  {
    id: "snowpartingCharged",
    label: "Snowparting Charge Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.Snowparting Charge Boost",
    affectsTag: "attune:snowpartingCharged",
  },
  {
    id: "snowpartingVariedCombo",
    label: "Snowparting Varied Combo Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "classSpecificAttunement.Snowparting Varied Combo Boost",
    affectsTag: "attune:snowpartingVariedCombo",
  },
] as const satisfies readonly AttunementOption[]
