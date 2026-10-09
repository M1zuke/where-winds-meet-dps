import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../classes/stonesplit-strength/bladeMomentumMeter"

// In-game values as of 2026-10-06: the minimum hold to the second charge
// threshold. The soldier frame is the threshold itself, an assumption.
export const phalanxchargedS2 = defineSkill({
  id: SKILL.phalanxchargedS2,
  classId: "stonesplitStrength",
  name: "PhalanxCharged-S2",
  tags: [
    PROP.isCharged,
    PROP.cleftpeakBoost,
    PROP.consumesInnerPassionBurningHeartLowStage,
    WEAPON.moBlade,
    ATTACK.charge,
    ATTUNE.phalanxbaneCharged,
    ROLE.phalanxCharged,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxChargedS2,
  receives: [
    BUFF.mountainSplitter,
    BUFF.mountainSplitterExhausted,
    BUFF.cleftpeakDeflect,
    BUFF.burningHeartLowStageConsume,
    ...PHALANXBANE_BLADE_RECEIVES,
  ],
  triggersBuffs: [BUFF.throatPierced, BUFF.chargeEnhancement],
  castConditions: [bladeMomentumRequires("gt", 50)],
  meterCosts: [{ meterId: bladeMomentumMeter.id, amount: 50 }],
  castFrames: 137,
  triggerable: true,
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 76,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        castSkill({
          target: SKILL.anxisoldiermodown,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
        }),
      ],
    }),
    hit(1, {
      frame: 115,
      physMultiplier: 0.88272,
      attributeMultiplier: 1.32408,
      physFixed: 244.2,
      attributeFixed: 133.2,
    }),
    hit(2, {
      frame: 124,
      physMultiplier: 2.05968,
      attributeMultiplier: 3.08952,
      physFixed: 569.8,
      attributeFixed: 310.8,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
