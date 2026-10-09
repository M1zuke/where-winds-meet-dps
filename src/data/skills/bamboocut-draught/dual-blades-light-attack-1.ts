import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

// In-game values as of 2026-09-24, level 100: stage 1 of the 4-stage twin
// blade light-attack chain, one hit, ratio 1.0.
export const dualBladesLightAttack1 = defineSkill({
  id: SKILL.dualBladesLightAttack1,
  classId: "bamboocutDraught",
  name: "Dual Blades - Light Attack (1st Stage)",
  breakdownName: "Dual Blades - Light Attack",
  tags: [WEAPON.twinBlades, ATTUNE.twinbladesLightAttack],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.dualBladesLightAttack1,
  receives: [
    BUFF.nonPlayerBaseDamage10,
    BUFF.swallowcallLightAttackBoost,
    ...CLASS_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
  ],
  castFrames: 26,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — no approach field found.
  startLatency: "noWaitOnDummy",
  hits: [
    hit(0, {
      frame: 20,
      physMultiplier: 0.42049,
      attributeMultiplier: 0.630735,
      physFixed: 117,
      attributeFixed: 64,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
