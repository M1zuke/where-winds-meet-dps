import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { meterDelta } from "../../../definitions/skills/triggers"
import { fadingCrimsonMeter } from "../../classes/bamboocut-dust/meters"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"
import { LIGHT_ATTACK_SHORT_HIT } from "./umbrella-light-attack"

const FADING_CRIMSON_PER_LIFT = 4

export const springAwayLift = defineSkill({
  id: SKILL.springAwayLift,
  classId: "bamboocutDust",
  name: "Spring Away (Lift)",
  breakdownName: "Spring Away",
  tags: [WEAPON.umbrella, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustSpringAwayLift,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      ...LIGHT_ATTACK_SHORT_HIT,
      triggers: [meterDelta({ target: fadingCrimsonMeter.id, stacks: FADING_CRIMSON_PER_LIFT })],
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
