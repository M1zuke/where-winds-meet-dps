import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"
import { CALMWATERS_PERFECT_DODGE_GAIN } from "./buffs/calmwatersPerfectDodgeGain"
import { EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS } from "./buffs/evasiveChargeDodgeRefund"
import { GHOSTLY_AFTERIMAGE_TRIGGER } from "./buffs/ghostlyAfterimage"

export const perfectDodgeFull = defineSkill({
  id: SKILL.perfectDodgeFull,
  classId: "universal",
  name: "Perfect Dodge[Full]",
  tags: [WEAPON.none],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.perfectDodgeFull,
  triggersBuffs: [BUFF.mirageBonus, BUFF.disintegration],
  castFrames: 50,
  triggerable: true,
  // In-game values as of 2026-09-28: dodge and Perfect Dodge move in the
  // player's own input direction — modelled as no change, an assumption. A
  // large reach keeps this stationary cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  // In-game values as of 2026-09-26: every weapon's own dodge costs 15,
  // needing at least 15 — gauntlets' own +5 gain instead is Bamboocut
  // Draught's own override of this skill.
  castConditions: [enduranceRequires("gte", 15)],
  meterCosts: [enduranceCost(15)],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [CALMWATERS_PERFECT_DODGE_GAIN, ...EVASIVE_CHARGE_DODGE_REFUND_TRIGGERS, GHOSTLY_AFTERIMAGE_TRIGGER],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
