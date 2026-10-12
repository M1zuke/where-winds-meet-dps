import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { UMBRELLA_LIGHT_CHAIN_RECEIVES } from "./receives"

export const LIGHT_ATTACK_SHORT_HIT = {
  physMultiplier: 0.304656,
  attributeMultiplier: 0.456984,
  physFixed: 84.4,
  attributeFixed: 46,
}

const LIGHT_ATTACK_LONG_HIT = {
  physMultiplier: 0.38082,
  attributeMultiplier: 0.57123,
  physFixed: 105.5,
  attributeFixed: 57.5,
}

const LIGHT_ATTACK_FINISH_HIT = {
  physMultiplier: 0.533148,
  attributeMultiplier: 0.799722,
  physFixed: 147.7,
  attributeFixed: 80.5,
}

// In-game values as of 2026-10-12: the three stages pressed at each stage's
// earliest next input, every stage hit on its melee collider. A swing's
// projectile shares one damage slot with its melee hit and grants Fading
// Crimson without a locked target only, so it is not modelled.
export const umbrellaLightAttack = defineSkill({
  id: SKILL.umbrellaLightAttack,
  classId: "bamboocutDust",
  name: "Umbrella - Light Attack (3-stage)",
  breakdownName: "Umbrella - Light Attack",
  tags: [WEAPON.umbrella, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustUmbrellaLightAttack,
  receives: UMBRELLA_LIGHT_CHAIN_RECEIVES,
  castFrames: 127,
  triggerable: false,
  hits: [
    hit(0, { frame: 1, ...LIGHT_ATTACK_SHORT_HIT }),
    hit(1, { frame: 29, ...LIGHT_ATTACK_SHORT_HIT }),
    hit(2, { frame: 67, ...LIGHT_ATTACK_LONG_HIT }),
    hit(3, { frame: 105, ...LIGHT_ATTACK_FINISH_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
