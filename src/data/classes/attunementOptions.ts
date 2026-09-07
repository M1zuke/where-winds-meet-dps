import type { AttunementOption } from "../../engine/attunements"
import { GENERAL_SLOTS } from "./attunementSlots"
import { BELLSTRIKE_UMBRA_ATTUNEMENTS } from "./bellstrike-umbra/attunements"
import { SILKBIND_JADE_ATTUNEMENTS } from "./silkbind-jade/attunements"
import { STONESPLIT_STRENGTH_ATTUNEMENTS } from "./stonesplit-strength/attunements"
import { WEAPON_ART_ATTUNEMENTS } from "./weaponArtAttunements"

// Gear-level ladder, penetration lines (in-game, 2026-09-07). The ladder holds
// the percentage number; the app stores a fraction, so every value is ÷100.
const PHYS_PEN_MIN = { 86: 0.047, 91: 0.054, 96: 0.066, 100: 0.077, 105: 0.088 }
const PHYS_PEN_MAX = { 86: 0.078, 91: 0.09, 96: 0.11, 100: 0.128, 105: 0.146 }
const FORMLESS_PEN_MIN = { 91: 0.065, 96: 0.078, 100: 0.091, 105: 0.104 }
const FORMLESS_PEN_MAX = { 91: 0.108, 96: 0.13, 100: 0.152, 105: 0.174 }

const EVERY_CLASS_OPTIONS = [
  {
    id: "physPen",
    label: "Physical Penetration",
    min: PHYS_PEN_MIN,
    max: PHYS_PEN_MAX,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: "phys.penetration",
  },
  {
    id: "formlessPen",
    label: "Formless Penetration",
    min: FORMLESS_PEN_MIN,
    max: FORMLESS_PEN_MAX,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: "primaryAttr.penetration",
  },
  {
    id: "physResist",
    label: "Physical Resistance",
    min: PHYS_PEN_MIN,
    max: PHYS_PEN_MAX,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: null,
    hint: "(defense only)",
  },
] as const satisfies readonly AttunementOption[]

export const ATTUNEMENT_OPTIONS = [
  ...EVERY_CLASS_OPTIONS,
  ...WEAPON_ART_ATTUNEMENTS,
  ...BELLSTRIKE_UMBRA_ATTUNEMENTS,
  ...STONESPLIT_STRENGTH_ATTUNEMENTS,
  ...SILKBIND_JADE_ATTUNEMENTS,
] as const satisfies readonly AttunementOption[]
