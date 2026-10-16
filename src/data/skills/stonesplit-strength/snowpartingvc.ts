import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill, clearStatus, meterDelta } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../classes/stonesplit-strength/bladeMomentumMeter"

// In-game values as of 2026-10-15.
export const snowpartingvc = defineSkill({
  id: SKILL.snowpartingvc,
  classId: "stonesplitStrength",
  name: "SnowpartingVC",
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
  castTag: CAST.snowpartingVC,
  castConditions: [
    { buffId: BUFF.snowbreakSpringAvailable, op: "gte", stacks: 1 },
    { buffId: BUFF.snowbreakSpringCooldown, op: "eq", stacks: 0 },
    bladeMomentumRequires("gte", 25),
  ],
  // In-game values as of 2026-09-25: 1 bar (25) spent at the cast's own start.
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
  castFrames: 52,
  triggerable: true,
  // In-game values as of 2026-09-28: 4.5 m approach reach, plus a further
  // 1 m shrink-only pull once in range.
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({ target: BUFF.snowbreakSpringCooldown, requiresParam: PARAM.frostCladNight }),
        clearStatus({
          target: BUFF.snowbreakSpringAvailable,
          requiresParam: PARAM.frostCladNight,
        }),
      ],
    }),
    hit(1, {
      frame: 30,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({
          target: BUFF.forgetfulness,
          condition: { buffId: BUFF.forgetfulnessCooldown, op: "eq", stacks: 0 },
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
      ],
    }),
    hit(2, {
      frame: 34,
      physMultiplier: 2.07686,
      attributeMultiplier: 3.11529,
      physFixed: 575,
      attributeFixed: 313,
      triggers: [
        castSkill({
          target: SKILL.anxisoldierheng,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 1,
        }),
        applyBuff({
          target: STATUS.dread,
          stacks: 0,
          extendFrames: 120,
          extendOnly: true,
          phase: "exhausted",
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 6,
        }),
        applyBuff({
          target: BUFF.forgetfulness,
          phase: "exhausted",
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
  updatedAt: "2026-10-15T00:00:00.000Z",
})
