import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const phalanxchargedS1 = defineSkill({
  id: SKILL.phalanxchargedS1,
  classId: "stonesplitStrength",
  name: "PhalanxCharged-S1",
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
  castTag: CAST.phalanxChargedS1,
  receives: [
    BUFF.mountainSplitter,
    BUFF.mountainSplitterExhausted,
    BUFF.cleftpeakDeflect,
    BUFF.burningHeartLowStageConsume,
    ...PHALANXBANE_BLADE_RECEIVES,
  ],
  triggersBuffs: [BUFF.throatPierced, BUFF.chargeEnhancement],
  castFrames: 79,
  triggerable: true,
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 48,
      physMultiplier: 0.397233,
      attributeMultiplier: 0.59585,
      physFixed: 110.1,
      attributeFixed: 60,
    }),
    hit(1, {
      frame: 55,
      physMultiplier: 0.926877,
      attributeMultiplier: 1.390316,
      physFixed: 256.9,
      attributeFixed: 140,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
