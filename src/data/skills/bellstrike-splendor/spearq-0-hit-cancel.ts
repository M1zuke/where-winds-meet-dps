import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { QIANKUNS_LOCK_GAIN, MOUNTAINS_MIGHT_GAIN } from "./buffs/qiankunsLockEnduranceGains"
import {
  endlessGaleAtStartGrant,
  endlessGaleGrant,
  endlessGaleMountainsMightExtend,
  endlessGaleCostReductionEndTrigger,
} from "./buffs/endlessGaleCostReductionGrant"
import { qiankunsLockQiImbalanceMarkerGrant } from "./buffs/qiImbalanceMarkerGrant"

export const spearq0HitCancel = defineSkill({
  id: SKILL.spearq0HitCancel,
  classId: "bellstrikeSplendor",
  name: "SpearQ 0-Hit Cancel",
  breakdownName: "Qiankun's Lock (0-hit cancel)",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ0HitCancel,
  cancelledBy: "deflectCancel",
  triggersBuffs: [BUFF.jadeware, BUFF.mountainsMight, BUFF.qiImbalance],
  receives: [BUFF.starweaveMartialBoost, ...NAMELESS_SPEAR_RECEIVES],
  castFrames: 6,
  triggerable: true,
  // In-game values as of 2026-09-28: 5 m approach reach; once between 1.5
  // and 4.5 m the cast's own segment teleports 1.5 m behind the target,
  // otherwise no further scripted motion.
  reachMeters: 5,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 1.5, maxMeters: 4.5, then: { kind: "toTarget", meters: 1.5 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 0 },
  },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        QIANKUNS_LOCK_GAIN,
        MOUNTAINS_MIGHT_GAIN,
        endlessGaleAtStartGrant,
        endlessGaleGrant,
        endlessGaleMountainsMightExtend,
        endlessGaleCostReductionEndTrigger,
        qiankunsLockQiImbalanceMarkerGrant,
      ],
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
