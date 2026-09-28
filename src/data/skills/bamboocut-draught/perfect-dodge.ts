import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, meterDelta } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { enduranceCost, enduranceMeter, enduranceRequires } from "../../resources/enduranceMeter"

// In-game talent text, 2026-09-06: a Perfect Dodge restores 5 Binge Points
// while Carouse and Binge Points ≥ 100 both hold (in-game values as of
// 2026-09-16), at most once per second — shared by both dodge variants so
// the cooldown (keyed by trigger identity) holds across them.
export const bingePointDodgeGrant = applyBuff({
  target: STATUS.bingePoints,
  stacks: 5,
  conditions: [
    { buffId: STATUS.carouse, op: "gte", stacks: 1 },
    { buffId: STATUS.bingePoints, op: "gte", stacks: 100 },
  ],
  cooldownFrames: 60,
})

// In-game values as of 2026-09-26: gauntlets' own Perfect Dodge, +5 Endurance
// on a successful dodge, unlike every other weapon's own costly dodge.
export const gauntletsPerfectDodgeGain = meterDelta({ target: enduranceMeter.id, stacks: 5 })

export const perfectDodge = defineSkill({
  id: SKILL.perfectDodge,
  classId: "bamboocutDraught",
  name: "Perfect Dodge",
  tags: [WEAPON.none],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Bamboocut",
  castTag: CAST.perfectDodge,
  triggersBuffs: [BUFF.mirageBonus, BUFF.disintegration],
  castFrames: 0,
  triggerable: true,
  castConditions: [enduranceRequires("gte", 15)],
  meterCosts: [enduranceCost(15)],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [bingePointDodgeGrant, gauntletsPerfectDodgeGain],
    }),
  ],
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
