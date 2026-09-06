// Ranges and labels from the in-game re-attuning preview (2026-09-03).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"
import { ATTUNE } from "../../skills/ids"

export const BAMBOOCUT_DRAUGHT_ATTUNEMENTS = [
  {
    id: "gauntletsMartialArt",
    label: "Skystrike Gauntlets - Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.gauntletsMartialArt",
    affectsTag: ATTUNE.gauntletsMartialArt,
  },
  {
    id: "gauntletsSpecial",
    label: "Skystrike Gauntlets - Special Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.gauntletsSpecial",
    affectsTag: ATTUNE.gauntletsSpecial,
  },
  {
    id: "twinbladesMartialArt",
    label: "Riven Twinblades - Martial Art Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.twinbladesMartialArt",
    affectsTag: ATTUNE.twinbladesMartialArt,
  },
  {
    id: "twinbladesLightAttack",
    label: "Riven Twinblades - Light Attack DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.twinbladesLightAttack",
    affectsTag: ATTUNE.twinbladesLightAttack,
  },
  {
    id: "driftcleaveDeepdaze",
    label: "Driftcleave - Deepdaze Skill DMG Boost",
    min: 0.036,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.driftcleaveDeepdaze",
    affectsTag: ATTUNE.driftcleaveDeepdaze,
  },
] as const satisfies readonly AttunementOption[]
