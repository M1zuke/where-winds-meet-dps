import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import { BUFF } from "../buffs/ids"
import { drawnWeaponStatusId } from "../../../engine/weaponSwap"

// Cast length to the earliest next input with Snowparting Blade drawn
// (in-game animation, 2026-09-24); the Mo Blade drawn reads 3.06 f longer
// (in-game values as of 2026-09-28), the variant below.
export const deflectCancel = defineSkill({
  id: SKILL.deflectCancel,
  classId: "stonesplitStrength",
  name: "Deflect Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.deflectCancel,
  castFrames: 15,
  triggerable: true,
  // In-game values as of 2026-09-28: no approach, confirmed — a large reach
  // keeps this stationary, non-damaging cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      variants: [
        {
          id: "hv-deflect-cancel-hit-0-mo-blade-drawn",
          label: "Mo Blade Drawn",
          conditions: [{ buffId: drawnWeaponStatusId("Mo Blade"), op: "gte", stacks: 1 }],
          physMultiplier: 0,
          attributeMultiplier: 0,
          physFixed: 0,
          attributeFixed: 0,
          castFrames: 18,
        },
      ],
    }),
  ],
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
