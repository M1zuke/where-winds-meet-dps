// Labels are the official English Attune Effect names; ranges are the
// gear-level ladder's skill-boost rows (in-game values as of 2026-10-12).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"
import { ATTUNE } from "../../skills/ids"

const SKILL_BOOST_MIN = { 86: 0.026, 91: 0.03, 96: 0.036, 100: 0.042, 105: 0.048 }
const SKILL_BOOST_MAX = { 86: 0.043, 91: 0.05, 96: 0.06, 100: 0.07, 105: 0.08 }

export const BAMBOOCUT_DUST_ATTUNEMENTS = [
  {
    id: "everspringMartialArt",
    label: "Everspring Umbrella - Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDust"],
    enginePath: "classSpecificAttunement.everspringMartialArt",
    affectsTag: ATTUNE.everspringMartialArt,
  },
  {
    id: "everspringSpecial",
    label: "Everspring Umbrella - Special Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDust"],
    enginePath: "classSpecificAttunement.everspringSpecial",
    affectsTag: ATTUNE.everspringSpecial,
  },
  {
    id: "unfetteredMartialArt",
    label: "Unfettered Rope Dart - Martial Art Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDust"],
    enginePath: "classSpecificAttunement.unfetteredMartialArt",
    affectsTag: ATTUNE.unfetteredMartialArt,
  },
  {
    id: "unfetteredCharged",
    label: "Unfettered Rope Dart - Charged Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDust"],
    enginePath: "classSpecificAttunement.unfetteredCharged",
    affectsTag: ATTUNE.unfetteredCharged,
  },
  {
    id: "unfetteredSpecial",
    label: "Unfettered Rope Dart - Special Skill DMG Boost",
    min: SKILL_BOOST_MIN,
    max: SKILL_BOOST_MAX,
    slots: ARMOR_SLOTS,
    classIds: ["bamboocutDust"],
    enginePath: "classSpecificAttunement.unfetteredSpecial",
    affectsTag: ATTUNE.unfetteredSpecial,
  },
] as const satisfies readonly AttunementOption[]
