// Placeholder (validated: false). Wiki: Vernal Umbrella's Martial Arts Skill
// — Blossom Barrage's central skill. The base spec says it can hold up to 2
// stacks (3 at TB6), grants the Combo debuff on hit, and has reduced CD via
// the TB6 trigger. Multipliers authored when the reference data lands.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const springSorrow = defineSkill({
  id: SKILL.springSorrow,
  classId: "silkbindJade",
  name: "Spring Sorrow",
  abilityTag: "Spring Sorrow",
  tags: [PROP.isBallistic, WEAPON.umbrella, ATTACK.heavy, ATTUNE.umbCharged],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.springSorrow,
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
