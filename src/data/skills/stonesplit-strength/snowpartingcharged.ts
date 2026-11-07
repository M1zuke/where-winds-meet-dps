import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"
import { bladeMomentumMeter } from "../../classes/stonesplit-strength/bladeMomentumMeter"

const GRAVE_FROST_HIT = meterDelta({ target: bladeMomentumMeter.id, stacks: 3.25 })

const STRIKE = {
  physMultiplier: 0.489916,
  attributeMultiplier: 0.734874,
  physFixed: 135.6,
  attributeFixed: 73.8,
}

export const snowpartingcharged = defineSkill({
  id: SKILL.snowpartingcharged,
  classId: "stonesplitStrength",
  name: "SnowpartingCharged",
  tags: [PROP.isCharged, WEAPON.hengBlade, ATTACK.charge, ATTUNE.snowpartingCharged],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingCharged,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  // In-game values as of 2026-10-15: the hold registers 15 Endurance and is
  // offered only above 15 and only when the press does not resolve to the free
  // Forgetfulness form.
  castConditions: [
    enduranceRequires("gt", 15),
    {
      anyOf: [
        { buffId: BUFF.forgetfulness, op: "lt", stacks: 1 },
        { buffId: BUFF.forgetfulnessCooldown, op: "gte", stacks: 1 },
      ],
    },
  ],
  meterCosts: [enduranceCost(15)],
  castFrames: 97,
  triggerable: true,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, { frame: 50, ...STRIKE, triggers: [GRAVE_FROST_HIT] }),
    hit(1, { frame: 63, ...STRIKE, triggers: [GRAVE_FROST_HIT] }),
    hit(2, { frame: 70, ...STRIKE, triggers: [GRAVE_FROST_HIT] }),
    hit(3, {
      frame: 83,
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
    hit(4, {
      frame: 96,
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
