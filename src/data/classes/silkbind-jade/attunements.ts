// Ranges are the breakthrough-16 gear-tier rolls — every affix rolls the same
// range — and each label the official English Attune Effect name (in-game
// re-attuning preview, 2026-08-17; the two Vernal Umbrella affixes from the
// patch 2.1 note, 2026-08-20).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const SILKBIND_JADE_ATTUNEMENTS = [
  {
    id: "umbQ",
    label: "Vernal Umbrella Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbQ",
    affectsTag: "attune:umbQ",
  },
  {
    id: "umbFrequentProjectile",
    label: "Vernal Umbrella Frequent Projectile DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbFrequentProjectile",
    affectsTag: "attune:umbFrequentProjectile",
  },
  {
    id: "umbLightHeavyVariedCombo",
    label: "Vernal Umbrella Light/Heavy Attack & Varied Combo DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbLightHeavyVariedCombo",
    affectsTag: "attune:umbLightHeavyVariedCombo",
  },
  {
    id: "fanQ",
    label: "Inkwell Fan Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanQ",
    affectsTag: "attune:fanQ",
  },
  {
    id: "fanCharged",
    label: "Inkwell Fan Charged Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanCharged",
    affectsTag: "attune:fanCharged",
  },
  {
    id: "fanSpecial",
    label: "Inkwell Fan - Special and Pursuit Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanSpecial",
    affectsTag: "attune:fanSpecial",
  },
] as const satisfies readonly AttunementOption[]
