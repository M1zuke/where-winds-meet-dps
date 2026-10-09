import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { bladeMomentumMeter } from "../../classes/stonesplit-strength/bladeMomentumMeter"

// The Forgetfulness path skips the hold outright (in-game values as of
// 2026-09-25), so it grants Blade Momentum like every Grave Frost hit but
// costs no Endurance.
const GRAVE_FROST_HIT = meterDelta({ target: bladeMomentumMeter.id, stacks: 3.25 })

export const snowpartingchargedForgetfulness = defineSkill({
  id: SKILL.snowpartingchargedForgetfulness,
  classId: "stonesplitStrength",
  name: "SnowpartingCharged[Forgetfulness]",
  tags: [PROP.isCharged, WEAPON.hengBlade, ATTACK.charge, ATTUNE.snowpartingCharged],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingChargedForgetfulness,
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
      frame: 11,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.6,
      attributeFixed: 73.8,
      triggers: [
        applyBuff({
          target: BUFF.forgetfulnessCooldown,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
        GRAVE_FROST_HIT,
      ],
    }),
    hit(1, {
      frame: 24,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.6,
      attributeFixed: 73.8,
      triggers: [GRAVE_FROST_HIT],
    }),
    hit(2, {
      frame: 31,
      physMultiplier: 0.4899,
      attributeMultiplier: 0.734867,
      physFixed: 135.6,
      attributeFixed: 73.8,
      // In-game grant frame as of 2026-09-24: 43.64 f from the press, nearest this hit.
      triggers: [
        applyBuff({
          target: BUFF.snowbreakSpringAvailable,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 3,
        }),
        GRAVE_FROST_HIT,
      ],
    }),
    hit(3, {
      frame: 57,
      physMultiplier: 0.9798,
      attributeMultiplier: 1.4697,
      physFixed: 271.2,
      attributeFixed: 147.6,
      triggers: [GRAVE_FROST_HIT],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
