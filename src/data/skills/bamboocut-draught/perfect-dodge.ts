import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"

// In-game talent text, 2026-09-06: a Perfect Dodge restores 5 Binge Points
// while Carouse is up, at most once per second — shared by both dodge
// variants so the cooldown (keyed by trigger identity) holds across them.
export const bingePointDodgeGrant = applyBuff({
  target: STATUS.bingePoints,
  stacks: 5,
  condition: { buffId: STATUS.carouse, op: "gte", stacks: 1 },
  cooldownFrames: 60,
})

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
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [bingePointDodgeGrant],
    }),
  ],
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
