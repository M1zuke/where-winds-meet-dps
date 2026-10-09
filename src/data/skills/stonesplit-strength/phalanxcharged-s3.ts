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

export const phalanxchargedS3 = defineSkill({
  id: SKILL.phalanxchargedS3,
  classId: "stonesplitStrength",
  name: "PhalanxCharged-S3",
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
  castTag: CAST.phalanxChargedS3,
  receives: [
    BUFF.mountainSplitter,
    BUFF.mountainSplitterExhausted,
    BUFF.cleftpeakDeflect,
    ...PHALANXBANE_BLADE_RECEIVES,
  ],
  triggersBuffs: [BUFF.throatPierced, BUFF.chargeEnhancement],
  // In-game values as of 2026-09-25: the stage-2/3 charge is offered only
  // above 50 Blade Momentum, and spends 50 at the release. Stage 3 itself
  // needs Steadfast Devotion equipped at all — held past the stage-2
  // threshold with no talent, the charge still releases stage 2 (in-game
  // values as of 2026-09-24).
  castConditions: [{ param: PARAM.steadfastDevotion, minTier: 1 }, bladeMomentumRequires("gt", 50)],
  meterCosts: [{ meterId: bladeMomentumMeter.id, amount: 50 }],
  // Cast length to the earliest next input for a full hold to the stage-3
  // threshold (in-game values as of 2026-09-24).
  castFrames: 173,
  triggerable: true,
  // In-game values as of 2026-09-28: 4.5 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // The downward- and leaping-slash Mo Blade Anxi Soldier cues fire during
  // the hold, ahead of the slam itself (in-game values as of 2026-09-24).
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
      frame: 112,
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
      frame: 151,
      physMultiplier: 1.7199,
      attributeMultiplier: 2.5798,
      physFixed: 475.8,
      attributeFixed: 259.2,
    }),
    hit(3, {
      frame: 160,
      physMultiplier: 4.0131,
      attributeMultiplier: 6.0196,
      physFixed: 1110.2,
      attributeFixed: 604.8,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
