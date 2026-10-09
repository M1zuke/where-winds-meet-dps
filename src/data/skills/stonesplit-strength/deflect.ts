import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { drawnWeaponStatusId } from "../../../engine/weaponSwap"

export const deflect = defineSkill({
  id: SKILL.deflect,
  classId: "stonesplitStrength",
  name: "Deflect",
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Stonesplit",
  castTag: CAST.deflect,
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  // Cast length to the earliest next input with Snowparting Blade drawn
  // (in-game animation, 2026-09-24); the Mo Blade drawn reads 3.06 f longer
  // (in-game values as of 2026-09-28), the variant below.
  castFrames: 15,
  triggerable: true,
  // In-game values as of 2026-09-28: no approach, confirmed — a large reach
  // keeps this stationary, non-damaging cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: BUFF.snowbreakSpringAvailable, requiresParam: PARAM.frostCladNight }),
      ],
      variants: [
        {
          id: "hv-deflect-hit-0-mo-blade-drawn",
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
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
