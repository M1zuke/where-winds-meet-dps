import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const umbDroneLaunch26Hit = defineSkill({
  id: SKILL.umbDroneLaunch26Hit,
  classId: "silkbindJade",
  name: "UmbDroneLaunch[26hit]",
  abilityTag: "UmbDroneLaunch[26hit]",
  tags: [WEAPON.umbrella, "prop:hasQiBreakPhysPen", "attack:heavy", "role:umbDrone", "role:umbDroneLaunch"],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbDroneLaunch26hit,
  castFrames: 68,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5396,
      attributeMultiplier: 0.8094,
      physFixed: 124,
      attributeFixed: 69,
      extraCritDamage: 1,
      triggers: [
        applyDebuff({ target: DEBUFF.umbDrone26Hit, stacks: 1 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
