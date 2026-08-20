// Placeholder (validated: false). Wiki: combo skill opened from Umbrella's
// first/second heavy-attack recovery. 0.2s cooldown. Multiplier block has not
// been captured in-game yet — revert to zero placeholders so this skill is
// inert (contributes no DPS) until the user pastes the verbatim tooltip.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const umbHeavyLight = defineSkill({
  id: SKILL.umbHeavyLight,
  classId: "silkbindJade",
  name: "Umb HeavyLight",
  abilityTag: "Umb HeavyLight",
  tags: [WEAPON.umbrella, ATTACK.mixed],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbHeavyLight,
  castFrames: 75,
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
    hit(1, {
      frame: 25,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [],
    }),
    hit(2, {
      frame: 50,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
})
