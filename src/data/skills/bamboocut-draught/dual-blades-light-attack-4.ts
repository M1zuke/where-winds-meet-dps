import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

const COEFFICIENTS = {
  physMultiplier: 0.254095,
  attributeMultiplier: 0.3811425,
  physFixed: 71,
  attributeFixed: 38.5,
}

// In-game values as of 2026-09-24, level 100: stage 4 of the 4-stage twin
// blade light-attack chain, two hits of 0.5 each landing on the same frame.
export const dualBladesLightAttack4 = defineSkill({
  id: SKILL.dualBladesLightAttack4,
  classId: "bamboocutDraught",
  name: "Dual Blades - Light Attack (4th Stage)",
  breakdownName: "Dual Blades - Light Attack",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesLightAttack],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.dualBladesLightAttack4,
  receives: [
    BUFF.nonPlayerBaseDamage10,
    BUFF.swallowcallLightAttackBoost,
    ...CLASS_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
  ],
  castFrames: 32,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — no approach field found.
  startLatency: "noWaitOnDummy",
  hits: [hit(0, { frame: 10, ...COEFFICIENTS }), hit(1, { frame: 10, ...COEFFICIENTS })],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
