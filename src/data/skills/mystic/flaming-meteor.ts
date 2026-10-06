import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL } from "./ids"

// In-game values as of 2026-10-05, level 71: power 11.01916, flat 1660.42,
// split across three hits — stomp 0.25, blade explosion 0.55, crash
// 0.385 (a lone target in the landing area counts as one unit). The defensive self-buff (damage reduction, Super Armor, exhaustion
// immunity) has no dummy-facing DPS effect and is not modelled.
const POWER = 11.01916
const FLAT = 1660.42
const STOMP_RATIO = 0.25
const EXPLOSION_RATIO = 0.55
const CRASH_RATIO = 0.385

const row = (ratio: number) => ({
  physMultiplier: POWER * ratio,
  attributeMultiplier: POWER * ratio * 1.5,
  physFixed: FLAT * ratio,
  attributeFixed: 0,
})

export const flamingMeteor = defineSkill({
  id: SKILL.flamingMeteor,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Flaming Meteor",
  tags: [MYSTIC.area],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.flamingMeteor,
  castFrames: 612,
  triggerable: true,
  // In-game values as of 2026-09-24: a stationary cast, 40 m engagement range.
  reachMeters: 40,
  approach: "stationary",
  hits: [
    hit(0, { frame: 198, ...row(STOMP_RATIO) }),
    // The blade explosion is a thrown, target-locked hit: it launches at
    // frame 310 and lands only once it reaches the target, at a constant
    // 75 m/s, capped at its own 4 s bullet lifetime (240 frames).
    hit(1, {
      frame: 310,
      ...row(EXPLOSION_RATIO),
      projectile: { speedMetersPerSecond: 75, maxTravelFrames: 240 },
    }),
    hit(2, { frame: 505, ...row(CRASH_RATIO) }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
