// Ranges are the breakthrough-16 gear-tier rolls, and labels the official
// English Attune Effect names (in-game Attune Effect list, 2026-08-13).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const SILKBIND_JADE_ATTUNEMENTS = [
  {
    id: "fanQ",
    label: "Silkbind Fan - Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanQ",
    affectsTag: "attune:fanQ",
  },
  {
    id: "fanCharged",
    label: "Silkbind Fan - Charged Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanCharged",
    affectsTag: "attune:fanCharged",
  },
  {
    id: "fanSpecial",
    label: "Silkbind Fan - Special Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.fanSpecial",
    affectsTag: "attune:fanSpecial",
  },
  {
    id: "umbQ",
    label: "Silkbind Umbrella - Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbQ",
    affectsTag: "attune:umbQ",
  },
  {
    id: "umbCharged",
    label: "Silkbind Umbrella - Charged Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["silkbindJade"],
    enginePath: "classSpecificAttunement.umbCharged",
    affectsTag: "attune:umbCharged",
  },
] as const satisfies readonly AttunementOption[]
