import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// Vernal Umbrella's Light Attack Varied Combo: a heavy-attack tap during the
// recovery of light stage 1 or 2 throws a spinning umbrella for two hits.
// In-game values as of 2026-09-24.
export const bambooBreeze = defineSkill({
  id: SKILL.bambooBreeze,
  classId: "silkbindJade",
  name: "Bamboo Breeze",
  tags: [WEAPON.umbrella, ATTACK.mixed, ATTUNE.umbLightHeavyVariedCombo],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.bambooBreeze,
  receives: [...VERNAL_UMBRELLA_RECEIVES],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 62,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 11,
      physMultiplier: 0.49758,
      attributeMultiplier: 0.74637,
      physFixed: 138.0,
      attributeFixed: 75.0,
    }),
    hit(1, {
      // The second hit is an overlap check, at least 6 f after the first —
      // no exact frame in the data (this class's own evidence); authored at
      // that earliest-possible offset.
      frame: 17,
      physMultiplier: 0.49758,
      attributeMultiplier: 0.74637,
      physFixed: 138.0,
      attributeFixed: 75.0,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
