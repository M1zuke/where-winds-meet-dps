// Ranges are the breakthrough-16 gear-tier rolls (in-game, 2026-07-24).
import type { AttunementOption } from "../../../engine/attunements"
import { ARMOR_SLOTS } from "../attunementSlots"

export const BELLSTRIKE_UMBRA_ATTUNEMENTS: readonly AttunementOption[] = [
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
]
