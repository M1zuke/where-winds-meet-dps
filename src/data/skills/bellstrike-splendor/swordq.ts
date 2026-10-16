import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { mountainsMightQiImbalanceMarkerGrant } from "./buffs/qiImbalanceMarkerGrant"
import { energySurgeCutHit } from "./energySurgeCut"
import { DAUNTING_STRIKE_PROJECTILE } from "./flyingSwordProjectiles"

export const swordq = defineSkill({
  id: SKILL.swordq,
  classId: "bellstrikeSplendor",
  name: "SwordQ",
  breakdownName: "Daunting Strike",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordQ,
  triggersBuffs: [BUFF.jadeware],
  receives: [
    BUFF.starweaveMartialBoost,
    BUFF.mountainsMightQiImbalance,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  // In-game values as of 2026-10-15: the cast runs to its 54.71 f post-move
  // frame; Energy Surge or a Deflect may cut it from the frame after the
  // flying sword launches, and the launched sword still lands.
  castFrames: 54.71,
  triggerable: true,
  // In-game values as of 2026-09-28: 12 m approach reach — a companion
  // projectile rides the swing 1 m further (13 m), not modelled separately.
  reachMeters: 12,
  hits: [
    hit(0, {
      // In-game values as of 2026-10-15: the flying sword launches at 17.58 f.
      frame: 17.58,
      projectile: DAUNTING_STRIKE_PROJECTILE,
      physMultiplier: 1.0253,
      attributeMultiplier: 1.538,
      physFixed: 283.6,
      attributeFixed: 154.6,
      triggers: [mountainsMightQiImbalanceMarkerGrant],
    }),
    energySurgeCutHit(1, 17.58, 18.58),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
