// Placeholder (validated: false). Wiki: Umbrella's Charged Skill "Spring
// Away" — listed by Blossom Barrage as one of the affected Combo-bonus
// recipients. At TB4: when it hits a target with Combo, +10% damage and
// max targets 3 → 5.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const springAway = defineSkill({
  id: SKILL.springAway,
  classId: "silkbindJade",
  name: "Spring Away",
  abilityTag: "Spring Away",
  tags: [PROP.isBallistic, PROP.isCharged, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.springAway,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [],
    }),
  ],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
