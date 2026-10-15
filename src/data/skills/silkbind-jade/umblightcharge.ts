import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import {
  SPRING_AWAY_BULLET,
  SPRING_AWAY_BULLET_LAUNCH_FRAMES,
  SPRING_AWAY_BULLET_PROJECTILE,
  SPRING_AWAY_RECEIVES,
  SPRING_AWAY_TAGS,
  springAwayHoverDrain,
  springAwayHoverSeconds,
  springAwayReleaseFrames,
} from "./springAway"

const BULLET_COUNT = 6

export const umblightcharge = defineSkill({
  id: SKILL.umblightcharge,
  classId: "silkbindJade",
  name: "UmbLightCharge",
  tags: SPRING_AWAY_TAGS,
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbLightCharge,
  receives: SPRING_AWAY_RECEIVES,
  castFrames: springAwayReleaseFrames(BULLET_COUNT),
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  meterDrains: springAwayHoverDrain(springAwayHoverSeconds(BULLET_COUNT)),
  hits: SPRING_AWAY_BULLET_LAUNCH_FRAMES.slice(0, BULLET_COUNT).map((frame, index) =>
    hit(index, {
      frame,
      ...SPRING_AWAY_BULLET,
      projectile: SPRING_AWAY_BULLET_PROJECTILE,
      ...(index === 0 ? { triggers: [castSkill({ target: SKILL.umblightchargeLift })] } : {}),
    }),
  ),
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
