import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { CYCLONE_WALTZ_HIT } from "./cyclone-waltz"
import { SKILL, STATUS } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-10-13.
export const cycloneWaltzRecast = defineSkill({
  id: SKILL.cycloneWaltzRecast,
  classId: "bamboocutDust",
  name: "Cyclone Waltz (Recast)",
  breakdownName: "Cyclone Waltz",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustCycloneWaltzRecast,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castConditions: [{ buffId: STATUS.cycloneAwareness, op: "gte", stacks: 1 }],
  castFrames: 39,
  triggerable: false,
  reachMeters: 5,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      conditions: [{ buffId: STATUS.phantomUmbrella, op: "gte", stacks: 1 }],
      triggers: [applyBuff({ target: STATUS.phantomUmbrella })],
    }),
    hit(1, { frame: 14, ...CYCLONE_WALTZ_HIT }),
  ],
  createdAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
})
