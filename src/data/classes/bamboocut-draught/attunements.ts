// Labels from the in-game re-attuning preview (2026-09-03). Ranges are the
// gear-level ladder's skill-boost rows (in-game, 2026-09-07).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"
import { ATTUNE } from "../../skills/ids"

const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }

export const BAMBOOCUT_DRAUGHT_ATTUNEMENTS = [
  {
    id: "gauntletsMartialArt",
    label: "Skystrike Gauntlets - Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.gauntletsMartialArt",
    affectsTag: ATTUNE.gauntletsMartialArt,
  },
  {
    id: "gauntletsSpecial",
    label: "Skystrike Gauntlets - Special Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.gauntletsSpecial",
    affectsTag: ATTUNE.gauntletsSpecial,
  },
  {
    id: "twinbladesMartialArt",
    label: "Riven Twinblades - Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.twinbladesMartialArt",
    affectsTag: ATTUNE.twinbladesMartialArt,
  },
  {
    id: "twinbladesLightAttack",
    label: "Riven Twinblades - Light Attack DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.twinbladesLightAttack",
    affectsTag: ATTUNE.twinbladesLightAttack,
  },
  {
    id: "driftcleaveDeepdaze",
    label: "Driftcleave - Deepdaze Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDraught"],
    enginePath: "classSpecificAttunement.driftcleaveDeepdaze",
    affectsTag: ATTUNE.driftcleaveDeepdaze,
  },
] as const satisfies readonly AttunementOption[]
