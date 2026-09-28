import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill, clearStatus, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../classes/stonesplit-strength/bladeMomentumMeter"

export const snowpartingvcPrepull = defineSkill({
  id: SKILL.snowpartingvcPrepull,
  classId: "stonesplitStrength",
  name: "SnowpartingVC Prepull",
  tags: [
    PROP.consumesInnerPassion,
    PROP.cleftpeakBoost,
    WEAPON.hengBlade,
    ATTACK.heavy,
    ATTUNE.snowpartingVariedCombo,
    ROLE.snowpartingVC,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingVCPrepull,
  startLatency: "noWaitOnDummy",
  castConditions: [
    { buffId: BUFF.snowbreakSpringAvailable, op: "gte", stacks: 1 },
    bladeMomentumRequires("gte", 25),
  ],
  meterCosts: [{ meterId: bladeMomentumMeter.id, amount: 25 }],
  receives: [
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
    BUFF.frostCladSnowbreak,
    BUFF.frostCladSnowbreakIPConsume,
    BUFF.frostCladSnowbreakT6,
    BUFF.cleftpeakDeflect,
    ...SNOWPARTING_BLADE_RECEIVES,
  ],
  triggersBuffs: [BUFF.throatPierced],
  castFrames: 6,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.07686,
      attributeMultiplier: 3.11529,
      physFixed: 575,
      attributeFixed: 313,
      triggers: [
        applyBuff({ target: BUFF.snowbreakSpringCooldown, requiresParam: PARAM.frostCladNight }),
        castSkill({
          target: SKILL.anxisoldierheng,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 1,
        }),
        applyBuff({
          target: BUFF.forgetfulness,
          condition: { buffId: BUFF.forgetfulnessCooldown, op: "eq", stacks: 0 },
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
        clearStatus({
          target: BUFF.forgetfulnessCooldown,
          phase: "exhausted",
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
        meterDelta({
          target: bladeMomentumMeter.id,
          stacks: 12.5,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 3,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
