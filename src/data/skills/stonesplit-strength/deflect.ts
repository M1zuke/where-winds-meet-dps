import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"

export const deflect = defineSkill({
  id: SKILL.deflect,
  classId: "stonesplitStrength",
  name: "Deflect",
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Stonesplit",
  castTag: CAST.deflect,
  triggersBuffs: [BUFF.cleftpeakDeflectGrant],
  // Cast length to the earliest next input with Snowparting Blade drawn: the
  // player deflects with that art equipped in every rotation this app
  // carries (in-game animation, 2026-09-24).
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
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
