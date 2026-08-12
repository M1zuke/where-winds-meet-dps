// Gear attunement options. Per-class data, so it lives here rather than in the
// engine: adding a class means adding rows, never editing engine code.
//
// Ranges are the breakthrough-16 gear-tier rolls (in-game, 2026-07-24).
import type { GearSlot } from "../../engine/types"
import type { AttunementOption } from "../../engine/attunements"

const GENERAL_SLOTS: readonly GearSlot[] = ["leftWeapon", "rightWeapon", "disc", "pendant"]
const ARMOR_SLOTS: readonly GearSlot[] = ["helm", "armor", "greaves", "bracer"]

export const ATTUNEMENT_OPTIONS: readonly AttunementOption[] = [
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
  {
    id: "bleedingDamage",
    label: "Bleed Boost",
    min: 0.03,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["bellstrikeUmbra"],
    enginePath: "dingYinByTag.Bleed Boost",
    affectsTag: "attune:bleed",
  },
  {
    id: "phalanxChargeDamage",
    label: "Phalanx Charge Boost",
    min: 0.03,
    max: 0.06,
    slots: ARMOR_SLOTS,
    classIds: ["stonesplitStrength"],
    enginePath: "dingYinByTag.Phalanx Charge Boost",
    affectsTag: "attune:phalanxbaneCharged",
  },
]
