import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST } from "../ids"
import { SKILL } from "./ids"
import {
  SPRING_AWAY_BULLET,
  SPRING_AWAY_BULLET_SPACING_FRAMES,
  SPRING_AWAY_FIRST_BULLET_FRAME,
  SPRING_AWAY_RECEIVES,
  SPRING_AWAY_TAGS,
  springAwayHoverDrain,
} from "./springAway"

const BULLET_COUNT = 12

export const umblightcharge12 = defineSkill({
  id: SKILL.umblightcharge12,
  classId: "silkbindJade",
  name: "UmbLightCharge (12 bullets)",
  breakdownName: "UmbLightCharge",
  tags: SPRING_AWAY_TAGS,
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbLightCharge12,
  receives: SPRING_AWAY_RECEIVES,
  castFrames: 200,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  meterDrains: springAwayHoverDrain(2),
  hits: Array.from({ length: BULLET_COUNT }, (_, index) =>
    hit(index, {
      frame: SPRING_AWAY_FIRST_BULLET_FRAME + index * SPRING_AWAY_BULLET_SPACING_FRAMES,
      ...SPRING_AWAY_BULLET,
      ...(index === 0 ? { triggers: [castSkill({ target: SKILL.umblightchargeLift })] } : {}),
    }),
  ),
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
