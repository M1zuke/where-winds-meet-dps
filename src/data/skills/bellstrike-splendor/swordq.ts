import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { mountainsMightQiImbalanceMarkerGrant } from "./buffs/qiImbalanceMarkerGrant"

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
  startLatency: "noWaitOnDummy",
  triggersBuffs: [BUFF.jadeware, BUFF.mountainsMightQiImbalance],
  receives: NAMELESS_SWORD_RECEIVES,
  castFrames: 26,
  triggerable: true,
  // In-game values as of 2026-09-28: 12 m approach reach — a companion
  // projectile rides the swing 1 m further (13 m), not modelled separately.
  reachMeters: 12,
  hits: [
    hit(0, {
      // In-game values as of 2026-09-24: the flying sword launches at
      // 17.58 f and lands after its own flight time, ≈ 22 f at melee range.
      frame: 22,
      physMultiplier: 1.0253,
      attributeMultiplier: 1.538,
      physFixed: 283.6,
      attributeFixed: 154.6,
      triggers: [mountainsMightQiImbalanceMarkerGrant],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
