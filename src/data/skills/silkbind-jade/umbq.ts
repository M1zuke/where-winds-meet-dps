import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// In-game values as of 2026-10-15: 50 m/s with no ramp, a 1 m collision box,
// lives 5 s.
const SPRING_SORROW_PROJECTILE = {
  speedMetersPerSecond: 50,
  contactAdvanceMeters: 0.5,
  maxTravelFrames: 300,
}

export const umbq = defineSkill({
  id: SKILL.umbq,
  classId: "silkbindJade",
  name: "UmbQ",
  tags: [
    PROP.isMartialSkillQ,
    PROP.hasQiBreakPhysPen,
    WEAPON.umbrella,
    ATTACK.light,
    ATTUNE.umbQ,
    ROLE.umbQ,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbQ,
  receives: [
    BUFF.combo,
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.starweaveMartialBoost,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  triggersBuffs: [
    BUFF.jadeware,
    BUFF.combo,
    BUFF.comboUmbLightBonus,
    BUFF.comboSpringAwayBonus,
    BUFF.springThunder,
  ],
  // Cast length to the earliest next input and the bullet's launch frame: the
  // slow clip below Blossom Barrage rank 3, the fast one from it (in-game
  // values as of 2026-10-15).
  castFrames: 87.5,
  triggerable: true,
  // In-game values as of 2026-09-28: 20 m approach reach — a companion
  // projectile rides the swing 30 m further (50 m), not modelled separately.
  // A further 1.75 m shrink-only pull once in range.
  reachMeters: 20,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 59.8,
      projectile: SPRING_SORROW_PROJECTILE,
      physMultiplier: 2.3397,
      attributeMultiplier: 3.5095,
      physFixed: 648,
      attributeFixed: 353,
      extraCritDamage: 1,
      variants: [
        {
          id: "hv-umbq-hit-0-fast-clip",
          label: "Blossom Barrage 3+",
          conditions: [{ param: PARAM.blossomBarrage, minTier: 3 }],
          physMultiplier: 2.3397,
          attributeMultiplier: 3.5095,
          physFixed: 648,
          attributeFixed: 353,
          frame: 46.08,
          castFrames: 67.31,
        },
      ],
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
