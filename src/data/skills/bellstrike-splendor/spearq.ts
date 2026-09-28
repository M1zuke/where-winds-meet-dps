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

export const spearq = defineSkill({
  id: SKILL.spearq,
  classId: "bellstrikeSplendor",
  name: "SpearQ",
  breakdownName: "Qiankun's Lock",
  tags: [WEAPON.spear, ATTUNE.spearQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearQ,
  triggersBuffs: [BUFF.jadeware, BUFF.mountainsMight, BUFF.qiImbalance],
  receives: NAMELESS_SPEAR_RECEIVES,
  castFrames: 42,
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
      // In-game values as of 2026-09-24: the launch frame (cast length
      // already matches).
      frame: 18,
      physMultiplier: 0.5732,
      attributeMultiplier: 0.8598,
      physFixed: 160,
      attributeFixed: 87,
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
