// Ranges are the breakthrough-16 gear-tier rolls (in-game, 2026-07-24).
import type { AttunementOption } from "../../engine/attunements"
import { GENERAL_SLOTS } from "./attunementSlots"
import { BELLSTRIKE_UMBRA_ATTUNEMENTS } from "./bellstrike-umbra/attunements"
import { STONESPLIT_STRENGTH_ATTUNEMENTS } from "./stonesplit-strength/attunements"

const EVERY_CLASS_OPTIONS: readonly AttunementOption[] = [
  {
    id: "physPen",
    label: "Physical Penetration",
    min: 0.066,
    max: 0.11,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: "phys.penetration",
  },
  {
    id: "formlessPen",
    label: "Formless Penetration",
    min: 0.078,
    max: 0.13,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: "primaryAttr.penetration",
  },
  {
    id: "physResist",
    label: "Physical Resistance",
    min: 0.066,
    max: 0.11,
    slots: GENERAL_SLOTS,
    classIds: null,
    enginePath: null,
    hint: "(defense only)",
  },
]

export const ATTUNEMENT_OPTIONS: readonly AttunementOption[] = [
  ...EVERY_CLASS_OPTIONS,
  ...BELLSTRIKE_UMBRA_ATTUNEMENTS,
  ...STONESPLIT_STRENGTH_ATTUNEMENTS,
]
