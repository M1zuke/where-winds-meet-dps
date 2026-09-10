// Labels are the official English Attune Effect name (in-game re-attuning
// preview, 2026-08-17; the two Vernal Umbrella affixes from the patch 2.1 note,
// 2026-08-20). Ranges are the gear-level ladder's matching rows (2026-09-07).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }
const VERNAL_UMBRELLA_MIN = { 96: 0.036, 100: 0.042, 105: 0.048 }
const VERNAL_UMBRELLA_MAX = { 96: 0.06, 100: 0.07, 105: 0.08 }
// Its last rollable tier is gear level 81.
const BELOW_MODELLED_LEVELS = {}

export const SILKBIND_JADE_ATTUNEMENTS = [
  {
    id: "umbQ",
    label: "Vernal Umbrella Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbQ",
    affectsTag: "attune:umbQ",
  },
  {
    id: "umbFrequentProjectile",
    label: "Vernal Umbrella Frequent Projectile DMG Boost",
    min: VERNAL_UMBRELLA_MIN,
    max: VERNAL_UMBRELLA_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbFrequentProjectile",
    affectsTag: "attune:umbFrequentProjectile",
  },
  {
    id: "umbLightHeavyVariedCombo",
    label: "Vernal Umbrella Light/Heavy Attack & Varied Combo DMG Boost",
    min: VERNAL_UMBRELLA_MIN,
    max: VERNAL_UMBRELLA_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbLightHeavyVariedCombo",
    affectsTag: "attune:umbLightHeavyVariedCombo",
  },
  {
    id: "fanQ",
    label: "Inkwell Fan Martial Art Skill DMG Boost",
    min: BELOW_MODELLED_LEVELS,
    max: BELOW_MODELLED_LEVELS,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanQ",
    affectsTag: "attune:fanQ",
  },
  {
    id: "fanCharged",
    label: "Inkwell Fan Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanCharged",
    affectsTag: "attune:fanCharged",
  },
  {
    id: "fanSpecial",
    label: "Inkwell Fan - Special and Pursuit Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanSpecial",
    affectsTag: "attune:fanSpecial",
  },
] as const satisfies readonly AttunementOption[]
