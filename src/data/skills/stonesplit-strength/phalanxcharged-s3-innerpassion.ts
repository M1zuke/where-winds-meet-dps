import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../classes/stonesplit-strength/bladeMomentumMeter"

export const phalanxchargedS3Innerpassion = defineSkill({
  id: SKILL.phalanxchargedS3Innerpassion,
  classId: "stonesplitStrength",
  name: "PhalanxCharged-S3[InnerPassion]",
  tags: [
    PROP.isCharged,
    PROP.cleftpeakBoost,
    PROP.consumesInnerPassionBurningHeart,
    WEAPON.moBlade,
    ATTACK.charge,
    ATTUNE.phalanxbaneCharged,
    ROLE.phalanxCharged,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxChargedS3InnerPassion,
  receives: [
    BUFF.mountainSplitter,
    BUFF.mountainSplitterExhausted,
    BUFF.cleftpeakDeflect,
    ...PHALANXBANE_BLADE_RECEIVES,
  ],
  triggersBuffs: [BUFF.throatPierced, BUFF.chargeEnhancement],
  // In-game values as of 2026-09-26: with Inner Passion, Steadfast Devotion
  // tier 4+ releases free of any Blade Momentum requirement or cost; below
  // tier 4 the charge is offered above 25 and spends 25. Every in-app source
  // of Charge Enhancement already requires tier 6, so the tier-4 gate alone
  // covers it — a separate live-window check would never add a case.
  castConditions: [
    { anyOf: [{ param: PARAM.steadfastDevotion, minTier: 4 }, bladeMomentumRequires("gt", 25)] },
  ],
  meterCosts: [
    {
      meterId: bladeMomentumMeter.id,
      amount: 25,
      requiresParam: PARAM.steadfastDevotion,
      requiresMaxTier: 3,
    },
  ],
  castFrames: 138,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.7199,
      attributeMultiplier: 2.5798,
      physFixed: 475,
      attributeFixed: 259,
    }),
    hit(1, {
      frame: 69,
      physMultiplier: 4.0131,
      attributeMultiplier: 6.0196,
      physFixed: 1110,
      attributeFixed: 604,
      triggers: [
        castSkill({
          target: SKILL.anxisoldiermodown,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
