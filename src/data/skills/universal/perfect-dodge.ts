import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { enduranceCost, enduranceRequires } from "../../resources/enduranceMeter"

export const perfectDodge = defineSkill({
  id: SKILL.perfectDodge,
  classId: "universal",
  name: "Perfect Dodge",
  tags: [WEAPON.none],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.perfectDodge,
  triggersBuffs: [BUFF.mirageBonus, BUFF.disintegration],
  castFrames: 0,
  triggerable: true,
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
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
