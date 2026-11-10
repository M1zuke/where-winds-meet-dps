import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-11-10: the rise is the only hit of Apricot Heaven
// tagged as a trajectory hit, so the umbrella talent, Jadebreak, Combo, Spring
// Thunder and the critical damage talent reach it and not the falls. It is
// summoned by the cast at its own frame.
export const apricotHeavenRise = defineSkill({
  id: SKILL.apricotHeavenRise,
  classId: "silkbindJade",
  name: "Apricot Heaven (Rise)",
  breakdownName: "Apricot Heaven",
  tags: [PROP.isCharged, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.apricotHeavenRise,
  receives: [
    BUFF.pursuitChargedBoost,
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.combo,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.626038,
      attributeMultiplier: 0.939057,
      physFixed: 173.2,
      attributeFixed: 94.4,
      extraCritDamage: 1,
    }),
  ],
  createdAt: "2026-11-10T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
