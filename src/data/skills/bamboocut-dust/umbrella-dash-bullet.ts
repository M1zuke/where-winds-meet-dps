import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { meterDelta } from "../../../definitions/skills/triggers"
import { fadingCrimsonMeter } from "../../classes/bamboocut-dust/meters"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"
import { LIGHT_ATTACK_SHORT_HIT } from "./umbrella-light-attack"

const FADING_CRIMSON_PER_BULLET = 4

export const umbrellaDashBullet = defineSkill({
  id: SKILL.umbrellaDashBullet,
  classId: "bamboocutDust",
  name: "Umbrella - Dash (Projectile)",
  breakdownName: "Umbrella - Dash",
  tags: [WEAPON.umbrella, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustUmbrellaDashBullet,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      ...LIGHT_ATTACK_SHORT_HIT,
      projectile: { speedMetersPerSecond: 30, maxTravelFrames: 120 },
      triggers: [meterDelta({ target: fadingCrimsonMeter.id, stacks: FADING_CRIMSON_PER_BULLET })],
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
