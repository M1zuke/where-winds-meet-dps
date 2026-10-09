import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"
import { ANXI_SOLDIER_BLADE_MOMENTUM_GAIN } from "./buffs/anxiSoldierBladeMomentumGain"

export const anxisoldiermodown = defineSkill({
  id: SKILL.anxisoldiermodown,
  classId: "stonesplitStrength",
  name: "AnxiSoldierMoDown",
  tags: [
    WEAPON.moBlade,
    PROP.cleftpeakBoost,
    ATTUNE.phalanxbaneCharged,
    ROLE.anxiSoldier,
    ROLE.anxiSoldierMoDown,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.anxiSoldierMoDown,
  receives: [
    BUFF.mountainSplitter,
    BUFF.cleftpeakDeflect,
    BUFF.etherwrathPenetrationBoost,
    ...PHALANXBANE_BLADE_RECEIVES,
  ],
  triggersBuffs: [BUFF.throatPierced, BUFF.mountainSplitter],
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5,
      attributeMultiplier: 0.75,
      physFixed: 0,
      attributeFixed: 0,
      // In-game values as of 2026-09-25: every Anxi soldier attack.
      qiRate: 0.3,
      triggers: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
