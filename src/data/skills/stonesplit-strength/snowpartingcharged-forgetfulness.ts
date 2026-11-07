import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, clearStatus, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { bladeMomentumMeter } from "../../classes/stonesplit-strength/bladeMomentumMeter"

const GRAVE_FROST_HIT = meterDelta({ target: bladeMomentumMeter.id, stacks: 3.25 })

const STRIKE = {
  physMultiplier: 0.489916,
  attributeMultiplier: 0.734874,
  physFixed: 135.6,
  attributeFixed: 73.8,
}

// In-game values as of 2026-10-15: the press resolves here while Forgetfulness
// is up and off cooldown, and skips the hold.
export const snowpartingchargedForgetfulness = defineSkill({
  id: SKILL.snowpartingchargedForgetfulness,
  classId: "stonesplitStrength",
  name: "SnowpartingCharged[Forgetfulness]",
  tags: [PROP.isCharged, WEAPON.hengBlade, ATTACK.charge, ATTUNE.snowpartingCharged],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingChargedForgetfulness,
  castConditions: [
    { buffId: BUFF.forgetfulness, op: "gte", stacks: 1 },
    { buffId: BUFF.forgetfulnessCooldown, op: "eq", stacks: 0 },
  ],
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 57,
  triggerable: true,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({
          target: BUFF.forgetfulnessCooldown,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
        clearStatus({
          target: BUFF.forgetfulness,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
        clearStatus({
          target: BUFF.snowbreakSpringCooldown,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
      ],
    }),
    hit(1, { frame: 11, ...STRIKE, triggers: [GRAVE_FROST_HIT] }),
    hit(2, { frame: 24, ...STRIKE, triggers: [GRAVE_FROST_HIT] }),
    hit(3, { frame: 31, ...STRIKE, triggers: [GRAVE_FROST_HIT] }),
    hit(4, {
      frame: 44,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({
          target: BUFF.snowbreakSpringAvailable,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 3,
        }),
      ],
    }),
    hit(5, {
      frame: 57,
      physMultiplier: 0.979832,
      attributeMultiplier: 1.469748,
      physFixed: 271.2,
      attributeFixed: 147.6,
      triggers: [GRAVE_FROST_HIT],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
