import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { bingePointDodgeGrant, gauntletsPerfectDodgeGain } from "./perfect-dodge"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"
import { CALMWATERS_PERFECT_DODGE_GAIN } from "../universal/buffs/calmwatersPerfectDodgeGain"
import { EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS } from "../universal/buffs/evasiveChargeDodgeRefund"
import { GHOSTLY_AFTERIMAGE_TRIGGER } from "../universal/buffs/ghostlyAfterimage"

export const perfectDodgeFull = defineSkill({
  id: SKILL.perfectDodgeFull,
  classId: "bamboocutDraught",
  name: "Perfect Dodge[Full]",
  tags: [WEAPON.none],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Bamboocut",
  castTag: CAST.perfectDodgeFull,
  triggersBuffs: [BUFF.mirageBonus, BUFF.disintegration],
  // Cast length to the earliest next input: in-game animation, 2026-09-24.
  castFrames: 25,
  triggerable: true,
  // In-game values as of 2026-09-28: dodge and Perfect Dodge move in the
  // player's own input direction — modelled as no change, an assumption. A
  // large reach keeps this stationary cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  castConditions: [enduranceRequires("gte", 15)],
  meterCosts: [enduranceCost(15)],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        bingePointDodgeGrant,
        gauntletsPerfectDodgeGain,
        CALMWATERS_PERFECT_DODGE_GAIN,
        ...EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS,
        GHOSTLY_AFTERIMAGE_TRIGGER,
      ],
    }),
  ],
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
