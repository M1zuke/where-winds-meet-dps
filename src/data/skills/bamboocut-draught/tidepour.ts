import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

const bolt = (index: number, launchFrame: number) =>
  hit(index, {
    frame: launchFrame,
    physMultiplier: 0.36636,
    attributeMultiplier: 0.54954,
    physFixed: 102,
    attributeFixed: 55.5,
    projectile: { speedMetersPerSecond: 32, maxTravelFrames: 24 },
  })

// In-game values as of 2026-10-06. Castable within 1.1 s of Realmplay with
// Binge Points above 49.99. Both bolts fly at 32 m/s for up to 0.4 s. Cast
// length to the earliest next input and launch frames: in-game animation,
// 2026-10-06.
export const tidepour = defineSkill({
  id: SKILL.tidepour,
  classId: "bamboocutDraught",
  name: "Twinblade Heavy Attack - Tidepour",
  breakdownName: "Tidepour",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.tidepour,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  castConditions: [{ buffId: STATUS.bingePoints, op: "gt", stacks: 49 }],
  triggerable: false,
  castFrames: 42,
  reachMeters: 4,
  hits: [bolt(0, 10), bolt(1, 24)],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
