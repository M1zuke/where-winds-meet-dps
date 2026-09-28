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
  // covers it — a separate live-window check would never add a case. Stage 3
  // itself needs Steadfast Devotion equipped at all — held past the stage-2
  // threshold with no talent, the charge still releases stage 2 (in-game
  // values as of 2026-09-24).
  castConditions: [
    { param: PARAM.steadfastDevotion, minTier: 1 },
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
  // Cast length to the earliest next input for a full Inner Passion (1.5×
  // charge speed) hold to the stage-3 threshold (in-game values as of
  // 2026-09-24).
  castFrames: 142,
  triggerable: true,
  // In-game values as of 2026-09-28: 4.5 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // The downward- and leaping-slash Mo Blade Anxi Soldier cues fire during
  // the hold, ahead of the slam itself (in-game values as of 2026-09-24).
  hits: [
    hit(0, {
      frame: 57,
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
      frame: 81,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        castSkill({
          target: SKILL.anxisoldiermojump,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
          requiresParam: PARAM.steadfastDevotion,
          requiresMinTier: 1,
        }),
      ],
    }),
    hit(2, {
      frame: 120,
      physMultiplier: 1.7199,
      attributeMultiplier: 2.5798,
      physFixed: 475,
      attributeFixed: 259,
    }),
    hit(3, {
      frame: 129,
      physMultiplier: 4.0131,
      attributeMultiplier: 6.0196,
      physFixed: 1110,
      attributeFixed: 604,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
